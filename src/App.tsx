import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import PageErrorBoundary from "@/components/PageErrorBoundary";
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
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <PageErrorBoundary pageName="Dashboard">
                  <Dashboard />
                </PageErrorBoundary>
              } />
              <Route path="/report" element={
                <PageErrorBoundary pageName="Report Waste">
                  <ReportWaste />
                </PageErrorBoundary>
              } />
              <Route path="/report/:reportId" element={
                <PageErrorBoundary pageName="Report Tracking">
                  <ReportTracking />
                </PageErrorBoundary>
              } />
              <Route path="/admin" element={
                <PageErrorBoundary pageName="Admin Dashboard">
                  <AdminDashboard />
                </PageErrorBoundary>
              } />
              <Route path="/cleaner" element={
                <PageErrorBoundary pageName="Cleaner Dashboard">
                  <CleanerDashboard />
                </PageErrorBoundary>
              } />
              <Route path="/performance" element={
                <PageErrorBoundary pageName="Performance Dashboard">
                  <PerformanceDashboard />
                </PageErrorBoundary>
              } />
              <Route path="/preferences" element={
                <PageErrorBoundary pageName="Email Preferences">
                  <EmailPreferences />
                </PageErrorBoundary>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
