import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Plus,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
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
import { Avatar } from '@/components/ui/avatar';
import { Rating } from '@/components/ui/rating';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  fetchInspections,
  fetchBuildings,
  fetchInspectionTemplates,
  fetchUsers,
  createInspection,
} from '@/lib/dataService';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function Inspections() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  const [buildingFilter, setBuildingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newInspection, setNewInspection] = useState({
    buildingId: '',
    templateId: '',
    date: '',
    assignedTo: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [insp, b, t, u] = await Promise.all([
          fetchInspections(),
          fetchBuildings(),
          fetchInspectionTemplates(),
          fetchUsers(),
        ]);
        setInspections(insp);
        setBuildings(b);
        setTemplates(t);
        setUsers(u);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set();
    templates.forEach((t) => {
      if (t.categoryName) cats.add(t.categoryName);
      else if (t.categoryCode) cats.add(t.categoryCode);
    });
    return Array.from(cats);
  }, [templates]);

  const getTemplateCategory = (insp) => {
    return insp.inspectionTemplates?.categoryName || insp.inspectionTemplates?.categoryCode || 'General';
  };

  const getBuildingName = (insp) => {
    return insp.buildings?.name || buildings.find((b) => b.id === insp.buildingId)?.name || 'Unknown';
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      if (buildingFilter !== 'all' && insp.buildingId !== buildingFilter) return false;
      if (statusFilter !== 'all' && insp.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && getTemplateCategory(insp) !== categoryFilter) return false;
      return true;
    });
  }, [inspections, buildingFilter, statusFilter, categoryFilter, templates]);

  const handleSchedule = async () => {
    if (!newInspection.buildingId || !newInspection.templateId || !newInspection.date) {
      toast({ title: 'Missing fields', description: 'Please fill in building, template, and date.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await createInspection({
        buildingId: newInspection.buildingId,
        templateId: newInspection.templateId,
        scheduledDate: newInspection.date,
        assignedTo: newInspection.assignedTo || null,
        status: 'scheduled',
        notes: newInspection.notes || null,
        rating: null,
      });
      const fresh = await fetchInspections();
      setInspections(fresh);
      setShowScheduleDialog(false);
      setNewInspection({ buildingId: '', templateId: '', date: '', assignedTo: '', notes: '' });
      const bName = buildings.find((b) => b.id === newInspection.buildingId)?.name || 'building';
      toast({ title: 'Inspection scheduled', description: `Inspection for ${bName} has been scheduled.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading inspections...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage property inspections</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setShowScheduleDialog(true)}>
          <Plus className="h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      {/* Filter Bar */}
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
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
              <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredInspections.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No inspections found"
              description="Try adjusting your filters or schedule a new inspection."
              action={
                <Button onClick={() => setShowScheduleDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Schedule Inspection
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((insp) => (
                  <TableRow
                    key={insp.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                  >
                    <TableCell>{formatDate(insp.scheduledDate)}</TableCell>
                    <TableCell className="font-medium">{getBuildingName(insp)}</TableCell>
                    <TableCell>
                      <Badge variant="info">{getTemplateCategory(insp)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={insp.assignedTo || 'Unassigned'} size="sm" />
                        <span>{insp.assignedTo || 'Unassigned'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(insp.status)}>{getStatusLabel(insp.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {insp.status === 'completed' && insp.rating ? (
                        <Rating value={insp.rating} size="sm" />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); navigate(`/inspections/${insp.id}`); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Schedule Inspection Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Building</Label>
              <Select
                value={newInspection.buildingId}
                onChange={(e) => setNewInspection((p) => ({ ...p, buildingId: e.target.value }))}
              >
                <option value="">Select building...</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Inspection Template</Label>
              <Select
                value={newInspection.templateId}
                onChange={(e) => setNewInspection((p) => ({ ...p, templateId: e.target.value }))}
              >
                <option value="">Select template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.categoryName || t.categoryCode}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newInspection.date}
                onChange={(e) => setNewInspection((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Assign To</Label>
              <Select
                value={newInspection.assignedTo}
                onChange={(e) => setNewInspection((p) => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value="">Select person...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={newInspection.notes}
                onChange={(e) => setNewInspection((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleSchedule} disabled={saving}>{saving ? 'Scheduling...' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
