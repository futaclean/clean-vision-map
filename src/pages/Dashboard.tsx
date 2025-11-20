import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, MapPin, BarChart3, FileText, Menu, Leaf, LogOut, Clock, CheckCircle2, Shield, Edit2, X, Save, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/NotificationBell";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCleaner, setIsCleaner] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    inProgress: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const reportsPerPage = 5;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchReportStats();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRecentReports();
    }
  }, [user, currentPage, searchTerm]);

  useEffect(() => {
    // Reset to page 1 when search term changes
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Real-time subscription for waste reports
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('waste-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_reports',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          
          // Refresh reports and stats when data changes
          fetchRecentReports();
          fetchReportStats();
          
          // Show toast notification for new reports
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New report submitted",
              description: "Your waste report has been added successfully",
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Report updated",
              description: "Report status has been updated",
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "Report deleted",
              description: "Report has been removed",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id);

      if (data && data.length > 0) {
        const roles = data.map(r => r.role);
        setIsAdmin(roles.includes('admin'));
        setIsCleaner(roles.includes('cleaner') || roles.includes('admin'));
      } else {
        setIsAdmin(false);
        setIsCleaner(false);
      }
    } catch (error) {
      setIsAdmin(false);
      setIsCleaner(false);
    } finally {
      setIsChecking(false);
    }
  };

  const fetchReportStats = async () => {
    try {
      const { data: reports } = await supabase
        .from('waste_reports')
        .select('status')
        .eq('user_id', user!.id);

      if (reports) {
        const total = reports.length;
        const pending = reports.filter(r => r.status === 'pending').length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const inProgress = reports.filter(r => r.status === 'in_progress').length;

        setStats({ total, pending, resolved, inProgress });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentReports = async () => {
    if (!user) {
      console.log('No user found, skipping fetch');
      return;
    }
    
    setIsLoadingReports(true);
    
    try {
      const from = (currentPage - 1) * reportsPerPage;
      const to = from + reportsPerPage - 1;

      console.log('Fetching reports for user:', user.id, 'Page:', currentPage, 'Range:', from, to);

      // First, get the count
      let countQuery = supabase
        .from('waste_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Apply search filter to count if needed
      if (searchTerm.trim()) {
        countQuery = countQuery.or(`waste_type.ilike.%${searchTerm}%,location_address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('Error fetching count:', countError);
        throw countError;
      }

      console.log('Total count:', count);
      setTotalReports(count || 0);

      // Then, get the actual data
      let dataQuery = supabase
        .from('waste_reports')
        .select('*')
        .eq('user_id', user.id);

      // Apply search filter to data if needed
      if (searchTerm.trim()) {
        dataQuery = dataQuery.or(`waste_type.ilike.%${searchTerm}%,location_address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data: reports, error: dataError } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to);

      console.log('Query result - Reports:', reports, 'Error:', dataError);

      if (dataError) {
        console.error('Error fetching reports:', dataError);
        throw dataError;
      }

      console.log('Setting reports state:', reports?.length || 0, 'reports');
      setRecentReports(reports || []);
    } catch (error) {
      console.error('Exception fetching recent reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports. Please try again.",
        variant: "destructive",
      });
      setRecentReports([]);
      setTotalReports(0);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const handleReportClick = (report: any) => {
    setSelectedReport(report);
    setEditedReport(report);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedReport(selectedReport);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveReport = async () => {
    if (!editedReport) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({
          status: editedReport.status,
          waste_type: editedReport.waste_type,
          severity: editedReport.severity,
          description: editedReport.description,
        })
        .eq('id', editedReport.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report updated successfully",
      });

      setSelectedReport(editedReport);
      setIsEditing(false);
      
      // Refresh the reports list
      setCurrentPage(1);
      await fetchRecentReports();
      await fetchReportStats();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('waste_reports')
        .delete()
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });

      setShowDeleteDialog(false);
      setIsDialogOpen(false);
      
      // Refresh the reports list and reset to page 1
      setCurrentPage(1);
      await fetchRecentReports();
      await fetchReportStats();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      resolved: { variant: "default" as const, className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      in_progress: { variant: "default" as const, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      pending: { variant: "default" as const, className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statsCards = [
    { label: "Reports Submitted", value: stats.total.toString(), icon: FileText, color: "text-blue-600" },
    { label: "Pending Review", value: stats.pending.toString(), icon: Clock, color: "text-yellow-600" },
    { label: "Resolved Issues", value: stats.resolved.toString(), icon: CheckCircle2, color: "text-green-600" },
    { label: "In Progress", value: stats.inProgress.toString(), icon: BarChart3, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary border-b border-border/50 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-white rounded-full p-2">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-white">CleanFUTA</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-white hover:text-white/80 font-medium">
                Dashboard
              </Link>
              <Link to="/report" className="text-white/80 hover:text-white font-medium">
                Report Waste
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-white/80 hover:text-white font-medium flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
              )}
            </nav>
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="ghost" onClick={signOut} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {user.user_metadata?.full_name || 'User'}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your waste reports and environmental impact
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-glow transition-all duration-300 border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`bg-gradient-card rounded-xl p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Quick Access */}
        {isAdmin && (
          <Card className="shadow-card border-border mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-xl p-3">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>Admin Access</CardTitle>
                  <CardDescription>Manage reports, users, and cleaners</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/admin">Open Admin Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Cleaner Quick Access */}
        {isCleaner && !isAdmin && (
          <Card className="shadow-card border-border mb-8 bg-gradient-to-r from-blue-500/10 to-blue-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-xl p-3">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Cleaner Dashboard</CardTitle>
                  <CardDescription>View and manage your assigned reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link to="/cleaner">Open Cleaner Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-glow transition-all duration-300 border-border group cursor-pointer">
            <CardHeader>
              <div className="bg-gradient-card rounded-xl p-4 w-fit mb-2 group-hover:scale-110 transition-transform">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Report New Waste</CardTitle>
              <CardDescription>
                Upload a photo and report waste in your area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-gradient-primary hover:opacity-90">
                <Link to="/report">Start Report</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all duration-300 border-border group cursor-pointer">
            <CardHeader>
              <div className="bg-gradient-card rounded-xl p-4 w-fit mb-2 group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>View Map</CardTitle>
              <CardDescription>
                See waste hotspots and reports on the map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-primary/50 hover:bg-primary/5">
                <Link to="/map">Open Map</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all duration-300 border-border group cursor-pointer">
            <CardHeader>
              <div className="bg-gradient-card rounded-xl p-4 w-fit mb-2 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Your Analytics</CardTitle>
              <CardDescription>
                View your environmental impact statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full border-primary/50 hover:bg-primary/5">
                <Link to="/analytics">View Stats</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  {totalReports > 0 ? `Showing ${recentReports.length} of ${totalReports} reports` : 'Your latest waste reports'}
                </CardDescription>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by waste type, location, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {searchTerm ? (
                  <>
                    <p className="text-lg mb-2">No reports found</p>
                    <p className="text-sm mb-4">Try adjusting your search terms</p>
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">No reports yet</p>
                    <p className="text-sm mb-4">Start by reporting waste in your area</p>
                    <Button asChild className="bg-gradient-primary hover:opacity-90">
                      <Link to="/report">Create First Report</Link>
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">
                          {report.waste_type || 'General Waste'}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'resolved'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : report.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}
                        >
                          {report.status === 'in_progress' ? 'In Progress' : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.location_address || 'Location not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalReports > reportsPerPage && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {Math.ceil(totalReports / reportsPerPage)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalReports / reportsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(totalReports / reportsPerPage)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Report Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Report Details</DialogTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEditToggle} disabled={isSaving}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveReport} disabled={isSaving}>
                      <Save className="h-4 w-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEditToggle}>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              {/* Report Image */}
              {selectedReport.image_url && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img 
                    src={selectedReport.image_url} 
                    alt="Waste report" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Status and Waste Type */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Status */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Status</Label>
                    {isEditing ? (
                      <Select 
                        value={editedReport.status} 
                        onValueChange={(value) => setEditedReport({...editedReport, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={getStatusBadge(selectedReport.status).className}>
                        {selectedReport.status === 'in_progress' ? 'In Progress' : selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                      </Badge>
                    )}
                  </div>

                  {/* Waste Type */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Waste Type</Label>
                    {isEditing ? (
                      <Input
                        value={editedReport.waste_type || ''}
                        onChange={(e) => setEditedReport({...editedReport, waste_type: e.target.value})}
                        placeholder="e.g., Plastic, Organic"
                      />
                    ) : (
                      selectedReport.waste_type && (
                        <Badge variant="outline">{selectedReport.waste_type}</Badge>
                      )
                    )}
                  </div>

                  {/* Severity */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Severity</Label>
                    {isEditing ? (
                      <Select 
                        value={editedReport.severity || 'medium'} 
                        onValueChange={(value) => setEditedReport({...editedReport, severity: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      selectedReport.severity && (
                        <Badge variant="outline" className={
                          selectedReport.severity === 'high' ? 'border-red-500 text-red-700 dark:text-red-400' :
                          selectedReport.severity === 'medium' ? 'border-orange-500 text-orange-700 dark:text-orange-400' :
                          'border-green-500 text-green-700 dark:text-green-400'
                        }>
                          {selectedReport.severity.charAt(0).toUpperCase() + selectedReport.severity.slice(1)} Severity
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedReport.description || ''}
                    onChange={(e) => setEditedReport({...editedReport, description: e.target.value})}
                    placeholder="Enter report description"
                    rows={4}
                  />
                ) : (
                  selectedReport.description && (
                    <p className="text-muted-foreground">{selectedReport.description}</p>
                  )
                )}
              </div>

              {/* Location */}
              <div>
                <h4 className="font-semibold text-foreground mb-2">Location</h4>
                <p className="text-muted-foreground">
                  {selectedReport.location_address || 'Address not specified'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Coordinates: {selectedReport.location_lat}, {selectedReport.location_lng}
                </p>
              </div>

              {/* AI Analysis */}
              {selectedReport.ai_analysis && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">AI Analysis</h4>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(selectedReport.ai_analysis, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <h4 className="font-semibold text-foreground text-sm mb-1">Submitted</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReport.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {selectedReport.updated_at && selectedReport.updated_at !== selectedReport.created_at && (
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">Last Updated</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedReport.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Report ID */}
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Report ID: {selectedReport.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this waste report
              from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReport}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
