import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CleanerDashboard from "./pages/CleanerDashboard";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import ReportWaste from "./pages/ReportWaste";
import ReportTracking from "./pages/ReportTracking";
import EmailPreferences from "./pages/EmailPreferences";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report" element={<ReportWaste />} />
            <Route path="/report/:reportId" element={<ReportTracking />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/cleaner" element={<CleanerDashboard />} />
            <Route path="/performance" element={<PerformanceDashboard />} />
            <Route path="/preferences" element={<EmailPreferences />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
