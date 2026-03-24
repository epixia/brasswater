import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Shield,
  FileText,
  CheckCircle,
  ArrowRight,
  LogOut,
  LogIn,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { Avatar } from '@/components/ui/avatar';
import {
  fetchDashboardStats,
  fetchInspections,
  fetchWorkOrders,
  fetchCompliance,
  fetchCheckoutHistory,
  fetchBuildings,
  fetchInventoryItems,
} from '@/lib/dataService';
const BuildingMap = lazy(() => import('@/components/dashboard/BuildingMap'));
import { cn, formatDate, formatTimestamp, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashStats, setDashStats] = useState(null);
  const [allInspections, setAllInspections] = useState([]);
  const [allWorkOrders, setAllWorkOrders] = useState([]);
  const [allCompliance, setAllCompliance] = useState([]);
  const [checkoutHistory, setCheckoutHistory] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [ds, insp, wo, comp, chk, blds, inv] = await Promise.all([
          fetchDashboardStats(),
          fetchInspections(),
          fetchWorkOrders(),
          fetchCompliance(),
          fetchCheckoutHistory(),
          fetchBuildings(),
          fetchInventoryItems(),
        ]);
        setDashStats(ds);
        setAllInspections(insp);
        setAllWorkOrders(wo);
        setAllCompliance(comp);
        setCheckoutHistory(chk);
        setBuildings(blds);
        setInventoryItems(inv);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const inspectionsByStatus = useMemo(() => {
    const counts = { scheduled: 0, in_progress: 0, completed: 0, overdue: 0 };
    allInspections.forEach((i) => {
      if (counts[i.status] !== undefined) counts[i.status]++;
    });
    return counts;
  }, [allInspections]);

  const workOrdersByType = useMemo(() => {
    const counts = { emergency: 0, priority: 0, routine: 0, maintenance: 0 };
    allWorkOrders.forEach((wo) => {
      const t = (wo.type || '').toLowerCase();
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [allWorkOrders]);

  const complianceOverview = useMemo(() => {
    const counts = { compliant: 0, due_soon: 0, overdue: 0, non_compliant: 0 };
    allCompliance.forEach((c) => {
      if (counts[c.status] !== undefined) counts[c.status]++;
    });
    return counts;
  }, [allCompliance]);

  const totalInspections = allInspections.length || 1;
  const totalWO = allWorkOrders.length || 1;

  const activityFeed = useMemo(() => {
    const entries = [];

    // Work orders
    allWorkOrders.forEach((wo) => {
      if (!wo.createdAt) return;
      const typeLabel = wo.type ? wo.type.charAt(0).toUpperCase() + wo.type.slice(1) : 'Work';
      entries.push({
        id: `wo-${wo.id}`,
        icon: Wrench,
        iconColor: wo.type === 'emergency' ? 'text-red-400' : wo.type === 'priority' ? 'text-amber-400' : 'text-blue-400',
        iconBg: wo.type === 'emergency' ? 'bg-red-500/15' : wo.type === 'priority' ? 'bg-amber-500/15' : 'bg-blue-500/15',
        title: wo.title || 'Work Order',
        detail: `${typeLabel} · ${wo.buildings?.name || 'Unknown building'}`,
        timestamp: wo.createdAt,
      });
    });

    // Equipment checkout / checkin movements
    checkoutHistory.forEach((entry) => {
      const itemName = entry.inventoryItems?.name || 'Equipment';
      const assetTag = entry.inventoryItems?.assetTag ? ` (${entry.inventoryItems.assetTag})` : '';
      const isOut = entry.action === 'checkout';
      entries.push({
        id: `chk-${entry.id}`,
        icon: isOut ? LogOut : LogIn,
        iconColor: isOut ? 'text-amber-400' : 'text-green-400',
        iconBg: isOut ? 'bg-amber-500/15' : 'bg-green-500/15',
        title: `${itemName}${assetTag}`,
        detail: `${isOut ? 'Checked out by' : 'Returned by'} ${entry.personName || 'Unknown'}`,
        timestamp: entry.date,
      });
    });

    // Completed inspections
    allInspections
      .filter((i) => i.status === 'completed' && (i.completedDate || i.scheduledDate))
      .forEach((insp) => {
        const category = insp.inspectionTemplates?.categoryName || insp.inspectionTemplates?.categoryCode || 'General';
        entries.push({
          id: `insp-${insp.id}`,
          icon: ClipboardCheck,
          iconColor: 'text-cyan-400',
          iconBg: 'bg-cyan-500/15',
          title: `${insp.buildings?.name || 'Building'} inspection`,
          detail: `${category} · ${insp.assignedTo || 'Unassigned'}`,
          timestamp: insp.completedDate || insp.scheduledDate,
        });
      });

    return entries
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }, [allWorkOrders, checkoutHistory, allInspections]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const stats = {
    buildingCount: dashStats?.buildingCount || 0,
    inspectionsThisMonth: dashStats?.inspectionsThisMonth || 0,
    overdueInspections: dashStats?.overdueInspections || 0,
    openWorkOrders: dashStats?.openWorkOrders || 0,
    complianceRate: dashStats?.complianceRate || 100,
  };
  const upcomingInspections = dashStats?.upcomingInspections || [];
  const recentActivity = dashStats?.recentActivity || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your property maintenance operations
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Building2}
          label="Buildings"
          value={stats.buildingCount}
          trend={null}
          trendLabel="Total properties"
          accentColor="blue"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Inspections This Month"
          value={stats.inspectionsThisMonth}
          trend={null}
          trendLabel="Scheduled & completed"
          accentColor="cyan"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Inspections"
          value={stats.overdueInspections}
          trend={null}
          trendLabel={stats.overdueInspections > 0 ? 'Requires attention' : 'All on track'}
          accentColor={stats.overdueInspections > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={Wrench}
          label="Open Work Orders"
          value={stats.openWorkOrders}
          trend={null}
          trendLabel="In progress"
          accentColor="amber"
        />
        <StatCard
          icon={Shield}
          label="Compliance Rate"
          value={`${stats.complianceRate}%`}
          trend={null}
          trendLabel="Overall compliance"
          accentColor="green"
        />
      </div>

      {/* Building Map */}
      <div className="rounded-xl bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-gray-200/60 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Building Locations</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/buildings')}
            className="gap-1"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div style={{ height: '400px', position: 'relative' }}>
          <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading map...</div>}>
            <BuildingMap buildings={buildings} inventoryItems={inventoryItems} />
          </Suspense>
        </div>
      </div>

      {/* Three stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inspections by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inspections by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'scheduled', label: 'Scheduled', color: 'bg-blue-500' },
              { key: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
              { key: 'completed', label: 'Completed', color: 'bg-green-500' },
              { key: 'overdue', label: 'Overdue', color: 'bg-red-500' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{label}</span>
                  <span className="font-medium">{inspectionsByStatus[key]}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', color)}
                    style={{
                      width: `${(inspectionsByStatus[key] / totalInspections) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Work Orders by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Work Orders by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'emergency', label: 'Emergency', color: 'bg-red-500' },
              { key: 'priority', label: 'Priority', color: 'bg-amber-500' },
              { key: 'routine', label: 'Routine', color: 'bg-blue-500' },
              { key: 'maintenance', label: 'Maintenance', color: 'bg-green-500' },
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-3 w-3 rounded-full', color)} />
                  <span className="text-sm">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{workOrdersByType[key]}</span>
                  <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', color)}
                      style={{
                        width: `${(workOrdersByType[key] / totalWO) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-4">
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/10"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${(stats.complianceRate / 100) * 264} 264`}
                    strokeLinecap="round"
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{stats.complianceRate}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { key: 'compliant', label: 'Compliant', color: 'bg-green-500' },
                { key: 'due_soon', label: 'Due Soon', color: 'bg-amber-500' },
                { key: 'overdue', label: 'Overdue', color: 'bg-red-500' },
                { key: 'non_compliant', label: 'Non-Compliant', color: 'bg-red-700' },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
                    <span>{label}</span>
                  </div>
                  <span className="font-medium">{complianceOverview[key]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Upcoming Inspections & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Upcoming Inspections</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/inspections')}
              className="gap-1"
            >
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingInspections.map((insp) => (
                <div
                  key={insp.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/inspections/${insp.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                      <span className="text-[10px] font-semibold uppercase leading-none">
                        {new Date(insp.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold leading-tight">
                        {new Date(insp.scheduledDate).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {insp.buildings?.name || 'Unknown Building'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insp.inspectionTemplates?.categoryName || insp.inspectionTemplates?.categoryCode || 'General'}
                        {insp.assignedTo ? ` · ${insp.assignedTo}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getStatusColor(insp.status)}>
                      {getStatusLabel(insp.status)}
                    </Badge>
                  </div>
                </div>
              ))}
              {upcomingInspections.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming inspections scheduled
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityFeed.map((entry) => {
                const Icon = entry.icon;
                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', entry.iconBg)}>
                      <Icon className={cn('h-4 w-4', entry.iconColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.detail}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {formatTimestamp(entry.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {activityFeed.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
