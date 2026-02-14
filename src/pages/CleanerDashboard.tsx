import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Leaf, RefreshCw, ClipboardList, CheckCircle, Clock, TrendingUp, Eye, MapPin, Route, Camera, Upload, X, XCircle, Sparkles, BarChart3, Settings, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { CleanerRouteView } from "@/components/CleanerRouteView";
import { NotificationBell } from "@/components/NotificationBell";
import { MobileNav } from "@/components/MobileNav";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import { Switch } from "@/components/ui/switch";
import { AIAnalysisDialog } from "@/components/AIAnalysisDialog";
import { VALID_REPORT_STATUSES, isValidReportStatus, type ReportStatus, VALID_SEVERITY_LEVELS, isValidSeverity, getSeverityLabel } from "@/lib/constants";

interface WasteReport {
  id: string;
  created_at: string;
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
  updated_at: string | null;
  after_image_url: string | null;
  rejection_reason: string | null;
}

const CleanerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCleaner, setIsCleaner] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [afterImagePreview, setAfterImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { notifyReportStatusChanged } = useNotifications();
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const { isTracking, error: trackingError } = useLocationTracking(trackingEnabled);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'off_duty'>('available');
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [aiAnalysisDialog, setAiAnalysisDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkCleanerStatus();
    }
  }, [user]);

  // Real-time subscription for assigned reports
  useEffect(() => {
    if (!isCleaner || !user) return;

    const channel = supabase
      .channel('cleaner-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_reports',
          filter: `assigned_to=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            toast({
              title: payload.eventType === 'INSERT' ? "New Assignment" : "Report Updated",
              description: payload.eventType === 'INSERT' 
                ? "You have been assigned a new report" 
                : "One of your reports has been updated",
            });
          }
          
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isCleaner, user]);

  const checkCleanerStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .in('role', ['cleaner', 'admin'])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setIsCleaner(true);
        await fetchReports();
        await fetchAvailabilityStatus();
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have cleaner privileges",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error checking cleaner status:", error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilityStatus = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('availability_status')
      .eq('id', user!.id)
      .single();

    if (error) {
      console.error('Error fetching availability:', error);
    } else if (data?.availability_status) {
      setAvailabilityStatus(data.availability_status);
    }
  };

  const updateAvailabilityStatus = async (newStatus: 'available' | 'busy' | 'off_duty') => {
    setIsUpdatingAvailability(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ availability_status: newStatus })
      .eq('id', user!.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive",
      });
    } else {
      setAvailabilityStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus.replace('_', ' ')}`,
      });
    }
    
    setIsUpdatingAvailability(false);
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
      .eq('assigned_to', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching reports",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReports(data || []);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string, reason?: string) => {
    // Validate status before submitting
    if (!isValidReportStatus(newStatus)) {
      toast({
        title: "Invalid Status",
        description: `"${newStatus}" is not a valid status. Please select a valid option.`,
        variant: "destructive",
      });
      return;
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    }

    const { error, data: reportData } = await supabase
      .from('waste_reports')
      .update(updateData)
      .eq('id', reportId)
      .select('user_id')
      .single();

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Notify the report submitter
      if (reportData?.user_id) {
        await notifyReportStatusChanged(reportData.user_id, reportId, newStatus, reason);
      }

      toast({
        title: "Status updated",
        description: "Report status changed successfully",
      });
      fetchReports();
    }
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!selectedReport || !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this report",
        variant: "destructive",
      });
      return;
    }

    await handleStatusChange(selectedReport.id, 'rejected', rejectionReason);
    setRejectDialogOpen(false);
    setReportDialogOpen(false);
    setRejectionReason("");
  };

  const handleAfterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setAfterImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAfterImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCompleteWithPhoto = async () => {
    if (!selectedReport || !afterImage) return;

    setUploadingImage(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = afterImage.name.split('.').pop();
      const fileName = `${selectedReport.id}-after-${Date.now()}.${fileExt}`;
      const filePath = `waste-reports/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('waste-reports')
        .upload(filePath, afterImage);

      if (uploadError) throw uploadError;

      // Get public URL for after image

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('waste-reports')
        .getPublicUrl(filePath);

      // Update report with after image and status
      const { error: updateError } = await supabase
        .from('waste_reports')
        .update({
          status: 'resolved',
          after_image_url: publicUrl
        })
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      // Send email notification
      supabase.functions.invoke("send-status-notification", {
        body: { reportId: selectedReport.id, status: "resolved" },
      }).catch(err => console.error("Email notification error:", err));

      toast({
        title: "Work completed!",
        description: "Report marked as resolved. Analyzing cleanup with AI...",
      });

      setReportDialogOpen(false);
      setAfterImage(null);
      setAfterImagePreview(null);
      fetchReports();

      // Trigger AI analysis in background
      setIsAnalyzing(true);
      setAiAnalysisDialog(true);
      
      try {
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
          'analyze-cleanup',
          {
            body: {
              beforeImageUrl: selectedReport.image_url,
              afterImageUrl: publicUrl,
              reportId: selectedReport.id
            }
          }
        );

        if (analysisError) {
          console.error('AI analysis error:', analysisError);
          toast({
            title: "AI Analysis Failed",
            description: "Couldn't analyze the cleanup images, but report was marked as complete.",
            variant: "destructive"
          });
        } else {
          setAiAnalysis(analysisData.analysis);
          toast({
            title: "AI Analysis Complete",
            description: "Check out the detailed cleanup analysis!",
          });
        }
      } catch (analysisError) {
        console.error('AI analysis error:', analysisError);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload completion photo",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      resolved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status.replace('_', ' ')}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-600",
      medium: "bg-yellow-600",
      high: "bg-red-600",
    };
    const label = isValidSeverity(severity) ? getSeverityLabel(severity) : severity;
    return <Badge className={colors[severity] || "bg-gray-500"}>{label}</Badge>;
  };

  const handleViewReport = (report: WasteReport) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  // Statistics calculations
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in_progress').length,
    completed: reports.filter(r => r.status === 'resolved').length,
    completionRate: reports.length > 0 
      ? Math.round((reports.filter(r => r.status === 'resolved').length / reports.length) * 100) 
      : 0,
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 neon-border rounded-xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Loading Cleaner Panel...</p>
        </div>
      </div>
    );
  }

  if (!isCleaner) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
                  <Leaf className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-display font-bold text-foreground leading-tight">Cleaner Dashboard</span>
                <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Field Operations</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Availability Status */}
            <div className="hidden md:flex items-center gap-2 neon-border rounded-lg px-3 py-1.5 bg-card/50">
              <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Status</span>
              <Select 
                value={availabilityStatus} 
                onValueChange={(value: 'available' | 'busy' | 'off_duty') => updateAvailabilityStatus(value)}
                disabled={isUpdatingAvailability}
              >
                <SelectTrigger className="w-[120px] h-7 text-xs border-0 bg-transparent p-0 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span>Available</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="busy">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span>Busy</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="off_duty">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>Off Duty</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GPS Tracking Toggle */}
            <div className="hidden md:flex items-center gap-2 neon-border rounded-lg px-3 py-1.5 bg-card/50">
              <Label htmlFor="location-tracking" className="cursor-pointer text-[10px] font-mono tracking-wider">
                {isTracking ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    GPS LIVE
                  </span>
                ) : (
                  <span className="text-muted-foreground uppercase">GPS Off</span>
                )}
              </Label>
              <Switch
                id="location-tracking"
                checked={trackingEnabled}
                onCheckedChange={setTrackingEnabled}
              />
            </div>
            {trackingError && (
              <p className="text-xs text-destructive">{trackingError}</p>
            )}
              
            <NotificationBell />
            <Button onClick={fetchReports} variant="ghost" size="icon" className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <MobileNav
              links={[
                { label: "Dashboard", to: "/dashboard", icon: <BarChart3 className="h-4 w-4" /> },
                { label: "Cleaner Panel", to: "/cleaner", icon: <ClipboardList className="h-4 w-4" /> },
                { label: "Report Waste", to: "/report", icon: <Camera className="h-4 w-4" /> },
                { label: "Preferences", to: "/preferences", icon: <Settings className="h-4 w-4" /> },
              ]}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Assigned", value: stats.total, icon: ClipboardList },
            { label: "Pending", value: stats.pending, icon: Clock },
            { label: "In Progress", value: stats.inProgress, icon: RefreshCw },
            { label: "Completed", value: stats.completed, icon: CheckCircle },
            { label: "Completion Rate", value: `${stats.completionRate}%`, icon: TrendingUp },
          ].map((stat, i) => (
            <Card key={i} className="neon-border shadow-card bg-card/80 backdrop-blur-sm hover:shadow-glow transition-all duration-300">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase mb-1">{stat.label}</p>
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="neon-border rounded-lg p-2.5 bg-primary/5">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="route">
              <Route className="h-4 w-4 mr-2" />
              Route Planner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assigned Reports</CardTitle>
                    <CardDescription>Manage your assigned waste reports</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reports Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No reports found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell className="font-medium">
                              {new Date(report.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="capitalize">{report.waste_type}</TableCell>
                            <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {report.location_address || 'No address'}
                            </TableCell>
                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewReport(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Select
                                  value={report.status}
                                  onValueChange={(value) => handleStatusChange(report.id, value)}
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-background">
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Active Reports</CardTitle>
                <CardDescription>Reports that are pending or in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.filter(r => r.status === 'pending' || r.status === 'in_progress').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No active reports
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports
                          .filter(r => r.status === 'pending' || r.status === 'in_progress')
                          .map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="capitalize">{report.waste_type}</TableCell>
                              <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {report.location_address || 'No address'}
                              </TableCell>
                              <TableCell>{getStatusBadge(report.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewReport(report)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Select
                                    value={report.status}
                                    onValueChange={(value) => handleStatusChange(report.id, value)}
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background">
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="resolved">Resolved</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Completed Reports</CardTitle>
                <CardDescription>Reports you have resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.filter(r => r.status === 'resolved').length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No completed reports yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports
                          .filter(r => r.status === 'resolved')
                          .map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="capitalize">{report.waste_type}</TableCell>
                              <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {report.location_address || 'No address'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewReport(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Route Planner Tab */}
          <TabsContent value="route" className="space-y-4">
            <CleanerRouteView 
              reports={reports.filter(r => r.status !== 'resolved' && r.status !== 'rejected')} 
              cleanerId={user!.id}
              onReportComplete={fetchReports}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Report Details Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Complete information about this waste report</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-lg capitalize">{selectedReport.waste_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Severity</p>
                  <div className="mt-1">{getSeverityBadge(selectedReport.severity)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reported On</p>
                  <p className="text-lg">{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <p>{selectedReport.location_address || 'No address provided'}</p>
                </div>
              </div>

              {selectedReport.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p className="text-sm">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.image_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Before Image</p>
                  <img 
                    src={selectedReport.image_url} 
                    alt="Waste report before" 
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* After Photo Upload Section */}
              {selectedReport.status !== 'resolved' && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">
                    Upload Completion Photo (After)
                  </Label>
                  
                  {afterImagePreview ? (
                    <div className="relative">
                      <img 
                        src={afterImagePreview} 
                        alt="After photo preview" 
                        className="w-full rounded-lg mb-3"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setAfterImage(null);
                          setAfterImagePreview(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="after-photo"
                        accept="image/*"
                        onChange={handleAfterImageChange}
                        className="hidden"
                      />
                      <label htmlFor="after-photo" className="cursor-pointer">
                        <Camera className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm font-medium mb-1">Upload completion photo</p>
                        <p className="text-xs text-muted-foreground">
                          Click to select or drag and drop
                        </p>
                      </label>
                    </div>
                  )}

                  {afterImage && (
                    <Button
                      className="w-full mt-3"
                      onClick={handleCompleteWithPhoto}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Work with Photo
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Show After Image if already completed */}
              {selectedReport.after_image_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">After Image (Completed)</p>
                  <img 
                    src={selectedReport.after_image_url} 
                    alt="Waste report after" 
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {selectedReport.rejection_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive mb-2">Rejection Reason</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.rejection_reason}</p>
                </div>
              )}

              {!afterImage && selectedReport.status !== 'rejected' && (
                <div className="flex gap-2 pt-4">
                  <Select
                    value={selectedReport.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedReport.id, value);
                      setReportDialogOpen(false);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {VALID_REPORT_STATUSES.filter(status => status !== 'rejected' && status !== 'assigned').map(status => (
                        <SelectItem key={status} value={status}>
                          {status === 'pending' && 'Mark as Pending'}
                          {status === 'in_progress' && 'Mark as In Progress'}
                          {status === 'resolved' && 'Mark as Resolved (No Photo)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Report</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this waste report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejecting this report..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Dialog */}
      <AIAnalysisDialog
        open={aiAnalysisDialog}
        onOpenChange={setAiAnalysisDialog}
        analysis={aiAnalysis}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
};

export default CleanerDashboard;
