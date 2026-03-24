import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/hooks/useTheme';
import { ToastProvider } from '@/components/ui/toast';
import Layout from '@/components/layout/Layout';

// Lazy-loaded page components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Buildings = lazy(() => import('@/pages/Buildings'));
const BuildingDetail = lazy(() => import('@/pages/BuildingDetail'));
const Inspections = lazy(() => import('@/pages/Inspections'));
const InspectionDetail = lazy(() => import('@/pages/InspectionDetail'));
const WorkOrders = lazy(() => import('@/pages/WorkOrders'));
const Contractors = lazy(() => import('@/pages/Contractors'));
const Compliance = lazy(() => import('@/pages/Compliance'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const InventoryScan = lazy(() => import('@/pages/InventoryScan'));

function LoadingSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-sky-200 dark:border-sky-900" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sky-500" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/buildings" element={<Buildings />} />
                <Route path="/buildings/:id" element={<BuildingDetail />} />
                <Route path="/inspections" element={<Inspections />} />
                <Route path="/inspections/:id" element={<InspectionDetail />} />
                <Route path="/work-orders" element={<WorkOrders />} />
                <Route path="/contractors" element={<Contractors />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/inventory" element={<Inventory />} />
              </Route>

              {/* Standalone scan page — no sidebar, mobile-friendly */}
              <Route path="/inventory/scan/:assetTag" element={<InventoryScan />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
