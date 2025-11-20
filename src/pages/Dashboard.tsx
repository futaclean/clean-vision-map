import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, BarChart3, FileText, Menu, Leaf, LogOut, Clock, CheckCircle2, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    inProgress: 0
  });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      checkUserRole();
      fetchReportStats();
      fetchRecentReports();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
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
    try {
      const { data: reports } = await supabase
        .from('waste_reports')
        .select('id, status, created_at, waste_type, location_address, severity')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reports) {
        setRecentReports(reports);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    }
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
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Your latest waste reports</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No reports yet</p>
                <p className="text-sm mb-4">Start by reporting waste in your area</p>
                <Button asChild className="bg-gradient-primary hover:opacity-90">
                  <Link to="/report">Create First Report</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
