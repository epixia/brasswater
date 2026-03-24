import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  Building2,
  Calendar,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Rating } from '@/components/ui/rating';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  fetchInspection,
  fetchInspectionTemplates,
  updateInspection,
} from '@/lib/dataService';
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [overallRating, setOverallRating] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [insp, tpls] = await Promise.all([fetchInspection(id), fetchInspectionTemplates()]);
        setInspection(insp);
        setOverallRating(insp.rating || 0);
        setTemplates(tpls);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const template = useMemo(() => {
    if (!inspection) return null;
    return templates.find((t) => t.id === inspection.templateId) || null;
  }, [inspection, templates]);

  const checklistItems = useMemo(() => {
    if (!template) return [];
    const items = template.checklist || [];
    if (items.length > 0 && items[0]?.items) {
      return items.flatMap((section) =>
        (section.items || []).map((item) => ({
          ...item,
          section: section.name || section.title,
        }))
      );
    }
    return items.map((item, idx) => ({
      id: item.id || idx,
      text: item.text || item.name || item.description || item,
      section: null,
    }));
  }, [template]);

  const [itemRatings, setItemRatings] = useState({});

  useEffect(() => {
    const map = {};
    checklistItems.forEach((item) => {
      map[item.id || item.text] = { rating: 0, notes: '' };
    });
    setItemRatings(map);
  }, [checklistItems]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-muted-foreground">Loading inspection...</div></div>;
  if (error) return <div className="flex items-center justify-center h-64"><div className="text-red-500">Error: {error}</div></div>;

  if (!inspection) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/inspections')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Inspections
        </Button>
        <EmptyState
          icon={ClipboardCheck}
          title="Inspection not found"
          description="The inspection you are looking for does not exist."
          action={<Button onClick={() => navigate('/inspections')}>View All Inspections</Button>}
        />
      </div>
    );
  }

  const buildingName = inspection.buildings?.name || 'Unknown Building';
  const categoryName = inspection.inspectionTemplates?.categoryName || inspection.inspectionTemplates?.categoryCode || template?.categoryName || 'General';

  const isCompleted = inspection.status === 'completed';
  const isInteractive = inspection.status === 'scheduled' || inspection.status === 'in_progress';

  const handleItemRating = (itemKey, rating) => {
    setItemRatings((prev) => ({ ...prev, [itemKey]: { ...prev[itemKey], rating } }));
  };

  const handleItemNotes = (itemKey, notes) => {
    setItemRatings((prev) => ({ ...prev, [itemKey]: { ...prev[itemKey], notes } }));
  };

  const handleComplete = async () => {
    if (overallRating === 0) {
      toast({ title: 'Rating required', description: 'Please set an overall rating before completing the inspection.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateInspection(id, {
        status: 'completed',
        rating: overallRating,
        completedDate: new Date().toISOString().split('T')[0],
      });
      setInspection((prev) => ({ ...prev, status: 'completed', rating: overallRating }));
      toast({ title: 'Inspection completed', description: `Inspection for ${buildingName} has been marked as completed.` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  let currentSection = null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inspections')} className="gap-1 px-2">
          <ArrowLeft className="h-4 w-4" /> Inspections
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">
          {buildingName} - {categoryName}
        </span>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Building</p>
                <p className="font-medium">{buildingName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{categoryName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(inspection.scheduledDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={inspection.assignedTo || 'Unassigned'} size="md" />
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">{inspection.assignedTo || 'Unassigned'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
            <Badge variant={getStatusColor(inspection.status)} className="text-sm px-3 py-1">
              {getStatusLabel(inspection.status)}
            </Badge>
            {isCompleted && inspection.rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Overall Rating:</span>
                <Rating value={inspection.rating} size="sm" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      {checklistItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isCompleted ? 'Inspection Results' : 'Inspection Checklist'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklistItems.map((item, idx) => {
              const itemKey = item.id || item.text || idx;
              const itemText = typeof item === 'string' ? item : item.text || item.name || item.description;
              const showSection = item.section && item.section !== currentSection;
              if (showSection) currentSection = item.section;

              return (
                <div key={itemKey}>
                  {showSection && (
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                      {item.section}
                    </h3>
                  )}
                  <div className="p-4 rounded-lg bg-white/5 border border-border space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-medium shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="font-medium">{itemText}</p>
                      </div>
                      <div className="shrink-0">
                        <Rating
                          value={itemRatings[itemKey]?.rating || 0}
                          size="sm"
                          interactive={isInteractive}
                          onChange={isInteractive ? (val) => handleItemRating(itemKey, val) : undefined}
                        />
                      </div>
                    </div>
                    {isInteractive && (
                      <Input
                        placeholder="Add notes for this item..."
                        value={itemRatings[itemKey]?.notes || ''}
                        onChange={(e) => handleItemNotes(itemKey, e.target.value)}
                        className="text-sm"
                      />
                    )}
                    {isCompleted && itemRatings[itemKey]?.notes && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{itemRatings[itemKey].notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>

          {isInteractive && (
            <CardFooter className="flex-col items-stretch gap-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Overall Rating</Label>
                  <p className="text-sm text-muted-foreground">Rate the overall condition of the building</p>
                </div>
                <Rating value={overallRating} size="md" interactive onChange={setOverallRating} />
              </div>
              <Button className="w-full gap-2" size="lg" onClick={handleComplete} disabled={saving}>
                <CheckCircle className="h-5 w-5" />
                {saving ? 'Saving...' : 'Complete Inspection'}
              </Button>
            </CardFooter>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={ClipboardCheck} title="No checklist items" description="This inspection template does not have any checklist items configured." />
          </CardContent>
        </Card>
      )}

      {inspection.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{inspection.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
