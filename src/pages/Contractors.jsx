import { useState, useEffect, useMemo } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
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
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { fetchContractors, createContractor } from '@/lib/dataService';
import { cn, formatDate } from '@/lib/utils';

export default function Contractors() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contractorList, setContractorList] = useState([]);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newContractor, setNewContractor] = useState({
    company: '',
    contact: '',
    phone: '',
    email: '',
    serviceType: '',
    contractNumber: '',
    status: 'active',
    contractEnd: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchContractors();
        setContractorList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredContractors = useMemo(() => {
    if (!search.trim()) return contractorList;
    const q = search.toLowerCase();
    return contractorList.filter(
      (c) =>
        (c.company || '').toLowerCase().includes(q) ||
        (c.contact || '').toLowerCase().includes(q) ||
        (c.serviceType || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
    );
  }, [search, contractorList]);

  const handleAdd = async () => {
    if (!newContractor.company) {
      toast({ title: 'Missing fields', description: 'Company name is required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await createContractor({
        company: newContractor.company,
        contact: newContractor.contact || null,
        phone: newContractor.phone || null,
        email: newContractor.email || null,
        serviceType: newContractor.serviceType || null,
        contractNumber: newContractor.contractNumber || null,
        status: newContractor.status,
        contractEnd: newContractor.contractEnd || null,
      });
      const fresh = await fetchContractors();
      setContractorList(fresh);
      setShowAddDialog(false);
      setNewContractor({ company: '', contact: '', phone: '', email: '', serviceType: '', contractNumber: '', status: 'active', contractEnd: '' });
      toast({ title: 'Contractor added', description: `${newContractor.company} has been added.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (contractor) => {
    setSelectedContractor(contractor);
    setShowDetailDialog(true);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading contractors...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contractors</h1>
          <p className="text-muted-foreground mt-1">Manage service providers and contracts</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Contractor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contractors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {filteredContractors.length === 0 ? (
            <EmptyState
              icon={HardHat}
              title="No contractors found"
              description={search ? 'Try adjusting your search terms.' : 'Add your first contractor to get started.'}
              action={
                !search && (
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Contractor
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contract End</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContractors.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openDetail(c)}>
                    <TableCell className="font-medium">{c.company}</TableCell>
                    <TableCell>{c.contact || '—'}</TableCell>
                    <TableCell>
                      {c.phone ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />{c.phone}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {c.email ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />{c.email}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.serviceType || '—'}</Badge>
                    </TableCell>
                    <TableCell>{c.contractNumber || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'success' : 'danger'}>{c.status || 'unknown'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(c.contractEnd) || '—'}</TableCell>
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

      {/* Add Contractor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Company Name</Label>
              <Input
                placeholder="Company name..."
                value={newContractor.company}
                onChange={(e) => setNewContractor((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input
                placeholder="Contact name..."
                value={newContractor.contact}
                onChange={(e) => setNewContractor((p) => ({ ...p, contact: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  placeholder="(514) 555-0000"
                  value={newContractor.phone}
                  onChange={(e) => setNewContractor((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newContractor.email}
                  onChange={(e) => setNewContractor((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Service Type</Label>
              <Input
                placeholder="e.g., Plumbing, Electrical, HVAC..."
                value={newContractor.serviceType}
                onChange={(e) => setNewContractor((p) => ({ ...p, serviceType: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contract Number</Label>
                <Input
                  placeholder="Contract #"
                  value={newContractor.contractNumber}
                  onChange={(e) => setNewContractor((p) => ({ ...p, contractNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label>Contract End Date</Label>
                <Input
                  type="date"
                  value={newContractor.contractEnd}
                  onChange={(e) => setNewContractor((p) => ({ ...p, contractEnd: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newContractor.status} onChange={(e) => setNewContractor((p) => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Adding...' : 'Add Contractor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedContractor?.company}</DialogTitle>
          </DialogHeader>
          {selectedContractor && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{selectedContractor.contact || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedContractor.status === 'active' ? 'success' : 'danger'}>
                    {selectedContractor.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedContractor.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedContractor.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service Type</p>
                  <p className="font-medium">{selectedContractor.serviceType || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Number</p>
                  <p className="font-medium">{selectedContractor.contractNumber || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Contract End Date</p>
                  <p className="font-medium">{formatDate(selectedContractor.contractEnd) || '—'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
