import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Leaf, MapPin, Calendar, User, CheckCircle2, Clock, AlertCircle, XCircle, Truck, Sparkles } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { BeforeAfterImage } from "@/components/BeforeAfterImage";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";

interface WasteReport {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  waste_type: string;
  severity: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  user_id: string;
  assigned_to: string | null;
  image_url: string;
  description: string | null;
  after_image_url: string | null;
  ai_analysis: any;
}

interface CleanerProfile {
  id: string;
  full_name: string;
  email: string;
}

interface TimelineEvent {
  status: string;
  label: string;
  icon: any;
  color: string;
  timestamp?: string;
  completed: boolean;
}

const ReportTracking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { reportId } = useParams();
  const [report, setReport] = useState<WasteReport | null>(null);
  const [cleaner, setCleaner] = useState<CleanerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && reportId) {
      fetchReportDetails();
    }
  }, [user, reportId]);

  // Real-time subscription for report updates
  useEffect(() => {
    if (!reportId) return;

    const channel = supabase
      .channel(`report-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'waste_reports',
          filter: `id=eq.${reportId}`
        },
        (payload) => {
          console.log('Report updated:', payload);
          fetchReportDetails();
          toast({
            title: "Report Updated",
            description: "Your report status has been updated",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (reportError) throw reportError;

      if (reportData.user_id !== user?.id) {
        toast({
          title: "Access Denied",
          description: "You can only view your own reports",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setReport(reportData);

      // Fetch cleaner details if assigned
      if (reportData.assigned_to) {
        const { data: cleanerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', reportData.assigned_to)
          .single();

        setCleaner(cleanerData);
      } else {
        setCleaner(null);
      }
    } catch (error: any) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load report details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = (): TimelineEvent[] => {
    if (!report) return [];

    const timeline: TimelineEvent[] = [
      {
        status: 'submitted',
        label: 'Report Submitted',
        icon: CheckCircle2,
        color: 'text-green-600',
        timestamp: report.created_at,
        completed: true
      },
      {
        status: 'pending',
        label: 'Pending Review',
        icon: Clock,
        color: 'text-yellow-600',
        timestamp: report.status === 'pending' ? report.created_at : undefined,
        completed: report.status !== 'pending'
      },
      {
        status: 'in_progress',
        label: 'Work in Progress',
        icon: Truck,
        color: 'text-blue-600',
        timestamp: report.status === 'in_progress' ? report.updated_at : undefined,
        completed: ['resolved', 'rejected'].includes(report.status)
      },
      {
        status: 'resolved',
        label: report.status === 'rejected' ? 'Rejected' : 'Completed',
        icon: report.status === 'rejected' ? XCircle : CheckCircle2,
        color: report.status === 'rejected' ? 'text-red-600' : 'text-green-600',
        timestamp: ['resolved', 'rejected'].includes(report.status) ? report.updated_at : undefined,
        completed: ['resolved', 'rejected'].includes(report.status)
      }
    ];

    return timeline;
  };

  const getEstimatedCompletion = () => {
    if (!report) return null;

    const estimatedHours: Record<string, number> = {
      pending: 24,
      in_progress: 4,
      resolved: 0,
      rejected: 0
    };

    const hours = estimatedHours[report.status] || 0;
    if (hours === 0) return null;

    const estimatedDate = new Date(report.updated_at || report.created_at);
    estimatedDate.setHours(estimatedDate.getHours() + hours);

    return estimatedDate;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
      <Badge className={colors[severity] || colors.medium}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Pending" },
      in_progress: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "In Progress" },
      resolved: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Resolved" },
      rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Rejected" }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The report you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const timeline = getStatusTimeline();
  const estimatedCompletion = getEstimatedCompletion();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 mr-3">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-display font-bold text-foreground leading-tight">Report Tracking</span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Live Status</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        {/* Report Status Overview */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="capitalize">{report.waste_type} Report</CardTitle>
                  <CardDescription>
                    Submitted {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </CardDescription>
                </div>
                {getStatusBadge(report.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Image */}
              {report.image_url && (
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={report.image_url}
                    alt="Waste report"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Report Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Severity
                  </p>
                  {getSeverityBadge(report.severity)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Submitted On
                  </p>
                  <p className="font-medium">{format(new Date(report.created_at), 'PPP')}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="font-medium">{report.location_address || 'No address provided'}</p>
                </div>
                {report.description && (
                  <div className="space-y-1 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{report.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Cleaner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assigned Cleaner</CardTitle>
            </CardHeader>
            <CardContent>
              {cleaner ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {cleaner.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{cleaner.full_name}</p>
                      <p className="text-sm text-muted-foreground">{cleaner.email}</p>
                    </div>
                  </div>
                  
                  {estimatedCompletion && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Estimated Completion</p>
                      <p className="font-semibold">{format(estimatedCompletion, 'PPP p')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(estimatedCompletion, { addSuffix: true })}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    No cleaner assigned yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your report is being reviewed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Before/After Comparison */}
        {report.after_image_url && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Work Documentation</h3>
              {report.ai_analysis && (
                <Button
                  variant="outline"
                  onClick={() => setAiAnalysisDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  View AI Analysis
                </Button>
              )}
            </div>
            <BeforeAfterImage
              beforeImage={report.image_url}
              afterImage={report.after_image_url}
              beforeLabel="Before Cleaning"
              afterLabel="After Cleaning"
            />
            {report.ai_analysis && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">AI Cleanliness Score</h4>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-1">
                      {report.ai_analysis.score}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{report.ai_analysis.summary}</p>
                  <Button
                    variant="link"
                    onClick={() => setAiAnalysisDialog(true)}
                    className="p-0 h-auto"
                  >
                    View detailed analysis →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Timeline</CardTitle>
            <CardDescription>Track the status of your report</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {timeline.map((event, index) => {
                const Icon = event.icon;
                const isLast = index === timeline.length - 1;
                const isCurrent = event.completed && (index === timeline.length - 1 || !timeline[index + 1].completed);

                return (
                  <div key={event.status} className="relative pb-8">
                    {!isLast && (
                      <div
                        className={`absolute left-4 top-8 w-0.5 h-full ${
                          event.completed ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                    <div className="flex items-start gap-4">
                      <div
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          event.completed
                            ? 'bg-primary border-primary'
                            : 'bg-background border-muted'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            event.completed ? 'text-primary-foreground' : 'text-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {event.label}
                        </p>
                        {event.timestamp && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.timestamp), 'PPP p')}
                          </p>
                        )}
                        {isCurrent && !isLast && (
                          <Badge variant="secondary" className="mt-2">
                            Current Status
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* AI Analysis Dialog */}
      <AIAnalysisDialog
        open={aiAnalysisDialog}
        onOpenChange={setAiAnalysisDialog}
        analysis={report?.ai_analysis}
        isAnalyzing={false}
      />
    </div>
  );
};

export default ReportTracking;
