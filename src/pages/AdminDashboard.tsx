import { useState, useEffect, useMemo } from "react";
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
import { ArrowLeft, Leaf, RefreshCw, Users, ClipboardList, UserCheck, Eye, Trash2, BarChart3, TrendingUp, Map, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { WasteReportsMap } from "@/components/WasteReportsMap";
import { Link } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [cleaners, setCleaners] = useState<Profile[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [mapFilterStatus, setMapFilterStatus] = useState<string>("all");
  const [mapFilterSeverity, setMapFilterSeverity] = useState<string>("all");
  const [mapFilterType, setMapFilterType] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkCleaner, setBulkCleaner] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  // Real-time subscription for waste reports
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('waste-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waste_reports'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Report",
              description: "A new waste report has been submitted",
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "Report Updated",
              description: "A waste report has been updated",
            });
          }
          
          // Refresh all data
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setIsAdmin(true);
        await Promise.all([fetchReports(), fetchCleaners(), fetchUsers(), fetchUserRoles()]);
      } else {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('waste_reports')
      .select('*')
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

  const fetchCleaners = async () => {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'cleaner');

    if (rolesData && rolesData.length > 0) {
      const cleanerIds = rolesData.map(r => r.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', cleanerIds);

      setCleaners(profilesData || []);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  const fetchUserRoles = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role');

    setUserRoles(data || []);
  };

  const handleAssignCleaner = async (reportId: string, cleanerId: string) => {
    const { error } = await supabase
      .from('waste_reports')
      .update({ 
        assigned_to: cleanerId === 'unassigned' ? null : cleanerId,
        status: cleanerId === 'unassigned' ? 'pending' : 'in_progress'
      })
      .eq('id', reportId);

    if (error) {
      toast({
        title: "Error assigning cleaner",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cleaner assigned",
        description: "Report updated successfully",
      });
      fetchReports();
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    const { error } = await supabase
      .from('waste_reports')
      .update({ status: newStatus })
      .eq('id', reportId);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status updated",
        description: "Report status changed successfully",
      });
      fetchReports();
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole as 'admin' | 'cleaner' | 'user' }]);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role changed successfully",
      });
      await Promise.all([fetchUserRoles(), fetchCleaners()]);
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    if (filterType !== "all" && report.waste_type !== filterType) return false;
    return true;
  });

  const mapFilteredReports = reports.filter(report => {
    if (mapFilterStatus !== "all" && report.status !== mapFilterStatus) return false;
    if (mapFilterSeverity !== "all" && report.severity !== mapFilterSeverity) return false;
    if (mapFilterType !== "all" && report.waste_type !== mapFilterType) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      resolved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return <Badge className={colors[status] || "bg-gray-500"}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-600",
      medium: "bg-yellow-600",
      high: "bg-red-600",
    };
    return <Badge className={colors[severity] || "bg-gray-500"}>{severity}</Badge>;
  };

  const getUserName = (userId: string) => {
    const userProfile = users.find(u => u.id === userId);
    return userProfile?.full_name || 'Unknown User';
  };

  const handleViewReport = (report: WasteReport) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const { error } = await supabase
        .from('waste_reports')
        .delete()
        .eq('id', reportToDelete);

      if (error) throw error;

      toast({
        title: "Report deleted",
        description: "The waste report has been deleted successfully",
      });
      
      setDeleteDialogOpen(false);
      setReportToDelete(null);
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error deleting report",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getUserRole = (userId: string) => {
    const userRole = userRoles.find(ur => ur.user_id === userId);
    return userRole?.role || 'user';
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportIds(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReportIds.length === filteredReports.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filteredReports.map(r => r.id));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkAction || selectedReportIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({ status: bulkAction })
        .in('id', selectedReportIds);

      if (error) throw error;

      toast({
        title: "Bulk update successful",
        description: `Updated ${selectedReportIds.length} reports to ${bulkAction}`,
      });

      setSelectedReportIds([]);
      setBulkAction("");
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error updating reports",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkCleanerAssignment = async () => {
    if (!bulkCleaner || selectedReportIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('waste_reports')
        .update({ 
          assigned_to: bulkCleaner === 'unassigned' ? null : bulkCleaner,
          status: bulkCleaner === 'unassigned' ? 'pending' : 'in_progress'
        })
        .in('id', selectedReportIds);

      if (error) throw error;

      toast({
        title: "Bulk assignment successful",
        description: `Assigned ${selectedReportIds.length} reports`,
      });

      setSelectedReportIds([]);
      setBulkCleaner("");
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error assigning cleaner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Analytics calculations
  const analyticsData = useMemo(() => {
    // Reports over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const reportsOverTime = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: reports.filter(r => r.created_at.split('T')[0] === date).length
    }));

    // Status breakdown
    const statusBreakdown = [
      { name: 'Pending', value: reports.filter(r => r.status === 'pending').length, color: '#eab308' },
      { name: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, color: '#3b82f6' },
      { name: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, color: '#22c55e' },
      { name: 'Rejected', value: reports.filter(r => r.status === 'rejected').length, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Waste type distribution
    const wasteTypes = reports.reduce((acc, report) => {
      const type = report.waste_type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const wasteTypeData = Object.entries(wasteTypes).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));

    // Average resolution time
    const resolvedReports = reports.filter(r => r.status === 'resolved');
    const avgResolutionTime = resolvedReports.length > 0
      ? resolvedReports.reduce((acc, report) => {
          const created = new Date(report.created_at).getTime();
          const updated = new Date(report.created_at).getTime(); // Assuming updated_at would be used
          return acc + (updated - created);
        }, 0) / resolvedReports.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      reportsOverTime,
      statusBreakdown,
      wasteTypeData,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      totalResolved: resolvedReports.length,
      resolutionRate: reports.length > 0 ? Math.round((resolvedReports.length / reports.length) * 100) : 0
    };
  }, [reports]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = [
    { label: "Total Reports", value: reports.length, icon: ClipboardList },
    { label: "Pending", value: reports.filter(r => r.status === 'pending').length, icon: RefreshCw },
    { label: "Active Cleaners", value: cleaners.length, icon: UserCheck },
    { label: "Total Users", value: users.length, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary border-b border-border/50 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="text-white">
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="bg-white rounded-full p-2">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-white">Admin Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className="bg-gradient-card rounded-xl p-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            <TabsTrigger value="reports">Waste Reports</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-foreground">{analyticsData.resolutionRate}%</div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {analyticsData.totalResolved} of {reports.length} reports resolved
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-foreground">{analyticsData.avgResolutionTime}</div>
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">days per report</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-foreground">
                      {reports.filter(r => r.status === 'pending' || r.status === 'in_progress').length}
                    </div>
                    <ClipboardList className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">pending or in progress</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports Over Time */}
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Reports Over Time</CardTitle>
                  <CardDescription>Last 7 days activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.reportsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Reports" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                  <CardDescription>Current report statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Waste Type Distribution */}
              <Card className="shadow-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle>Waste Type Distribution</CardTitle>
                  <CardDescription>Reports by waste category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.wasteTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#22c55e" name="Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Waste Reports Map
                </CardTitle>
                <CardDescription>View all waste report locations on an interactive map</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Map Legend */}
                <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Status Legend:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#ef4444] border-2 border-white shadow"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#eab308] border-2 border-white shadow"></div>
                    <span className="text-sm">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#22c55e] border-2 border-white shadow"></div>
                    <span className="text-sm">Resolved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#3b82f6] border-2 border-white shadow"></div>
                    <span className="text-sm">Rejected</span>
                  </div>
                </div>

                {/* Map Filters */}
                <div className="flex flex-wrap gap-4">
                  <Select value={mapFilterStatus} onValueChange={setMapFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={mapFilterSeverity} onValueChange={setMapFilterSeverity}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={mapFilterType} onValueChange={setMapFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="paper">Paper</SelectItem>
                      <SelectItem value="food">Food Waste</SelectItem>
                      <SelectItem value="hazardous">Hazardous</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {(mapFilterStatus !== "all" || mapFilterSeverity !== "all" || mapFilterType !== "all") && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setMapFilterStatus("all");
                        setMapFilterSeverity("all");
                        setMapFilterType("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}

                  <div className="ml-auto text-sm text-muted-foreground flex items-center">
                    Showing {mapFilteredReports.length} of {reports.length} reports
                  </div>
                </div>

                <WasteReportsMap 
                  reports={mapFilteredReports} 
                  onReportClick={handleViewReport}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Waste Reports Management</CardTitle>
                    <CardDescription>View and manage all waste reports</CardDescription>
                  </div>
                  <Button onClick={fetchReports} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Bulk Actions Bar */}
                {selectedReportIds.length > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-sm font-medium">
                        {selectedReportIds.length} report{selectedReportIds.length > 1 ? 's' : ''} selected
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Select value={bulkAction} onValueChange={setBulkAction}>
                          <SelectTrigger className="w-[150px] bg-background">
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleBulkStatusUpdate}
                          disabled={!bulkAction}
                          size="sm"
                        >
                          Update Status
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select value={bulkCleaner} onValueChange={setBulkCleaner}>
                          <SelectTrigger className="w-[150px] bg-background">
                            <SelectValue placeholder="Assign cleaner" />
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {cleaners.map((cleaner) => (
                              <SelectItem key={cleaner.id} value={cleaner.id}>
                                {cleaner.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleBulkCleanerAssignment}
                          disabled={!bulkCleaner}
                          size="sm"
                        >
                          Assign
                        </Button>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReportIds([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="paper">Paper</SelectItem>
                      <SelectItem value="food">Food Waste</SelectItem>
                      <SelectItem value="hazardous">Hazardous</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reports Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedReportIds.length === filteredReports.length && filteredReports.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No reports found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredReports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedReportIds.includes(report.id)}
                                onCheckedChange={() => handleSelectReport(report.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {new Date(report.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getUserName(report.user_id)}</TableCell>
                            <TableCell className="capitalize">{report.waste_type}</TableCell>
                            <TableCell>{getSeverityBadge(report.severity)}</TableCell>
                            <TableCell>{getStatusBadge(report.status)}</TableCell>
                            <TableCell>
                              <Select
                                value={report.assigned_to || 'unassigned'}
                                onValueChange={(value) => handleAssignCleaner(report.id, value)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {cleaners.map((cleaner) => (
                                    <SelectItem key={cleaner.id} value={cleaner.id}>
                                      {cleaner.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
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
                                  <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setReportToDelete(report.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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

          <TabsContent value="users" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Change Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className="capitalize">{getUserRole(user.id)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={getUserRole(user.id)}
                              onValueChange={(value) => handleRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="cleaner">Cleaner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Details Dialog */}
        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Waste Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about this waste report
              </DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4">
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <img
                    src={selectedReport.image_url}
                    alt="Waste report"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                    <p className="text-base font-semibold">{getUserName(selectedReport.user_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="text-base font-semibold">
                      {new Date(selectedReport.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Waste Type</p>
                    <p className="text-base font-semibold capitalize">{selectedReport.waste_type}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                    <p className="text-base font-semibold">
                      {selectedReport.assigned_to 
                        ? cleaners.find(c => c.id === selectedReport.assigned_to)?.full_name || 'Unknown'
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                  <p className="text-base">{selectedReport.location_address || 'No address provided'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Coordinates: {selectedReport.location_lat}, {selectedReport.location_lng}
                  </p>
                </div>
                {selectedReport.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                    <p className="text-base">{selectedReport.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the waste report
                and remove it from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteReport} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
