import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Clock, MapPin, Award, Target, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

interface CleanerMetrics {
  cleaner_id: string;
  cleaner_name: string;
  total_assigned: number;
  total_completed: number;
  total_in_progress: number;
  completion_rate: number;
  avg_response_time: number;
  efficiency_score: number;
}

interface TrendData {
  date: string;
  completed: number;
  avgResponseTime: number;
}

const COLORS = ['hsl(142 76% 36%)', 'hsl(142 65% 45%)', 'hsl(142 50% 50%)', 'hsl(142 35% 60%)', 'hsl(142 20% 70%)'];

export default function PerformanceDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cleanerMetrics, setCleanerMetrics] = useState<CleanerMetrics[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dateRange, setDateRange] = useState("7");
  const [sortBy, setSortBy] = useState<"completion_rate" | "efficiency_score" | "avg_response_time">("efficiency_score");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchPerformanceData();
    }
  }, [dateRange]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    setLoading(false);
    fetchPerformanceData();
  };

  const fetchPerformanceData = async () => {
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch cleaners
      const { data: cleaners, error: cleanersError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", 
          (await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", "cleaner")
          ).data?.map(r => r.user_id) || []
        );

      if (cleanersError) throw cleanersError;

      // Fetch reports for metrics calculation
      const { data: reports, error: reportsError } = await supabase
        .from("waste_reports")
        .select("*")
        .gte("created_at", startDate.toISOString());

      if (reportsError) throw reportsError;

      // Calculate metrics for each cleaner
      const metrics: CleanerMetrics[] = (cleaners || []).map(cleaner => {
        const cleanerReports = reports?.filter(r => r.assigned_to === cleaner.id) || [];
        const completed = cleanerReports.filter(r => r.status === "resolved").length;
        const inProgress = cleanerReports.filter(r => r.status === "in_progress").length;
        const total = cleanerReports.length;

        // Calculate average response time (time from created to first status change)
        const responseTimes = cleanerReports
          .filter(r => r.updated_at && r.created_at && r.updated_at !== r.created_at)
          .map(r => {
            const created = new Date(r.created_at!).getTime();
            const updated = new Date(r.updated_at!).getTime();
            return (updated - created) / (1000 * 60 * 60); // hours
          });

        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;

        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        
        // Efficiency score: weighted combination of completion rate and speed
        const speedScore = avgResponseTime > 0 ? Math.max(0, 100 - (avgResponseTime * 2)) : 0;
        const efficiencyScore = (completionRate * 0.6 + speedScore * 0.4);

        return {
          cleaner_id: cleaner.id,
          cleaner_name: cleaner.full_name,
          total_assigned: total,
          total_completed: completed,
          total_in_progress: inProgress,
          completion_rate: completionRate,
          avg_response_time: avgResponseTime,
          efficiency_score: efficiencyScore
        };
      });

      setCleanerMetrics(metrics.sort((a, b) => b[sortBy] - a[sortBy]));

      // Calculate trend data
      const days = Array.from({ length: daysAgo }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (daysAgo - 1 - i));
        return date.toISOString().split('T')[0];
      });

      const trends: TrendData[] = days.map(day => {
        const dayReports = reports?.filter(r => 
          r.created_at?.startsWith(day)
        ) || [];
        
        const completed = dayReports.filter(r => r.status === "resolved").length;
        
        const dayResponseTimes = dayReports
          .filter(r => r.updated_at && r.created_at && r.updated_at !== r.created_at)
          .map(r => {
            const created = new Date(r.created_at!).getTime();
            const updated = new Date(r.updated_at!).getTime();
            return (updated - created) / (1000 * 60 * 60);
          });

        const avgResponseTime = dayResponseTimes.length > 0
          ? dayResponseTimes.reduce((a, b) => a + b, 0) / dayResponseTimes.length
          : 0;

        return {
          date: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          completed,
          avgResponseTime: parseFloat(avgResponseTime.toFixed(1))
        };
      });

      setTrendData(trends);

    } catch (error) {
      console.error("Error fetching performance data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch performance data",
        variant: "destructive"
      });
    }
  };

  const topPerformers = cleanerMetrics.slice(0, 5);
  const totalCompleted = cleanerMetrics.reduce((sum, m) => sum + m.total_completed, 0);
  const avgCompletionRate = cleanerMetrics.length > 0
    ? cleanerMetrics.reduce((sum, m) => sum + m.completion_rate, 0) / cleanerMetrics.length
    : 0;
  const avgResponseTime = cleanerMetrics.length > 0
    ? cleanerMetrics.reduce((sum, m) => sum + m.avg_response_time, 0) / cleanerMetrics.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
              <p className="text-muted-foreground mt-1">Track cleaner metrics and team performance</p>
            </div>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalCompleted}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all cleaners
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{avgCompletionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Team average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{avgResponseTime.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                From assignment to action
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{cleanerMetrics.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                With assignments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Leaderboards */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Trend</CardTitle>
                  <CardDescription>Daily completed reports over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Completed Reports"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time Trend</CardTitle>
                  <CardDescription>Average response time in hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgResponseTime" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Avg Response Time (h)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efficiency_score">Efficiency Score</SelectItem>
                  <SelectItem value="completion_rate">Completion Rate</SelectItem>
                  <SelectItem value="avg_response_time">Response Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Leaderboard Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topPerformers.map((cleaner, index) => (
                      <div key={cleaner.cleaner_id} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{cleaner.cleaner_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sortBy === "efficiency_score" && `Score: ${cleaner.efficiency_score.toFixed(1)}`}
                            {sortBy === "completion_rate" && `Rate: ${cleaner.completion_rate.toFixed(1)}%`}
                            {sortBy === "avg_response_time" && `Time: ${cleaner.avg_response_time.toFixed(1)}h`}
                          </p>
                        </div>
                        {index === 0 && <Badge className="bg-gradient-primary">🏆 Top</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detailed Metrics</CardTitle>
                  <CardDescription>Performance breakdown by cleaner</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPerformers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="cleaner_name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="efficiency_score" fill="hsl(var(--primary))" name="Efficiency Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Cleaners Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Rank</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cleaner</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Assigned</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Completed</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Time</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleanerMetrics.map((cleaner, index) => (
                        <tr key={cleaner.cleaner_id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm text-foreground">{index + 1}</td>
                          <td className="py-3 px-4 text-sm font-medium text-foreground">{cleaner.cleaner_name}</td>
                          <td className="py-3 px-4 text-sm text-center text-foreground">{cleaner.total_assigned}</td>
                          <td className="py-3 px-4 text-sm text-center text-foreground">{cleaner.total_completed}</td>
                          <td className="py-3 px-4 text-sm text-center">
                            <Badge variant={cleaner.completion_rate >= 80 ? "default" : "secondary"}>
                              {cleaner.completion_rate.toFixed(1)}%
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-center text-foreground">
                            {cleaner.avg_response_time.toFixed(1)}h
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Zap className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-foreground">{cleaner.efficiency_score.toFixed(1)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Work Distribution</CardTitle>
                  <CardDescription>Total assignments per cleaner</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={topPerformers}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.cleaner_name}: ${entry.total_assigned}`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="total_assigned"
                      >
                        {topPerformers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Completion Rates Comparison</CardTitle>
                  <CardDescription>Percentage of completed vs assigned</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topPerformers}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="cleaner_name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "var(--radius)"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="completion_rate" fill="hsl(var(--accent))" name="Completion Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
