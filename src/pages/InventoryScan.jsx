import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Package,
  LogIn,
  LogOut,
  MapPin,
  CheckCircle,
  ArrowLeft,
  Tag,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/input';
import {
  fetchInventoryItems,
  fetchInventoryCategories,
  fetchBuildings,
  fetchUsers,
  fetchCheckoutHistory,
  updateInventoryItem,
  createCheckoutEntry,
} from '@/lib/dataService';
import { formatDate, formatRelativeTime } from '@/lib/utils';

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

export default function InventoryScan() {
  const { assetTag } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);

  const [step, setStep] = useState('view'); // 'view' | 'checkout' | 'checkin' | 'done'
  const [doneMessage, setDoneMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const [checkoutUserId, setCheckoutUserId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkinLocation, setCheckinLocation] = useState('');
  const [checkinNotes, setCheckinNotes] = useState('');

  const loadData = async () => {
    try {
      const [items, cats, bldgs, usrs, hist] = await Promise.all([
        fetchInventoryItems(),
        fetchInventoryCategories(),
        fetchBuildings(),
        fetchUsers(),
        fetchCheckoutHistory(),
      ]);
      const found = items.find(
        (i) => i.assetTag?.toLowerCase() === assetTag?.toLowerCase()
      );
      setItem(found || null);
      setCategories(cats);
      setBuildings(bldgs);
      setUsers(usrs);
      setHistory(hist.filter((h) => found && h.itemId === found.id));
      if (!found) setError(`No item found with asset tag "${assetTag}"`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [assetTag]);

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || id || '—';
  const getBuildingName = (id) => buildings.find((b) => b.id === id)?.name || id || '—';

  const handleCheckout = async () => {
    if (!checkoutUserId) return;
    const user = users.find((u) => u.id === checkoutUserId);
    const personName = user?.name || checkoutUserId;
    setSaving(true);
    try {
      await Promise.all([
        updateInventoryItem(item.id, { status: 'checked_out', checkedOutTo: personName }),
        createCheckoutEntry({
          itemId: item.id,
          action: 'checkout',
          personName,
          location: item.lastLocation || null,
          date: new Date().toISOString().split('T')[0],
          notes: checkoutNotes || null,
        }),
      ]);
      setDoneMessage(`${item.name} checked out to ${personName}.`);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckin = async () => {
    const personName = item.checkedOutTo || 'Unknown';
    setSaving(true);
    try {
      await Promise.all([
        updateInventoryItem(item.id, {
          status: 'available',
          checkedOutTo: null,
          lastLocation: checkinLocation || item.lastLocation,
        }),
        createCheckoutEntry({
          itemId: item.id,
          action: 'checkin',
          personName,
          location: checkinLocation || item.lastLocation || null,
          date: new Date().toISOString().split('T')[0],
          notes: checkinNotes || null,
        }),
      ]);
      setDoneMessage(`${item.name} checked in${checkinLocation ? ` to ${getBuildingName(checkinLocation)}` : ''}.`);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Shell ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-start px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <ScanLine className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">BrassWater CMMS</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Asset Scan</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
            </div>
            <p className="text-sm text-gray-500">Loading asset...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
            <Package className="h-12 w-12 text-gray-300 dark:text-gray-700" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Asset Not Found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button variant="outline" onClick={() => navigate('/inventory')} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Inventory
            </Button>
          </div>
        )}

        {!loading && !error && item && step === 'view' && (
          <>
            {/* Item header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white border border-gray-200 rounded-xl shrink-0">
                  <QRCodeSVG
                    value={`${window.location.origin}/inventory/scan/${item.assetTag}`}
                    size={64}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight">{item.name}</p>
                  <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />{item.assetTag}
                  </p>
                  <div className="mt-2">
                    <Badge variant={getStatusBadgeVariant(item.status)}>{getStatusLabel(item.status)}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Item details */}
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Category</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{getCategoryName(item.category)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Location</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {getBuildingName(item.lastLocation)}
                  </p>
                </div>
                {item.checkedOutTo && (
                  <div className="col-span-2">
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">Currently with</p>
                    <p className="font-semibold text-amber-600 dark:text-amber-400">{item.checkedOutTo}</p>
                  </div>
                )}
              </div>

              {/* Recent history */}
              {history.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Recent Activity</p>
                  <div className="space-y-2">
                    {history.slice(0, 3).map((h) => (
                      <div key={h.id} className="flex items-center gap-2 text-sm">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${h.action === 'checkout' ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{h.personName}</span>
                        <span className="text-gray-500 dark:text-gray-400">{h.action === 'checkout' ? 'checked out' : 'checked in'}</span>
                        <span className="ml-auto text-xs text-gray-400">{formatRelativeTime(h.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-5 pb-5 space-y-3">
              {item.status === 'available' && (
                <Button
                  className="w-full gap-2 h-12 text-base"
                  onClick={() => setStep('checkout')}
                >
                  <LogOut className="h-5 w-5" />
                  Check Out This Item
                </Button>
              )}
              {item.status === 'checked_out' && (
                <Button
                  className="w-full gap-2 h-12 text-base"
                  variant="default"
                  onClick={() => { setCheckinLocation(item.lastLocation || ''); setStep('checkin'); }}
                >
                  <LogIn className="h-5 w-5" />
                  Check In This Item
                </Button>
              )}
              {(item.status === 'maintenance' || item.status === 'retired') && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                  This item is currently <strong>{getStatusLabel(item.status).toLowerCase()}</strong> and cannot be checked in or out.
                </p>
              )}
              <Button
                variant="ghost"
                className="w-full gap-2 text-gray-500"
                onClick={() => navigate('/inventory')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Inventory
              </Button>
            </div>
          </>
        )}

        {/* ── Check Out Form ── */}
        {!loading && !error && item && step === 'checkout' && (
          <>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">Check Out</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.name} · {item.assetTag}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Who is taking this item? *
                </Label>
                <Select
                  value={checkoutUserId}
                  onChange={(e) => setCheckoutUserId(e.target.value)}
                >
                  <option value="">Select a person...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Notes (optional)
                </Label>
                <Textarea
                  placeholder="Purpose, expected return date..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <Button
                className="w-full gap-2 h-12 text-base"
                onClick={handleCheckout}
                disabled={!checkoutUserId || saving}
              >
                <LogOut className="h-5 w-5" />
                {saving ? 'Saving...' : 'Confirm Check Out'}
              </Button>
              <Button variant="ghost" className="w-full text-gray-500" onClick={() => setStep('view')}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* ── Check In Form ── */}
        {!loading && !error && item && step === 'checkin' && (
          <>
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <p className="font-bold text-lg text-gray-900 dark:text-gray-100">Check In</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.name} · {item.assetTag}</p>
              {item.checkedOutTo && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Currently with: <strong>{item.checkedOutTo}</strong>
                </p>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Return to location
                </Label>
                <Select
                  value={checkinLocation}
                  onChange={(e) => setCheckinLocation(e.target.value)}
                >
                  <option value="">Select building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Notes (optional)
                </Label>
                <Textarea
                  placeholder="Any issues, damage, or notes..."
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <Button
                className="w-full gap-2 h-12 text-base"
                onClick={handleCheckin}
                disabled={saving}
              >
                <LogIn className="h-5 w-5" />
                {saving ? 'Saving...' : 'Confirm Check In'}
              </Button>
              <Button variant="ghost" className="w-full text-gray-500" onClick={() => setStep('view')}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* ── Done ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 px-6 gap-5 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="h-9 w-9 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Done!</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{doneMessage}</p>
            </div>
            <div className="w-full space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => navigate('/inventory')}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Inventory
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
