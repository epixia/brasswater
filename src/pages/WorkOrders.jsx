import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  LayoutGrid,
  List,
  Building2,
  Eye,
  ChevronRight,
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
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  fetchWorkOrders,
  fetchBuildings,
  createWorkOrder,
  updateWorkOrder,
} from '@/lib/dataService';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

const STATUSES = ['submitted', 'acknowledged', 'approved', 'in_progress', 'completed'];
const STATUS_LABELS = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
};
const STATUS_COLORS = {
  submitted: 'bg-slate-500',
  acknowledged: 'bg-blue-500',
  approved: 'bg-cyan-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-green-500',
};

const TYPE_COLORS = {
  emergency: 'danger',
  priority: 'warning',
  routine: 'info',
  maintenance: 'secondary',
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [viewMode, setViewMode] = useState('kanban');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newOrder, setNewOrder] = useState({
    buildingId: '',
    title: '',
    description: '',
    type: 'routine',
    priority: '3',
  });

  useEffect(() => {
    (async () => {
      try {
        const [wo, b] = await Promise.all([fetchWorkOrders(), fetchBuildings()]);
        setOrders(wo);
        setBuildings(b);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getBuildingName = (order) => order.buildings?.name || buildings.find((b) => b.id === order.buildingId)?.name || 'Unknown';

  const kanbanColumns = useMemo(() => {
    const cols = {};
    STATUSES.forEach((s) => {
      cols[s] = orders.filter((o) => o.status === s);
    });
    return cols;
  }, [orders]);

  const handleCreate = async () => {
    if (!newOrder.buildingId || !newOrder.title) {
      toast({ title: 'Missing fields', description: 'Please fill in building and title.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const created = await createWorkOrder({
        buildingId: newOrder.buildingId,
        title: newOrder.title,
        description: newOrder.description,
        type: newOrder.type,
        priority: Number(newOrder.priority),
        status: 'submitted',
        createdDate: new Date().toISOString().split('T')[0],
        assignedTo: null,
      });
      const fresh = await fetchWorkOrders();
      setOrders(fresh);
      setShowNewDialog(false);
      setNewOrder({ buildingId: '', title: '', description: '', type: 'routine', priority: '3' });
      toast({ title: 'Work order created', description: `"${newOrder.title}" has been submitted.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStatus = async (order) => {
    const currentIdx = STATUSES.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= STATUSES.length - 1) return;
    const nextStatus = STATUSES[currentIdx + 1];
    try {
      await updateWorkOrder(order.id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      toast({ title: 'Status updated', description: `Work order moved to "${STATUS_LABELS[nextStatus]}".` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const priorityDots = (priority) => {
    const p = Number(priority) || 3;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn('h-2 w-2 rounded-full', i <= p ? 'bg-amber-500' : 'bg-gray-200 dark:bg-white/10')}
          />
        ))}
      </div>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading work orders...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage maintenance requests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="rounded-none gap-1"
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none gap-1"
            >
              <List className="h-4 w-4" /> List
            </Button>
          </div>
          <Button className="gap-2" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4" />
            New Work Order
          </Button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto">
          {STATUSES.map((status) => (
            <div key={status} className="min-w-[260px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={cn('h-3 w-3 rounded-full', STATUS_COLORS[status])} />
                <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {kanbanColumns[status]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-3">
                {(kanbanColumns[status] || []).map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    onClick={() => openDetail(order)}
                  >
                    <CardContent className="pt-4 pb-3 space-y-2">
                      <p className="font-medium text-sm leading-snug">{order.title}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{getBuildingName(order)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={TYPE_COLORS[order.type] || 'secondary'} className="text-xs">
                          {order.type}
                        </Badge>
                        {priorityDots(order.priority)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {order.assignedTo ? (
                          <div className="flex items-center gap-1">
                            <Avatar name={order.assignedTo} size="xs" />
                            <span>{order.assignedTo}</span>
                          </div>
                        ) : (
                          <span>Unassigned</span>
                        )}
                        <span>{formatDate(order.createdDate)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(kanbanColumns[status] || []).length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8 bg-gray-100 dark:bg-white/5 rounded-lg border border-dashed border-border">
                    No work orders
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {orders.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="No work orders"
                description="Create your first work order to get started."
                action={
                  <Button onClick={() => setShowNewDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> New Work Order
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => openDetail(order)}>
                      <TableCell className="font-medium">{order.title}</TableCell>
                      <TableCell>{getBuildingName(order)}</TableCell>
                      <TableCell>
                        <Badge variant={TYPE_COLORS[order.type] || 'secondary'}>{order.type}</Badge>
                      </TableCell>
                      <TableCell>{priorityDots(order.priority)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        {order.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={order.assignedTo} size="sm" />
                            <span>{order.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(order.createdDate)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* New Work Order Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Building</Label>
              <Select
                value={newOrder.buildingId}
                onChange={(e) => setNewOrder((p) => ({ ...p, buildingId: e.target.value }))}
              >
                <option value="">Select building...</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                placeholder="Work order title..."
                value={newOrder.title}
                onChange={(e) => setNewOrder((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the issue or work needed..."
                value={newOrder.description}
                onChange={(e) => setNewOrder((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newOrder.type} onChange={(e) => setNewOrder((p) => ({ ...p, type: e.target.value }))}>
                  <option value="emergency">Emergency</option>
                  <option value="priority">Priority</option>
                  <option value="routine">Routine</option>
                  <option value="maintenance">Maintenance</option>
                </Select>
              </div>
              <div>
                <Label>Priority (1-5)</Label>
                <Select value={newOrder.priority} onChange={(e) => setNewOrder((p) => ({ ...p, priority: e.target.value }))}>
                  <option value="1">1 - Low</option>
                  <option value="2">2</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4</option>
                  <option value="5">5 - Critical</option>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Work Order'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOrder?.title}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Building</p>
                  <p className="font-medium">{getBuildingName(selectedOrder)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedOrder.status)}>{getStatusLabel(selectedOrder.status)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant={TYPE_COLORS[selectedOrder.type] || 'secondary'}>{selectedOrder.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  {priorityDots(selectedOrder.priority)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assigned To</p>
                  <p className="font-medium">{selectedOrder.assignedTo || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdDate)}</p>
                </div>
              </div>
              {selectedOrder.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{selectedOrder.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedOrder && selectedOrder.status !== 'completed' && (
              <Button className="gap-1" onClick={() => handleAdvanceStatus(selectedOrder)}>
                Advance to {STATUS_LABELS[STATUSES[STATUSES.indexOf(selectedOrder.status) + 1]] || 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
