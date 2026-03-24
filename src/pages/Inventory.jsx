import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package,
  Plus,
  Search,
  LogIn,
  LogOut,
  MapPin,
  User,
  Eye,
  Clock,
  Wrench,
  AlertTriangle,
  Tag,
  DollarSign,
  History,
  CheckCircle,
  XCircle,
  Settings,
  QrCode,
  ScanLine,
  Printer,
  Camera,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import {
  fetchInventoryItems,
  fetchInventoryCategories,
  fetchCheckoutHistory,
  fetchBuildings,
  fetchUsers,
  createInventoryItem,
  updateInventoryItem,
  createCheckoutEntry,
} from '@/lib/dataService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCategoryBadgeVariant(categoryId) {
  const map = {
    'cat-tools': 'default',
    'cat-hand': 'info',
    'cat-safety': 'danger',
    'cat-testing': 'warning',
    'cat-access': 'success',
    'cat-cleaning': 'purple',
    'cat-keys': 'secondary',
  };
  return map[categoryId] || 'secondary';
}

function getStatusBadgeVariant(status) {
  switch (status) {
    case 'available': return 'success';
    case 'checked_out': return 'warning';
    case 'maintenance': return 'default';
    case 'retired': return 'secondary';
    default: return 'secondary';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'available': return 'Available';
    case 'checked_out': return 'Checked Out';
    case 'maintenance': return 'Maintenance';
    case 'retired': return 'Retired';
    default: return status;
  }
}

