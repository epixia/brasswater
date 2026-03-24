import { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { fetchCompliance, fetchBuildings, updateCompliance } from '@/lib/dataService';
import { cn, formatDate, getStatusLabel } from '@/lib/utils';

const STATUS_VARIANT = {
  compliant: 'success',
  due_soon: 'warning',
  overdue: 'danger',
  non_compliant: 'danger',
};

const STATUS_ICONS = {
  compliant: CheckCircle,
  due_soon: Clock,
  overdue: AlertTriangle,
  non_compliant: XCircle,
};

export default function Compliance() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editLastCompleted, setEditLastCompleted] = useState('');
  const [editNextDue, setEditNextDue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [comp, b] = await Promise.all([fetchCompliance(), fetchBuildings()]);
        setRequirements(comp);
        setBuildings(b);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overallStats = useMemo(() => {
    const total = requirements.length || 1;
    const compliant = requirements.filter((r) => r.status === 'compliant').length;
    const dueSoon = requirements.filter((r) => r.status === 'due_soon').length;
    const overdue = requirements.filter((r) => r.status === 'overdue' || r.status === 'non_compliant').length;
    return {
      rate: Math.round((compliant / total) * 100),
      compliant,
      dueSoon,
      overdue,
      total: requirements.length,
    };
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (buildingFilter !== 'all' && r.buildingId !== buildingFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [requirements, buildingFilter, statusFilter]);

  const groupedByBuilding = useMemo(() => {
    const groups = {};
    filteredRequirements.forEach((r) => {
      const bId = r.buildingId;
      if (!groups[bId]) {
        const b = buildings.find((b) => b.id === bId) || r.buildings;
        groups[bId] = { building: b, items: [] };
      }
      groups[bId].items.push(r);
    });
    return Object.entries(groups);
  }, [filteredRequirements, buildings]);

  const toggleSection = (buildingId) => {
    setCollapsedSections((prev) => ({ ...prev, [buildingId]: !prev[buildingId] }));
  };

  const openDetail = (item) => {
    setSelectedItem(item);
    setEditStatus(item.status);
    setEditLastCompleted(item.lastCompleted || '');
    setEditNextDue(item.nextDue || '');
    setShowDetailDialog(true);
  };

  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    setSaving(true);
    try {
      await updateCompliance(selectedItem.id, {
        status: editStatus,
        lastCompleted: editLastCompleted || null,
        nextDue: editNextDue || null,
      });
      const fresh = await fetchCompliance();
      setRequirements(fresh);
      setShowDetailDialog(false);
      toast({ title: 'Compliance updated', description: `${selectedItem.name} has been updated.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getBuildingName = (bId) => {
    return buildings.find((b) => b.id === bId)?.name || 'Unknown Building';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading compliance...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Monitor regulatory compliance across all properties
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Shield}
          label="Compliance Rate"
          value={`${overallStats.rate}%`}
          trendLabel={`${overallStats.compliant} of ${overallStats.total} compliant`}
          accentColor="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Compliant"
          value={overallStats.compliant}
          trendLabel="Requirements met"
          accentColor="green"
        />
        <StatCard
          icon={Clock}
          label="Due Soon"
          value={overallStats.dueSoon}
          trendLabel="Requires attention"
          accentColor="amber"
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue"
          value={overallStats.overdue}
          trendLabel="Action needed"
          accentColor={overallStats.overdue > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground mb-1 block">Building</Label>
              <Select value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
                <option value="all">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="due_soon">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="non_compliant">Non-Compliant</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by Building */}
      {groupedByBuilding.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={Shield} title="No compliance requirements found" description="Try adjusting your filters." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByBuilding.map(([buildingId, { building, items }]) => {
            const isCollapsed = collapsedSections[buildingId];
            const buildingCompliant = items.filter((i) => i.status === 'compliant').length;
            const buildingRate = Math.round((buildingCompliant / items.length) * 100);

            return (
              <Card key={buildingId}>
                <CardHeader className="cursor-pointer select-none" onClick={() => toggleSection(buildingId)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isCollapsed ? (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                      <Building2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        {building?.name || getBuildingName(buildingId)}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{items.length} requirements</Badge>
                      <Badge
                        variant={buildingRate >= 90 ? 'success' : buildingRate >= 70 ? 'warning' : 'danger'}
                      >
                        {buildingRate}% compliant
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {!isCollapsed && (
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Standard Code</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Last Completed</TableHead>
                          <TableHead>Next Due</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Responsible</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const StatusIcon = STATUS_ICONS[item.status] || Shield;
                          return (
                            <TableRow key={item.id} className="cursor-pointer" onClick={() => openDetail(item)}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.standardCode || '—'}</Badge>
                              </TableCell>
                              <TableCell>{item.frequency || '—'}</TableCell>
                              <TableCell>{formatDate(item.lastCompleted) || '—'}</TableCell>
                              <TableCell>{formatDate(item.nextDue) || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={STATUS_VARIANT[item.status] || 'secondary'} className="gap-1">
                                  <StatusIcon className="h-3 w-3" />
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.responsibleParty || '—'}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail / Edit Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name || 'Compliance Detail'}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Building</p>
                  <p className="font-medium">{getBuildingName(selectedItem.buildingId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Standard Code</p>
                  <p className="font-medium">{selectedItem.standardCode || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="font-medium">{selectedItem.frequency || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsible Party</p>
                  <p className="font-medium">{selectedItem.responsibleParty || '—'}</p>
                </div>
              </div>

              <hr className="border-border" />

              <div>
                <Label>Status</Label>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="compliant">Compliant</option>
                  <option value="due_soon">Due Soon</option>
                  <option value="overdue">Overdue</option>
                  <option value="non_compliant">Non-Compliant</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Last Completed</Label>
                  <Input type="date" value={editLastCompleted} onChange={(e) => setEditLastCompleted(e.target.value)} />
                </div>
                <div>
                  <Label>Next Due</Label>
                  <Input type="date" value={editNextDue} onChange={(e) => setEditNextDue(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateItem} disabled={saving}>{saving ? 'Saving...' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
