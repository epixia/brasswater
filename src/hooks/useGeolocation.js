import { useState, useCallback } from 'react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export function useGeolocation() {
  const [location, setLocation] = useState(null);   // { lat, lng, address, accuracy }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Reverse geocode via Mapbox
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,place`
          );
          const json = await res.json();
          if (json.features && json.features.length > 0) {
            address = json.features[0].place_name;
          }
        } catch {
          // Keep coordinate string as fallback
        }

        setLocation({ lat, lng, address, accuracy });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Unable to get location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const clear = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { location, loading, error, detect, clear };
}