function formatCost(value) {
  if (!value || value === 0) return null;
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Empty form shapes
// ---------------------------------------------------------------------------

const emptyAddForm = { name: '', assetTag: '', category: '', unitCost: '', location: '', notes: '' };
const emptyCheckoutForm = { userId: '', notes: '' };
const emptyCheckinForm = { location: '', notes: '' };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Inventory() {
  const { toast } = useToast();

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Forms state
  const [addForm, setAddForm] = useState({ ...emptyAddForm });
  const [checkoutForm, setCheckoutForm] = useState({ ...emptyCheckoutForm });
  const [checkinForm, setCheckinForm] = useState({ ...emptyCheckinForm });

  // ---------------------------------------------------------------------------
  // Initial data load
  // ---------------------------------------------------------------------------

  const loadData = async () => {
    try {
      const [inv, hist, cats, bldgs, usrs] = await Promise.all([
        fetchInventoryItems(),
        fetchCheckoutHistory(),
        fetchInventoryCategories(),
        fetchBuildings(),
        fetchUsers(),
      ]);
      setItems(inv);
      setHistory(hist);
      setCategories(cats);
      setBuildings(bldgs);
      setUsers(usrs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ---------------------------------------------------------------------------
  // Derived helpers using live state
  // ---------------------------------------------------------------------------

  const getCategoryName = (categoryId) => categories.find((c) => c.id === categoryId)?.name || categoryId;
  const getBuildingName = (bId) => buildings.find((b) => b.id === bId)?.name || bId || '—';
  const getUserById = (userId) => users.find((u) => u.id === userId) || null;

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => ({
    total: items.filter((i) => i.status !== 'retired').length,
    checkedOut: items.filter((i) => i.status === 'checked_out').length,
    available: items.filter((i) => i.status === 'available').length,
    maintenance: items.filter((i) => i.status === 'maintenance').length,
  }), [items]);

  // ---------------------------------------------------------------------------
  // Filtered items
  // ---------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q) || i.assetTag.toLowerCase().includes(q));
    }
    if (categoryFilter) result = result.filter((i) => i.category === categoryFilter);
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (locationFilter) result = result.filter((i) => i.lastLocation === locationFilter);
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [items, search, categoryFilter, statusFilter, locationFilter]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const openDetail = (item) => { setSelectedItem(item); setShowDetailDialog(true); };
  const openCheckout = (item, e) => { if (e) e.stopPropagation(); setSelectedItem(item); setCheckoutForm({ ...emptyCheckoutForm }); setShowCheckoutDialog(true); };
  const openCheckin = (item, e) => { if (e) e.stopPropagation(); setSelectedItem(item); setCheckinForm({ location: item.lastLocation || '', notes: '' }); setShowCheckinDialog(true); };

  const handleCheckout = async () => {
    if (!checkoutForm.userId) {
      toast({ title: 'Select a user', description: 'Choose who is checking out this item.', variant: 'error' });
      return;
    }
    const user = getUserById(checkoutForm.userId);
    const personName = user?.name || checkoutForm.userId;
    setSaving(true);
    try {
      await Promise.all([
        updateInventoryItem(selectedItem.id, { status: 'checked_out', checkedOutTo: personName }),
        createCheckoutEntry({
          itemId: selectedItem.id,
          action: 'checkout',
          personName,
          location: selectedItem.lastLocation || null,
          date: new Date().toISOString().split('T')[0],
          notes: checkoutForm.notes || null,
        }),
      ]);
      await loadData();
      setShowCheckoutDialog(false);
      setShowDetailDialog(false);
      toast({ title: 'Checked out', description: `${selectedItem.name} checked out to ${personName}.`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckin = async () => {
    setSaving(true);
    const personName = selectedItem.checkedOutTo || 'Unknown';
    try {
      await Promise.all([
        updateInventoryItem(selectedItem.id, {
          status: 'available',
          checkedOutTo: null,
          lastLocation: checkinForm.location || selectedItem.lastLocation,
        }),
        createCheckoutEntry({
          itemId: selectedItem.id,
          action: 'checkin',
          personName,
          location: checkinForm.location || selectedItem.lastLocation || null,
          date: new Date().toISOString().split('T')[0],
          notes: checkinForm.notes || null,
        }),
      ]);
      await loadData();
      setShowCheckinDialog(false);
      setShowDetailDialog(false);
      toast({ title: 'Checked in', description: `${selectedItem.name} returned to ${getBuildingName(checkinForm.location || selectedItem.lastLocation)}.`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name.trim()) {
      toast({ title: 'Missing fields', description: 'Item name is required.', variant: 'error' });
      return;
    }
    setSaving(true);
    try {
      await createInventoryItem({
        name: addForm.name,
        assetTag: addForm.assetTag || `AT-${Date.now().toString(36).toUpperCase()}`,
        category: addForm.category || null,
        status: 'available',
        unitCost: Number(addForm.unitCost) || 0,
        lastLocation: addForm.location || null,
        checkedOutTo: null,
        notes: addForm.notes || null,
      });
      await loadData();
      setShowAddDialog(false);
      setAddForm({ ...emptyAddForm });
      toast({ title: 'Item added', description: `${addForm.name} added to inventory.`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // QR Code helpers
  // ---------------------------------------------------------------------------

  const buildQrValue = (item) =>
    `${window.location.origin}/inventory/scan/${item.assetTag}`;

  const handleScanLookup = useCallback((code) => {
    // Accept full URL, bare asset tag, or BRASSWATER: prefix
    let tag = code.trim();
    if (tag.includes('/inventory/scan/')) {
      tag = tag.split('/inventory/scan/').pop();
    } else if (tag.toUpperCase().startsWith('BRASSWATER:')) {
      tag = tag.replace(/^BRASSWATER:/i, '');
    }
    tag = tag.toUpperCase();

    const found = items.find((i) => i.assetTag.toUpperCase() === tag);
    if (found) {
      setScanError('');
      setShowScanDialog(false);
      setScanInput('');
      setCameraActive(false);
      // Directly open checkout or checkin based on current status
      if (found.status === 'available') {
        openCheckout(found);
      } else if (found.status === 'checked_out') {
        openCheckin(found);
      } else {
        openDetail(found);
      }
    } else {
      setScanError(`No item found for asset tag "${tag}"`);
    }
  }, [items]);

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (scanInput.trim()) handleScanLookup(scanInput.trim());
  };

  // Camera-based QR scanning
  useEffect(() => {
    if (!cameraActive || !showScanDialog) return;
    let html5QrCode = null;
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted) return;
        html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => { handleScanLookup(decodedText); html5QrCode.stop().catch(() => {}); },
          () => {}
        );
      } catch (err) {
        if (mounted) { setScanError('Camera access denied or not available. Use manual entry.'); setCameraActive(false); }
      }
    })();
    return () => {
      mounted = false;
      if (html5QrCode) html5QrCode.stop().catch(() => {});
    };
  }, [cameraActive, showScanDialog, handleScanLookup]);

  const printQrLabel = (item) => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>QR Label - ${item.assetTag}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; flex-direction: column;
               align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .label { text-align: center; padding: 24px; border: 2px dashed #ccc; border-radius: 12px; }
        .tag { font-size: 20px; font-weight: bold; margin-top: 12px; font-family: monospace; }
        .name { font-size: 14px; color: #555; margin-top: 6px; max-width: 250px; }
        .company { font-size: 10px; color: #999; margin-top: 8px; }
        svg { display: block; margin: 0 auto; }
        @media print { .label { border: none; } }
      </style></head><body>
      <div class="label">
        <div id="qr"></div>
        <div class="tag">${item.assetTag}</div>
        <div class="name">${item.name}</div>
        <div class="company">BrassWater CMMS</div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>
        QRCode.toCanvas(document.createElement('canvas'), '${buildQrValue(item)}',
          { width: 200, margin: 1 }, function(err, canvas) {
            if (!err) document.getElementById('qr').appendChild(canvas);
            setTimeout(function() { window.print(); }, 400);
          });
      <\/script></body></html>
    `);
    printWindow.document.close();
  };

  // Get the freshest version of selectedItem from items state
  const currentItem = selectedItem ? items.find((i) => i.id === selectedItem.id) || selectedItem : null;

  // History for the selected item
  const itemHistory = useMemo(() => {
    if (!currentItem) return [];
    return history
      .filter((h) => h.itemId === currentItem.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [currentItem, history]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading inventory...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Asset check-in / check-out</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => { setScanInput(''); setScanError(''); setCameraActive(false); setShowScanDialog(true); }}
          >
            <ScanLine className="h-4 w-4" />
            Scan QR
          </Button>
          <Button
            className="gap-2"
            onClick={() => { setAddForm({ ...emptyAddForm }); setShowAddDialog(true); }}
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} value={stats.total} label="Total Assets" accentColor="border-blue-500" />
        <StatCard icon={LogOut} value={stats.checkedOut} label="Checked Out" accentColor="border-amber-500" />
        <StatCard icon={CheckCircle} value={stats.available} label="Available" accentColor="border-green-500" />
        <StatCard icon={Wrench} value={stats.maintenance} label="In Maintenance" accentColor="border-red-500" />
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-gray-200/60 dark:border-white/10 shadow-sm dark:shadow-lg p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by name or asset tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="lg:w-48">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="lg:w-44">
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked Out</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </Select>
          <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="lg:w-52">
            <option value="">All Locations</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-gray-200/60 dark:border-white/10 shadow-sm dark:shadow-lg">
          <EmptyState
            icon={Package}
            title="No items found"
            description={search || categoryFilter || statusFilter || locationFilter ? 'Try adjusting your filters.' : 'Add your first asset to get started.'}
            action={!search && !categoryFilter && !statusFilter && !locationFilter && (
              <Button onClick={() => { setAddForm({ ...emptyAddForm }); setShowAddDialog(true); }} className="gap-2">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            )}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">QR</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Checked Out To</TableHead>
              <TableHead>Last Location</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => openDetail(item)}>
                {/* QR */}
                <TableCell>
                  <div
                    className="p-1 bg-white rounded border border-gray-200 w-fit cursor-pointer hover:shadow-md hover:ring-2 hover:ring-primary/40 transition-all"
                    onClick={(e) => { e.stopPropagation(); setQrModalItem(item); setShowQrModal(true); }}
                    title="View QR code"
                  >
                    <QRCodeSVG value={buildQrValue(item)} size={32} level="L" includeMargin={false} />
                  </div>
                </TableCell>
                {/* Item */}
                <TableCell>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.assetTag}</p>
                  </div>
                </TableCell>
                {/* Category */}
                <TableCell>
                  <Badge variant={getCategoryBadgeVariant(item.category)}>
                    {getCategoryName(item.category)}
                  </Badge>
                </TableCell>
                {/* Status */}
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(item.status)}>{getStatusLabel(item.status)}</Badge>
                </TableCell>
                {/* Checked Out To */}
                <TableCell>
                  {item.checkedOutTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={item.checkedOutTo} size="sm" />
                      <span className="text-sm font-medium">{item.checkedOutTo}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
                {/* Last Location */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{getBuildingName(item.lastLocation)}</span>
                  </div>
                </TableCell>
                {/* Value */}
                <TableCell>
                  {formatCost(item.unitCost) ? (
                    <span className="font-medium">{formatCost(item.unitCost)}</span>
                  ) : (
                    <span className="text-muted-foreground">&mdash;</span>
                  )}
                </TableCell>
                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetail(item); }} title="View details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.status === 'available' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        onClick={(e) => openCheckout(item, e)}
                        title="Check out"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                    {item.status === 'checked_out' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        onClick={(e) => openCheckin(item, e)}
                        title="Check in"
                      >
                        <LogIn className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ================================================================= */}
      {/* Check Out Dialog                                                  */}
      {/* ================================================================= */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Asset</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-3">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedItem.assetTag}</p>
              </div>
              <div>
                <Label>Check out to</Label>
                <Select
                  value={checkoutForm.userId}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, userId: e.target.value }))}
                >
                  <option value="">Select user...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Reason for checkout, expected return..."
                  value={checkoutForm.notes}
                  onChange={(e) => setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckoutDialog(false)}>Cancel</Button>
            <Button onClick={handleCheckout} className="gap-2" disabled={saving}>
              <LogOut className="h-4 w-4" />
              {saving ? 'Checking out...' : 'Check Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Check In Dialog                                                   */}
      {/* ================================================================= */}
      <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Asset</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-3">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedItem.assetTag}</p>
              </div>
              <div>
                <Label>Return to location</Label>
                <Select
                  value={checkinForm.location}
                  onChange={(e) => setCheckinForm((prev) => ({ ...prev, location: e.target.value }))}
                >
                  <option value="">Select building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Return notes, any issues..."
                  value={checkinForm.notes}
                  onChange={(e) => setCheckinForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckinDialog(false)}>Cancel</Button>
            <Button onClick={handleCheckin} className="gap-2" disabled={saving}>
              <LogIn className="h-4 w-4" />
              {saving ? 'Checking in...' : 'Check In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Item Detail Dialog                                                */}
      {/* ================================================================= */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentItem?.name}</DialogTitle>
          </DialogHeader>
          {currentItem && (
            <div className="space-y-5 py-4">
              {/* QR Code + Asset tag & status */}
              <div className="flex gap-4">
                <div
                  className="shrink-0 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  title="Click to print QR label"
                  onClick={() => printQrLabel(currentItem)}
                >
                  <QRCodeSVG value={buildQrValue(currentItem)} size={80} level="M" includeMargin={false} />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
                      <Tag className="h-3.5 w-3.5" />
                      {currentItem.assetTag}
                    </span>
                    <Badge variant={getStatusBadgeVariant(currentItem.status)}>{getStatusLabel(currentItem.status)}</Badge>
                  </div>
                  <button
                    onClick={() => printQrLabel(currentItem)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-blue-500 transition-colors w-fit"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print QR Label
                  </button>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <Badge variant={getCategoryBadgeVariant(currentItem.category)} className="mt-1">
                    {getCategoryName(currentItem.category)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Location</p>
                  <p className="font-medium mt-1 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {getBuildingName(currentItem.lastLocation)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Value</p>
                  <p className="font-medium mt-1">{formatCost(currentItem.unitCost) || '$0.00'}</p>
                </div>
                {currentItem.serialNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-medium mt-1 font-mono text-sm">{currentItem.serialNumber}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {currentItem.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <div className="rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-3 text-sm">
                    {currentItem.notes}
                  </div>
                </div>
              )}

              {/* Checked out info */}
              {currentItem.status === 'checked_out' && currentItem.checkedOutTo && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                    <LogOut className="h-4 w-4" />
                    Currently Checked Out
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar name={currentItem.checkedOutTo} size="md" />
                    <div>
                      <p className="font-medium">{currentItem.checkedOutTo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout History Timeline */}
              {itemHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Checkout History
                  </p>
                  <div className="space-y-0">
                    {itemHistory.map((entry, idx) => {
                      const isCheckout = entry.action === 'checkout';
                      return (
                        <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex items-center justify-center h-7 w-7 rounded-full shrink-0',
                              isCheckout ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-green-100 dark:bg-green-500/20'
                            )}>
                              {isCheckout
                                ? <LogOut className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                : <LogIn className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                              }
                            </div>
                            {idx < itemHistory.length - 1 && (
                              <div className="w-px flex-1 bg-gray-200 dark:bg-white/10 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm">
                              <span className="font-medium">{entry.personName || 'Unknown'}</span>
                              <span className="text-muted-foreground"> {isCheckout ? 'checked out' : 'checked in'}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(entry.date)} · {formatRelativeTime(entry.date)}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {currentItem?.status === 'available' && (
              <Button onClick={() => { setShowDetailDialog(false); openCheckout(currentItem); }} className="gap-2">
                <LogOut className="h-4 w-4" /> Check Out
              </Button>
            )}
            {currentItem?.status === 'checked_out' && (
              <Button onClick={() => { setShowDetailDialog(false); openCheckin(currentItem); }} className="gap-2">
                <LogIn className="h-4 w-4" /> Check In
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Add Item Dialog                                                   */}
      {/* ================================================================= */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="e.g., DeWalt Hammer Drill"
                  value={addForm.name}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Asset Tag</Label>
                <Input
                  placeholder="e.g., PT-006"
                  value={addForm.assetTag}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, assetTag: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={addForm.category}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Unit Cost ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.unitCost}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Location</Label>
                <Select
                  value={addForm.location}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, location: e.target.value }))}
                >
                  <option value="">Select building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional details about this asset..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddItem} className="gap-2" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? 'Adding...' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* QR Code Modal                                                     */}
      {/* ================================================================= */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              {qrModalItem?.name}
            </DialogTitle>
          </DialogHeader>
          {qrModalItem && (
            <div className="py-4 space-y-5">
              {/* Large QR code centered */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
                  <QRCodeSVG
                    value={buildQrValue(qrModalItem)}
                    size={220}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Asset tag */}
              <p className="text-center font-mono text-lg font-bold tracking-widest text-gray-900 dark:text-gray-100">
                {qrModalItem.assetTag}
              </p>

              {/* Status + person */}
              <div className="rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 divide-y divide-gray-200/60 dark:divide-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={getStatusBadgeVariant(qrModalItem.status)}>
                    {getStatusLabel(qrModalItem.status)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {getBuildingName(qrModalItem.lastLocation)}
                  </span>
                </div>
                {qrModalItem.checkedOutTo ? (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Checked out to</span>
                    <div className="flex items-center gap-2">
                      <Avatar name={qrModalItem.checkedOutTo} size="sm" />
                      <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                        {qrModalItem.checkedOutTo}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">Checked out to</span>
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant={getCategoryBadgeVariant(qrModalItem.category)}>
                    {getCategoryName(qrModalItem.category)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => { printQrLabel(qrModalItem); }}
            >
              <Printer className="h-4 w-4" /> Print Label
            </Button>
            {qrModalItem?.status === 'available' && (
              <Button className="gap-2" onClick={() => { setShowQrModal(false); openCheckout(qrModalItem); }}>
                <LogOut className="h-4 w-4" /> Check Out
              </Button>
            )}
            {qrModalItem?.status === 'checked_out' && (
              <Button className="gap-2" onClick={() => { setShowQrModal(false); openCheckin(qrModalItem); }}>
                <LogIn className="h-4 w-4" /> Check In
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* QR Scanner Dialog                                                 */}
      {/* ================================================================= */}
      <Dialog
        open={showScanDialog}
        onOpenChange={(open) => {
          setShowScanDialog(open);
          if (!open) { setCameraActive(false); setScanInput(''); setScanError(''); }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Scan QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {cameraActive ? (
              <div className="space-y-3">
                <div id="qr-reader" className="rounded-lg overflow-hidden bg-black" style={{ minHeight: 280 }} />
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => { setCameraActive(false); if (scannerRef.current) scannerRef.current.stop().catch(() => {}); }}
                >
                  <XCircle className="h-4 w-4" />
                  Stop Camera
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-8 text-center w-full">
                  <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Scan an asset QR code with your camera, or type the asset tag manually below.
                  </p>
                </div>
                <Button variant="secondary" className="w-full gap-2" onClick={() => { setScanError(''); setCameraActive(true); }}>
                  <Camera className="h-4 w-4" />
                  Open Camera Scanner
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="scan-input">Manual Entry</Label>
              <form onSubmit={handleScanSubmit} className="flex gap-2 mt-1.5">
                <Input
                  id="scan-input"
                  placeholder="Type asset tag (e.g. PT-001)..."
                  value={scanInput}
                  onChange={(e) => { setScanInput(e.target.value); setScanError(''); }}
                  className="flex-1"
                  autoFocus={!cameraActive}
                />
                <Button type="submit" className="gap-2 shrink-0">
                  <Search className="h-4 w-4" />
                  Look Up
                </Button>
              </form>
            </div>

            {scanError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20 p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {scanError}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
