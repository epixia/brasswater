import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  Wrench,
  Users,
  ShieldCheck,
  Package,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

function useTransparentLogo(src) {
  const [logoSrc, setLogoSrc] = useState(src);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const bgR = data[0], bgG = data[1], bgB = data[2];
      const tolerance = 20;
      for (let i = 0; i < data.length; i += 4) {
        if (
          Math.abs(data[i] - bgR) < tolerance &&
          Math.abs(data[i + 1] - bgG) < tolerance &&
          Math.abs(data[i + 2] - bgB) < tolerance
        ) {
          data[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setLogoSrc(canvas.toDataURL('image/png'));
    };
    img.src = src;
  }, [src]);
  return logoSrc;
}

function useNavCounts() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [overdueRes, openWoRes, nonCompliantRes] = await Promise.all([
        supabase
          .from('scheduled_inspections')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'overdue'),
        supabase
          .from('work_orders')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("completed","closed")'),
        supabase
          .from('compliance_requirements')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'non_compliant'),
      ]);
      if (!cancelled) {
        setCounts({
          inspections: overdueRes.count || 0,
          workOrders: openWoRes.count || 0,
          compliance: nonCompliantRes.count || 0,
        });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return counts;
}

function NavBadge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-500/20 px-1.5 text-[10px] font-semibold text-sky-400 tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function buildNavSections(counts) {
  return [
    {
      label: 'MAIN',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { to: '/buildings', icon: Building2, label: 'Buildings' },
        { to: '/inspections', icon: ClipboardCheck, label: 'Inspections', count: counts.inspections },
        { to: '/work-orders', icon: Wrench, label: 'Work Orders', count: counts.workOrders },
      ],
    },
    {
      label: 'OPERATIONS',
      items: [
        { to: '/contractors', icon: Users, label: 'Contractors' },
        { to: '/compliance', icon: ShieldCheck, label: 'Compliance', count: counts.compliance },
        { to: '/inventory', icon: Package, label: 'Inventory' },
      ],
    },
  ];
}


export default function Sidebar({ isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const logoSrc = useTransparentLogo('/logo/brasswater-dark.png');
  const counts = useNavCounts();
  const navSections = buildNavSections(counts);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[272px] flex-col
          bg-[#0b1120]/95 backdrop-blur-2xl border-r border-white/5
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <img
            src={logoSrc}
            alt="BrassWater"
            className="w-28 h-auto object-contain"
          />

          {/* Close button – mobile only */}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.15em] text-gray-400 uppercase">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className={`
                          group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                          transition-all duration-150
                          ${
                            isActive
                              ? 'bg-white/10 text-white border-l-2 border-sky-400'
                              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-l-2 border-transparent'
                          }
                        `}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 transition-colors ${
                            isActive ? 'text-sky-400' : 'text-gray-500 group-hover:text-gray-300'
                          }`}
                        />
                        {item.label}
                        <NavBadge count={item.count} />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom area */}
        <div className="border-t border-white/5 px-4 py-4 space-y-4">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400
                       hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <span className="relative h-5 w-5">
              <Sun
                size={18}
                className={`absolute inset-0 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-0 opacity-0'
                }`}
              />
              <Moon
                size={18}
                className={`absolute inset-0 transition-all duration-300 ${
                  theme === 'light'
                    ? 'rotate-0 scale-100 opacity-100'
                    : 'rotate-90 scale-0 opacity-0'
                }`}
              />
            </span>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {/* User section */}
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white">
              ML
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-white">
                Marc Lefebvre
              </span>
              <span className="text-[11px] text-gray-400">Admin</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
