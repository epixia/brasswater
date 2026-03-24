import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Ruler,
  Layers,
  ArrowUpDown,
  Droplets,
  ShieldCheck,
  Car,
  Accessibility,
  ClipboardCheck,
  Wrench,
  Shield,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import {
  fetchBuilding,
  fetchInspections,
  fetchWorkOrders,
  fetchCompliance,
  fetchInspectionTemplates,
} from '@/lib/dataService';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function BuildingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inspections');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [building, setBuilding] = useState(null);
  const [buildingInspections, setBuildingInspections] = useState([]);
  const [buildingWorkOrders, setBuildingWorkOrders] = useState([]);
  const [buildingCompliance, setBuildingCompliance] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [b, insp, wo, comp, tpls] = await Promise.all([
          fetchBuilding(id),
          fetchInspections({ buildingId: id }),
          fetchWorkOrders({ buildingId: id }),
          fetchCompliance({ buildingId: id }),
          fetchInspectionTemplates(),
        ]);
        setBuilding(b);
        setBuildingInspections(insp);
        setBuildingWorkOrders(wo);
        setBuildingCompliance(comp);
        setTemplates(tpls);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const getTemplateName = (insp) => {
    return insp.inspectionTemplates?.categoryName || insp.inspectionTemplates?.categoryCode ||
      templates.find((t) => t.id === insp.templateId)?.categoryName || 'General';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading building...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  if (!building) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/buildings')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Buildings
        </Button>
        <EmptyState
          icon={Building2}
          title="Building not found"
          description="The building you are looking for does not exist."
          action={<Button onClick={() => navigate('/buildings')}>View All Buildings</Button>}
        />
      </div>
    );
  }

  const boolField = (val) =>
    val ? (
      <span className="flex items-center gap-1 text-green-400">
        <CheckCircle className="h-4 w-4" /> Yes
      </span>
    ) : (
      <span className="flex items-center gap-1 text-muted-foreground">
        <XCircle className="h-4 w-4" /> No
      </span>
    );

  const propertyGrid = [
    { label: 'Year Built', value: building.yearBuilt || '—', icon: Calendar },
    { label: 'Last Renovation', value: building.lastRenovation || '—', icon: Calendar },
    { label: 'Units', value: building.units || '—', icon: Building2 },
    { label: 'Floors', value: building.floors || '—', icon: Layers },
    { label: 'Area', value: building.area ? `${building.area} sq ft` : '—', icon: Ruler },
    { label: 'Elevator', value: boolField(building.elevator), icon: ArrowUpDown },
    { label: 'Pool', value: boolField(building.pool), icon: Droplets },
    { label: 'Sprinklers', value: boolField(building.sprinklers), icon: ShieldCheck },
    { label: 'Parking', value: building.parking || boolField(building.hasParking), icon: Car },
    { label: 'Accessibility', value: boolField(building.accessibility), icon: Accessibility },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/buildings')} className="gap-1 px-2">
          <ArrowLeft className="h-4 w-4" /> Buildings
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">{building.name}</span>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {building.name}
              </CardTitle>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {building.address}
                {building.city ? `, ${building.city}` : ''}
                {building.province ? `, ${building.province}` : ''}
                {building.postalCode ? ` ${building.postalCode}` : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {propertyGrid.slice(0, 5).map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-100 dark:bg-white/5 rounded-lg p-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm font-semibold">{typeof value === 'string' ? value : value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inspections" className="gap-1">
            <ClipboardCheck className="h-4 w-4" /> Inspections
          </TabsTrigger>
          <TabsTrigger value="workorders" className="gap-1">
            <Wrench className="h-4 w-4" /> Work Orders
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1">
            <Shield className="h-4 w-4" /> Compliance
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-1">
            <Building2 className="h-4 w-4" /> Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inspections">
          <Card>
            <CardContent className="pt-6">
              {buildingInspections.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No inspections" description="No inspections have been scheduled for this building yet." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildingInspections.map((insp) => (
                      <TableRow key={insp.id} className="cursor-pointer" onClick={() => navigate(`/inspections/${insp.id}`)}>
                        <TableCell>{formatDate(insp.scheduledDate)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getTemplateName(insp)}</Badge>
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
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workorders">
          <Card>
            <CardContent className="pt-6">
              {buildingWorkOrders.length === 0 ? (
                <EmptyState icon={Wrench} title="No work orders" description="No work orders have been created for this building yet." />
              ) : (
                <div className="space-y-3">
                  {buildingWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate('/work-orders')}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{wo.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{wo.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <Badge variant={getStatusColor(wo.type)}>{wo.type}</Badge>
                        <Badge variant={getStatusColor(wo.status)}>{getStatusLabel(wo.status)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardContent className="pt-6">
              {buildingCompliance.length === 0 ? (
                <EmptyState icon={Shield} title="No compliance requirements" description="No compliance requirements tracked for this building." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Standard</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buildingCompliance.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{c.standardCode || '—'}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(c.nextDue)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === 'compliant' ? 'success' : c.status === 'due_soon' ? 'warning' : 'danger'}
                          >
                            {getStatusLabel(c.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertyGrid.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                    <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <div className="font-medium mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {building.notes && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p>{building.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
