import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const geocodeCache = {};

async function geocodeAddress(address) {
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const json = await res.json();
    if (json.features && json.features.length > 0) {
      const [lng, lat] = json.features[0].center;
      geocodeCache[address] = { lng, lat };
      return { lng, lat };
    }
  } catch {
    // ignore geocoding failures
  }
  return null;
}

function createPopupDOM(bld, invCount) {
  const hasInventory = invCount > 0;

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'font-family: system-ui, sans-serif; min-width: 180px;';

  const name = document.createElement('div');
  name.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #f8fafc;';
  name.textContent = bld.name;
  wrapper.appendChild(name);

  const addr = document.createElement('div');
  addr.style.cssText = 'font-size: 12px; color: #94a3b8; margin-bottom: 8px;';
  addr.textContent = bld.address || '';
  wrapper.appendChild(addr);

  const stats = document.createElement('div');
  stats.style.cssText = 'display: flex; gap: 12px; font-size: 12px; margin-bottom: 8px;';
  const units = document.createElement('span');
  units.style.color = '#94a3b8';
  const unitsB = document.createElement('strong');
  unitsB.style.color = '#e2e8f0';
  unitsB.textContent = String(bld.units || 0);
  units.appendChild(unitsB);
  units.append(' units');
  const floors = document.createElement('span');
  floors.style.color = '#94a3b8';
  const floorsB = document.createElement('strong');
  floorsB.style.color = '#e2e8f0';
  floorsB.textContent = String(bld.floors || 0);
  floors.appendChild(floorsB);
  floors.append(' floors');
  stats.appendChild(units);
  stats.appendChild(floors);
  wrapper.appendChild(stats);

  const inv = document.createElement('div');
  inv.style.cssText = `font-size: 12px; color: ${hasInventory ? '#38bdf8' : '#94a3b8'}; margin-bottom: 8px;`;
  inv.textContent = hasInventory ? `${invCount} inventory item${invCount > 1 ? 's' : ''}` : 'No inventory';
  wrapper.appendChild(inv);

  const link = document.createElement('a');
  link.href = `/buildings/${bld.id}`;
  link.style.cssText = 'font-size: 12px; color: #0ea5e9; text-decoration: none; font-weight: 500;';
  link.textContent = 'View Details \u2192';
  wrapper.appendChild(link);

  return wrapper;
}

function createMarkerElement(hasInventory) {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.15s;
    background: ${hasInventory ? '#0ea5e9' : '#6b7280'};
    border: 3px solid ${hasInventory ? '#38bdf8' : '#9ca3af'};
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'white');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  ['M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z',
   'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2',
   'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2',
   'M10 6h4', 'M10 10h4', 'M10 14h4', 'M10 18h4',
  ].forEach((d) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  });
  el.appendChild(svg);
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.2)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
  return el;
}

export default function BuildingMap({ buildings, inventoryItems }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const inventoryByBuilding = {};
  (inventoryItems || []).forEach((item) => {
    const loc = item.lastLocation;
    if (loc) {
      inventoryByBuilding[loc] = (inventoryByBuilding[loc] || 0) + 1;
    }
  });

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-73.5674, 45.5019],
      zoom: 11,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.on('load', () => {
      mapRef.current = map;
      setMapReady(true);
    });
    return () => {
      markersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !buildings || buildings.length === 0) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoords = false;

    async function placeMarkers() {
      for (const bld of buildings) {
        const fullAddress = [bld.address, bld.city, bld.province, bld.postalCode]
          .filter(Boolean)
          .join(', ');
        if (!fullAddress.trim()) continue;
        const coords = await geocodeAddress(fullAddress);
        if (!coords) continue;
        hasValidCoords = true;
        bounds.extend([coords.lng, coords.lat]);
        const invCount = inventoryByBuilding[bld.id] || 0;
        const el = createMarkerElement(invCount > 0);
        const popupNode = createPopupDOM(bld, invCount);
        const popup = new mapboxgl.Popup({
          offset: 20,
          closeButton: true,
          closeOnClick: false,
          className: 'building-popup',
        }).setDOMContent(popupNode);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([coords.lng, coords.lat])
          .setPopup(popup)
          .addTo(mapRef.current);
        markersRef.current.push(marker);
      }
      if (hasValidCoords && mapRef.current) {
        if (markersRef.current.length === 1) {
          mapRef.current.flyTo({ center: bounds.getCenter(), zoom: 14 });
        } else {
          mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
        }
      }
    }
    placeMarkers();
  }, [mapReady, buildings, inventoryItems]);

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-3 right-3 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1 border border-white/10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-sky-500 border-2 border-sky-400" />
          <span className="text-gray-300">Has inventory</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-500 border-2 border-gray-400" />
          <span className="text-gray-300">No inventory</span>
        </div>
      </div>
      <style>{`
        .building-popup .mapboxgl-popup-content {
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .building-popup .mapboxgl-popup-tip {
          border-top-color: #1e293b;
        }
        .building-popup .mapboxgl-popup-close-button {
          color: #94a3b8;
          font-size: 16px;
          padding: 4px 8px;
        }
        .building-popup .mapboxgl-popup-close-button:hover {
          color: #f8fafc;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
