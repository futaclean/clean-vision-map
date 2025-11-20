import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, MapPin, BarChart3, FileText, Menu, Leaf, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
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

  const stats = [
    { label: "Reports Submitted", value: "0", icon: FileText, color: "text-blue-600" },
    { label: "Pending Review", value: "0", icon: Clock, color: "text-yellow-600" },
    { label: "Resolved Issues", value: "0", icon: CheckCircle2, color: "text-green-600" },
    { label: "Total Impact", value: "0kg", icon: Leaf, color: "text-primary" },
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
              <Link to="/admin" className="text-white/80 hover:text-white font-medium">
                Admin
              </Link>
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
          {stats.map((stat, index) => (
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
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No reports yet</p>
              <p className="text-sm mb-4">Start by reporting waste in your area</p>
              <Button asChild className="bg-gradient-primary hover:opacity-90">
                <Link to="/report">Create First Report</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
