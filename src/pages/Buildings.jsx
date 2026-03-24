import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  ClipboardCheck,
  Wrench,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  fetchBuildings,
  fetchInspections,
  fetchWorkOrders,
  fetchCompliance,
  createBuilding,
} from '@/lib/dataService';
import { cn } from '@/lib/utils';

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  units: '',
  floors: '',
  yearBuilt: '',
};

export default function Buildings() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, i, wo, c] = await Promise.all([
          fetchBuildings(),
          fetchInspections(),
          fetchWorkOrders(),
          fetchCompliance(),
        ]);
        setBuildings(b);
        setInspections(i);
        setWorkOrders(wo);
        setCompliance(c);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowAdd(true);
  }

  async function handleAddBuilding(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Building name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        postalCode: form.postalCode.trim() || null,
        units: form.units ? Number(form.units) : null,
        floors: form.floors ? Number(form.floors) : null,
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : null,
      };
      const [newBuilding] = await createBuilding(payload);
      setBuildings((prev) => [...prev, newBuilding]);
      setShowAdd(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function setField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  const enrichedBuildings = useMemo(() => {
    return buildings.map((b) => {
      const pendingInspections = inspections.filter(
        (i) => i.buildingId === b.id && (i.status === 'scheduled' || i.status === 'overdue')
      ).length;

      const openWOs = workOrders.filter(
        (wo) => wo.buildingId === b.id && wo.status !== 'completed' && wo.status !== 'closed'
      ).length;

      const bCompliance = compliance.filter((c) => c.buildingId === b.id);
      const compliant = bCompliance.filter((c) => c.status === 'compliant').length;
      const complianceRate =
        bCompliance.length > 0 ? Math.round((compliant / bCompliance.length) * 100) : 100;

      return { ...b, pendingInspections, openWOs, complianceRate };
    });
  }, [buildings, inspections, workOrders, compliance]);

  const filteredBuildings = useMemo(() => {
    if (!search.trim()) return enrichedBuildings;
    const q = search.toLowerCase();
    return enrichedBuildings.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q) ||
        (b.city || '').toLowerCase().includes(q)
    );
  }, [search, enrichedBuildings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading buildings...</div>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Buildings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your property portfolio
          </p>
        </div>
        <Button className="gap-2 shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Building
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search buildings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredBuildings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No buildings found"
          description={search ? 'Try adjusting your search terms' : 'Add your first building to get started'}
          action={
            !search && (
              <Button className="gap-2" onClick={openAdd}>
                <Plus className="h-4 w-4" />
                Add Building
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBuildings.map((building) => (
            <Card
              key={building.id}
              className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => navigate(`/buildings/${building.id}`)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">{building.name}</span>
                </CardTitle>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {building.address}
                    {building.city ? `, ${building.city}` : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                    <p className="text-lg font-semibold">{building.units || '—'}</p>
                    <p className="text-xs text-muted-foreground">Units</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                    <p className="text-lg font-semibold">{building.floors || '—'}</p>
                    <p className="text-xs text-muted-foreground">Floors</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-white/5 rounded-lg p-2">
                    <p className="text-lg font-semibold">{building.yearBuilt || '—'}</p>
                    <p className="text-xs text-muted-foreground">Built</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={building.pendingInspections > 0 ? 'warning' : 'success'}
                    className="gap-1"
                  >
                    <ClipboardCheck className="h-3 w-3" />
                    {building.pendingInspections} pending
                  </Badge>
                  <Badge
                    variant={building.openWOs > 0 ? 'warning' : 'success'}
                    className="gap-1"
                  >
                    <Wrench className="h-3 w-3" />
                    {building.openWOs} open
                  </Badge>
                  <Badge
                    variant={
                      building.complianceRate >= 90
                        ? 'success'
                        : building.complianceRate >= 70
                        ? 'warning'
                        : 'danger'
                    }
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {building.complianceRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Building Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogHeader>
          <DialogTitle>Add Building</DialogTitle>
          <DialogDescription>Enter the details for the new property.</DialogDescription>
          <DialogClose onOpenChange={setShowAdd} />
        </DialogHeader>
        <form onSubmit={handleAddBuilding}>
          <DialogContent className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Building Name <span className="text-red-500">*</span>
              </label>
              <Input placeholder="e.g. Riverside Tower" value={form.name} onChange={setField('name')} />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label>
              <Input placeholder="123 Main St" value={form.address} onChange={setField('address')} />
            </div>

            {/* City / Province */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                <Input placeholder="Montreal" value={form.city} onChange={setField('city')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Province</label>
                <Input placeholder="QC" value={form.province} onChange={setField('province')} />
              </div>
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</label>
              <Input placeholder="H3A 1B1" value={form.postalCode} onChange={setField('postalCode')} />
            </div>

            {/* Units / Floors / Year Built */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Units</label>
                <Input type="number" min="1" placeholder="48" value={form.units} onChange={setField('units')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Floors</label>
                <Input type="number" min="1" placeholder="12" value={form.floors} onChange={setField('floors')} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Built</label>
                <Input type="number" min="1800" max="2100" placeholder="1998" value={form.yearBuilt} onChange={setField('yearBuilt')} />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </DialogContent>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Add Building'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
