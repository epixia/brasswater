import { useState, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/buildings': 'Buildings',
  '/inspections': 'Inspections',
  '/work-orders': 'Work Orders',
  '/contractors': 'Contractors',
  '/compliance': 'Compliance',
  '/inventory': 'Inventory',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    // Exact match first, then prefix match for detail routes like /buildings/123
    if (PAGE_TITLES[location.pathname]) {
      return PAGE_TITLES[location.pathname];
    }
    const match = Object.keys(PAGE_TITLES).find((path) =>
      location.pathname.startsWith(path)
    );
    return match ? PAGE_TITLES[match] : 'BrassWater';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="ml-0 md:ml-[272px] flex flex-col min-h-screen transition-[margin] duration-300">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={pageTitle}
        />

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
