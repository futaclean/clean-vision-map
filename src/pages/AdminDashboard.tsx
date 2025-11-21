import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
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
import { ArrowLeft, Leaf, RefreshCw, Users, ClipboardList, UserCheck, Eye, Trash2, BarChart3, TrendingUp, Map, CheckSquare, Square, Download, CalendarIcon, Search, Save, X, Upload } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
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
  
  // Advanced filters
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [savedFilters, setSavedFilters] = useState<any[]>([]);
  const [filterName, setFilterName] = useState<string>("");
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  
  // Cleaner search
  const [cleanerSearch, setCleanerSearch] = useState<string>("");
  
  // Create cleaner dialog
  const [createCleanerOpen, setCreateCleanerOpen] = useState(false);
  const [newCleanerEmail, setNewCleanerEmail] = useState("");
  const [newCleanerName, setNewCleanerName] = useState("");
  const [newCleanerPassword, setNewCleanerPassword] = useState("");
  
  // Bulk import state
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('waste-report-filters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved filters:', e);
      }
    }
  }, []);

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
        await fetchAllData();
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

  // Optimized: Fetch all data in parallel with fewer queries
  const fetchAllData = async () => {
    try {
      const [reportsData, profilesData, rolesData] = await Promise.all([
        supabase.from('waste_reports').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role')
      ]);

      if (reportsData.error) throw reportsData.error;
      if (profilesData.error) throw profilesData.error;
      if (rolesData.error) throw rolesData.error;

      setReports(reportsData.data || []);
      setUsers(profilesData.data || []);
      setUserRoles(rolesData.data || []);
      
      // Filter cleaners from the roles data
      const cleanerIds = rolesData.data?.filter(r => r.role === 'cleaner').map(r => r.user_id) || [];
      const cleanerProfiles = profilesData.data?.filter(p => cleanerIds.includes(p.id)) || [];
      setCleaners(cleanerProfiles);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
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

  const handleAssignCleaner = async (reportId: string, cleanerId: string) => {
    // Find the current report to get the previous assignment
    const report = reports.find(r => r.id === reportId);
    const previousCleanerId = report?.assigned_to;
    const isReassignment = previousCleanerId && cleanerId !== 'unassigned' && previousCleanerId !== cleanerId;
    
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
        title: isReassignment ? "Report Reassigned" : "Cleaner assigned",
        description: isReassignment 
          ? "Report has been reassigned to a new cleaner" 
          : "Report updated successfully",
      });

      try {
        // Notify previous cleaner if this is a reassignment
        if (isReassignment && previousCleanerId) {
          const newCleaner = cleaners.find(c => c.id === cleanerId);
          await supabase.from('notifications').insert({
            user_id: previousCleanerId,
            title: 'Report Reassigned',
            message: `The report at ${report?.location_address || 'a location'} has been reassigned to ${newCleaner?.full_name || 'another cleaner'}`,
            type: 'warning',
            related_report_id: reportId
          });
        }

        // Send notification to new cleaner if assigned (not unassigned)
        if (cleanerId !== 'unassigned') {
          // Create in-app notification
          await supabase.from('notifications').insert({
            user_id: cleanerId,
            title: isReassignment ? 'New Report Reassigned to You' : 'New Report Assigned',
            message: `You have been ${isReassignment ? 'reassigned' : 'assigned'} to a waste report at ${report?.location_address || 'a location'}`,
            type: 'info',
            related_report_id: reportId
          });

          // Send email notification
          const { error: notificationError } = await supabase.functions.invoke(
            'send-cleaner-notification',
            {
              body: { reportId, cleanerId }
            }
          );

          if (notificationError) {
            console.error('Notification error:', notificationError);
          }
        }
      } catch (err) {
        console.error('Error sending notification:', err);
      }

      fetchReports();
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    const report = reports.find(r => r.id === reportId);
    
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

      // Send notification to report submitter
      if (report && ['in_progress', 'resolved', 'rejected'].includes(newStatus)) {
        const notificationMessages: Record<string, { title: string; message: string; type: 'info' | 'success' | 'warning' }> = {
          in_progress: {
            title: 'Report In Progress',
            message: 'A cleaner has started working on your waste report',
            type: 'info'
          },
          resolved: {
            title: 'Report Resolved',
            message: 'Your waste report has been successfully resolved!',
            type: 'success'
          },
          rejected: {
            title: 'Report Rejected',
            message: 'Your waste report has been rejected',
            type: 'warning'
          }
        };

        const notification = notificationMessages[newStatus];
        if (notification) {
          await supabase.from('notifications').insert({
            user_id: report.user_id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            related_report_id: reportId
          });

          // Send email notification if resolved
          if (newStatus === 'resolved') {
            supabase.functions.invoke("send-status-notification", {
              body: { reportId, status: newStatus },
            }).catch(err => console.error("Email notification error:", err));
          }
        }
      }

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
      await fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCleaner = async () => {
    if (!newCleanerEmail || !newCleanerName || !newCleanerPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call edge function to create cleaner with proper permissions
      // The Supabase client automatically includes the authorization header
      const { data, error } = await supabase.functions.invoke('create-cleaner', {
        body: {
          email: newCleanerEmail,
          password: newCleanerPassword,
          full_name: newCleanerName
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Close dialog and reset form
      setCreateCleanerOpen(false);
      setNewCleanerEmail("");
      setNewCleanerName("");
      setNewCleanerPassword("");

      // Wait a moment for database to update, then refresh
      setTimeout(async () => {
        await fetchAllData();
        toast({
          title: "Cleaner created",
          description: `${newCleanerName} has been added as a cleaner`,
        });
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error creating cleaner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      
      // Skip header row and filter empty rows
      const dataRows = rows.slice(1).filter(row => row.length >= 3 && row[0]);

      if (dataRows.length === 0) {
        toast({
          title: "No data found",
          description: "CSV file appears to be empty or incorrectly formatted",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const row of dataRows) {
        const [name, email, password] = row;

        // Validate row data
        if (!name || !email || !password) {
          errors.push(`Row skipped: Missing required fields (${email || 'no email'})`);
          failedCount++;
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`${email}: Invalid email format`);
          failedCount++;
          continue;
        }

        // Validate password length
        if (password.length < 6) {
          errors.push(`${email}: Password must be at least 6 characters`);
          failedCount++;
          continue;
        }

        try {
          // Create user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: name }
            }
          });

          if (authError) {
            errors.push(`${email}: ${authError.message}`);
            failedCount++;
            continue;
          }

          if (authData.user) {
            // Assign cleaner role
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([{ user_id: authData.user.id, role: 'cleaner' }]);

            if (roleError) {
              errors.push(`${email}: Failed to assign role - ${roleError.message}`);
              failedCount++;
              continue;
            }

            successCount++;
          }
        } catch (err: any) {
          errors.push(`${email}: ${err.message}`);
          failedCount++;
        }
      }

      setImportResults({ success: successCount, failed: failedCount, errors });
      
      if (successCount > 0) {
        await fetchAllData();
        toast({
          title: "Import completed",
          description: `Successfully created ${successCount} cleaner(s)`,
        });
      }

      setBulkImportOpen(true);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const exportCleanersToCSV = () => {
    try {
      // Create CSV content with headers
      const headers = ['Full Name', 'Email', 'Password'];
      const rows = cleaners.map(cleaner => [
        cleaner.full_name,
        cleaner.email,
        '' // Empty password field for security
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `cleaners-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${cleaners.length} cleaner(s) to CSV`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    if (filterType !== "all" && report.waste_type !== filterType) return false;
    
    // Date range filter
    if (dateFrom) {
      const reportDate = new Date(report.created_at);
      if (reportDate < dateFrom) return false;
    }
    if (dateTo) {
      const reportDate = new Date(report.created_at);
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (reportDate > endOfDay) return false;
    }
    
    // Location search
    if (locationSearch && report.location_address) {
      if (!report.location_address.toLowerCase().includes(locationSearch.toLowerCase())) {
        return false;
      }
    }
    
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

      // Send notifications for bulk assignment
      if (bulkCleaner !== 'unassigned') {
        try {
          const notificationPromises = selectedReportIds.map(reportId =>
            supabase.functions.invoke('send-cleaner-notification', {
              body: { reportId, cleanerId: bulkCleaner }
            })
          );

          await Promise.all(notificationPromises);

          toast({
            title: "Notifications sent",
            description: `Sent ${selectedReportIds.length} email notifications`,
          });
        } catch (notificationError) {
          console.error('Bulk notification error:', notificationError);
          toast({
            title: "Some notifications failed",
            description: "Reports assigned but some emails may not have been sent",
            variant: "destructive",
          });
        }
      }

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

  const exportToCSV = () => {
    const dataToExport = filteredReports.map(report => ({
      'Date': new Date(report.created_at).toLocaleDateString(),
      'Submitted By': getUserName(report.user_id),
      'Type': report.waste_type,
      'Severity': report.severity,
      'Status': report.status,
      'Location': report.location_address,
      'Description': report.description || '',
      'Latitude': report.location_lat,
      'Longitude': report.location_lng,
    }));

    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => 
        Object.values(row).map(val => 
          typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${dataToExport.length} reports to CSV`,
    });
  };

  const exportToExcel = () => {
    const dataToExport = filteredReports.map(report => ({
      'Date': new Date(report.created_at).toLocaleDateString(),
      'Submitted By': getUserName(report.user_id),
      'Type': report.waste_type,
      'Severity': report.severity,
      'Status': report.status,
      'Location': report.location_address,
      'Description': report.description || '',
      'Latitude': report.location_lat,
      'Longitude': report.location_lng,
      'Assigned To': report.assigned_to ? cleaners.find(c => c.id === report.assigned_to)?.full_name || 'Unknown' : 'Unassigned',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Waste Reports');

    // Auto-size columns
    const maxWidth = dataToExport.reduce((w, r) => {
      return Object.keys(r).map((key, i) => {
        const cellValue = String(r[key as keyof typeof r] || '');
        return Math.max(w[i] || 10, cellValue.length, key.length);
      });
    }, [] as number[]);
    worksheet['!cols'] = maxWidth.map(width => ({ width: width + 2 }));

    XLSX.writeFile(workbook, `waste-reports-${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export successful",
      description: `Exported ${dataToExport.length} reports to Excel`,
    });
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this filter preset",
        variant: "destructive",
      });
      return;
    }

    const newFilter = {
      id: Date.now().toString(),
      name: filterName,
      filterStatus,
      filterType,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      locationSearch,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('waste-report-filters', JSON.stringify(updated));
    
    toast({
      title: "Filter saved",
      description: `Filter preset "${filterName}" has been saved`,
    });

    setFilterName("");
    setShowSaveFilter(false);
  };

  const loadFilter = (filter: any) => {
    setFilterStatus(filter.filterStatus);
    setFilterType(filter.filterType);
    setDateFrom(filter.dateFrom ? new Date(filter.dateFrom) : undefined);
    setDateTo(filter.dateTo ? new Date(filter.dateTo) : undefined);
    setLocationSearch(filter.locationSearch || "");

    toast({
      title: "Filter loaded",
      description: `Applied "${filter.name}" filter preset`,
    });
  };

  const deleteFilter = (filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('waste-report-filters', JSON.stringify(updated));

    toast({
      title: "Filter deleted",
      description: "Filter preset has been removed",
    });
  };

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterType("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setLocationSearch("");
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
            <NotificationBell />
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
            <TabsTrigger value="cleaners">Cleaners</TabsTrigger>
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
                  <div className="flex gap-2">
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button onClick={exportToExcel} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                    <Button onClick={fetchReports} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
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
                          <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Select cleaner" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            <SelectItem value="unassigned">
                              <span className="text-muted-foreground">Unassigned</span>
                            </SelectItem>
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
                          className="whitespace-nowrap"
                        >
                          Assign Cleaner
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
                <div className="space-y-4 mb-6">
                  {/* Basic Filters Row */}
                  <div className="flex flex-wrap gap-4">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
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
                      <SelectContent className="bg-background">
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

                  {/* Advanced Filters Row */}
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Date From */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Date from"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Date To */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[180px] justify-start text-left font-normal",
                            !dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Date to"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Location Search */}
                    <div className="relative w-[240px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by location..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Clear All Filters */}
                    {(filterStatus !== "all" || filterType !== "all" || dateFrom || dateTo || locationSearch) && (
                      <Button variant="outline" onClick={clearAllFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  {/* Saved Filters Row */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium">Filter Presets:</span>
                    
                    {savedFilters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => loadFilter(filter)}
                        >
                          {filter.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFilter(filter.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {showSaveFilter ? (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Filter name..."
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          className="w-[150px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCurrentFilter();
                            if (e.key === 'Escape') setShowSaveFilter(false);
                          }}
                        />
                        <Button size="sm" onClick={saveCurrentFilter}>
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowSaveFilter(false)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSaveFilter(true)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Current Filter
                      </Button>
                    )}
                  </div>
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
                                  <SelectValue placeholder="Select cleaner" />
                                </SelectTrigger>
                                <SelectContent className="bg-background z-50">
                                  <SelectItem value="unassigned">
                                    <span className="text-muted-foreground">Unassigned</span>
                                  </SelectItem>
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
                                  <SelectContent className="bg-background z-50">
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

          <TabsContent value="cleaners" className="space-y-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Cleaner Performance
                    </CardTitle>
                    <CardDescription>Monitor cleaner activity and performance metrics</CardDescription>
                  </div>
                  <Button onClick={() => setCreateCleanerOpen(true)}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Create Cleaner
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cleaners.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Cleaners Yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first cleaner to get started</p>
                    <Button onClick={() => setCreateCleanerOpen(true)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Create Cleaner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search cleaners by name or email..."
                          value={cleanerSearch}
                          onChange={(e) => setCleanerSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {cleanerSearch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCleanerSearch("")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {/* Cleaner Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Cleaners</p>
                              <p className="text-3xl font-bold text-foreground">{cleaners.length}</p>
                            </div>
                            <UserCheck className="h-8 w-8 text-primary" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Active Assignments</p>
                              <p className="text-3xl font-bold text-foreground">
                                {reports.filter(r => r.assigned_to && r.status !== 'resolved').length}
                              </p>
                            </div>
                            <ClipboardList className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Resolved Today</p>
                              <p className="text-3xl font-bold text-foreground">
                                {reports.filter(r => 
                                  r.status === 'resolved' && 
                                  new Date(r.created_at).toDateString() === new Date().toDateString()
                                ).length}
                              </p>
                            </div>
                            <CheckSquare className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-card">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Completion Rate</p>
                              <p className="text-3xl font-bold text-foreground">
                                {cleaners.length > 0 
                                  ? Math.round(
                                      cleaners.reduce((acc, cleaner) => {
                                        const assignedReports = reports.filter(r => r.assigned_to === cleaner.id);
                                        const completedReports = assignedReports.filter(r => r.status === 'resolved');
                                        return acc + (assignedReports.length > 0 ? (completedReports.length / assignedReports.length) * 100 : 0);
                                      }, 0) / cleaners.length
                                    )
                                  : 0
                                }%
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Individual Cleaner Performance Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cleaner Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Assigned</TableHead>
                            <TableHead className="text-center">In Progress</TableHead>
                            <TableHead className="text-center">Completed</TableHead>
                            <TableHead className="text-center">Completion Rate</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cleaners
                            .filter((cleaner) => {
                              const searchLower = cleanerSearch.toLowerCase();
                              return (
                                cleaner.full_name.toLowerCase().includes(searchLower) ||
                                cleaner.email.toLowerCase().includes(searchLower)
                              );
                            })
                            .map((cleaner) => {
                            const assignedReports = reports.filter(r => r.assigned_to === cleaner.id);
                            const inProgressReports = assignedReports.filter(r => r.status === 'in_progress');
                            const completedReports = assignedReports.filter(r => r.status === 'resolved');
                            const completionRate = assignedReports.length > 0 
                              ? Math.round((completedReports.length / assignedReports.length) * 100)
                              : 0;

                            return (
                              <TableRow key={cleaner.id}>
                                <TableCell className="font-medium">{cleaner.full_name}</TableCell>
                                <TableCell className="text-muted-foreground">{cleaner.email}</TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{assignedReports.length}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    {inProgressReports.length}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                    {completedReports.length}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${completionRate}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-semibold">{completionRate}%</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {inProgressReports.length > 0 ? (
                                    <Badge className="bg-blue-500">Active</Badge>
                                  ) : assignedReports.length > 0 ? (
                                    <Badge variant="secondary">Assigned</Badge>
                                  ) : (
                                    <Badge variant="outline">Available</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {cleaners.filter((cleaner) => {
                        const searchLower = cleanerSearch.toLowerCase();
                        return (
                          cleaner.full_name.toLowerCase().includes(searchLower) ||
                          cleaner.email.toLowerCase().includes(searchLower)
                        );
                      }).length === 0 && cleanerSearch && (
                        <div className="text-center py-8 text-muted-foreground">
                          No cleaners found matching "{cleanerSearch}"
                        </div>
                      )}
                    </div>

                    {/* Detailed Performance Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Performers */}
                      <Card className="shadow-card border-border">
                        <CardHeader>
                          <CardTitle>Top Performers</CardTitle>
                          <CardDescription>Cleaners with highest completion rates</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {cleaners
                              .filter((cleaner) => {
                                const searchLower = cleanerSearch.toLowerCase();
                                return (
                                  cleaner.full_name.toLowerCase().includes(searchLower) ||
                                  cleaner.email.toLowerCase().includes(searchLower)
                                );
                              })
                              .map(cleaner => {
                                const assignedReports = reports.filter(r => r.assigned_to === cleaner.id);
                                const completedReports = assignedReports.filter(r => r.status === 'resolved');
                                const completionRate = assignedReports.length > 0 
                                  ? (completedReports.length / assignedReports.length) * 100
                                  : 0;
                                return { cleaner, completionRate, completedCount: completedReports.length };
                              })
                              .sort((a, b) => b.completionRate - a.completionRate)
                              .slice(0, 5)
                              .map(({ cleaner, completionRate, completedCount }, index) => (
                                <div key={cleaner.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="font-semibold">{cleaner.full_name}</p>
                                      <p className="text-xs text-muted-foreground">{completedCount} completed</p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-500">{Math.round(completionRate)}%</Badge>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Workload Distribution */}
                      <Card className="shadow-card border-border">
                        <CardHeader>
                          <CardTitle>Workload Distribution</CardTitle>
                          <CardDescription>Current assignments per cleaner</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={cleaners
                              .filter((cleaner) => {
                                const searchLower = cleanerSearch.toLowerCase();
                                return (
                                  cleaner.full_name.toLowerCase().includes(searchLower) ||
                                  cleaner.email.toLowerCase().includes(searchLower)
                                );
                              })
                              .map(cleaner => ({
                              name: cleaner.full_name.split(' ')[0],
                              assigned: reports.filter(r => r.assigned_to === cleaner.id && r.status !== 'resolved').length
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="assigned" fill="#8b5cf6" name="Active Assignments" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user roles and permissions</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={exportCleanersToCSV}
                      disabled={cleaners.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <label htmlFor="bulk-import-csv">
                      <Button variant="outline" disabled={isImporting} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isImporting ? "Importing..." : "Import CSV"}
                        </span>
                      </Button>
                      <input
                        id="bulk-import-csv"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleBulkImport}
                        disabled={isImporting}
                      />
                    </label>
                    <Button onClick={() => setCreateCleanerOpen(true)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Create Cleaner
                    </Button>
                  </div>
                </div>
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

        {/* Bulk Import Results Dialog */}
        <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Results</DialogTitle>
              <DialogDescription>
                Summary of the bulk cleaner import process
              </DialogDescription>
            </DialogHeader>
            {importResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{importResults.success}</p>
                        <p className="text-sm text-muted-foreground">Successfully Created</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                        <p className="text-sm text-muted-foreground">Failed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Errors:</h4>
                    <div className="max-h-[300px] overflow-y-auto space-y-1 bg-muted p-3 rounded-md">
                      {importResults.errors.map((error, index) => (
                        <p key={index} className="text-sm text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-muted p-4 rounded-md">
                  <h4 className="text-sm font-semibold mb-2">CSV Format:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Your CSV file should have the following columns (with header row):
                  </p>
                  <code className="text-xs block bg-background p-2 rounded">
                    Full Name,Email,Password<br />
                    John Doe,john@example.com,password123<br />
                    Jane Smith,jane@example.com,securepass456
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    • Passwords must be at least 6 characters<br />
                    • Email addresses must be valid format<br />
                    • All fields are required
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setBulkImportOpen(false)}>
                    Close
                  </Button>
                </div>
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

        {/* Create Cleaner Dialog */}
        <Dialog open={createCleanerOpen} onOpenChange={setCreateCleanerOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Cleaner</DialogTitle>
              <DialogDescription>
                Add a new cleaner account to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="cleaner-name" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="cleaner-name"
                  placeholder="Enter full name"
                  value={newCleanerName}
                  onChange={(e) => setNewCleanerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cleaner-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="cleaner-email"
                  type="email"
                  placeholder="Enter email address"
                  value={newCleanerEmail}
                  onChange={(e) => setNewCleanerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="cleaner-password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="cleaner-password"
                  type="password"
                  placeholder="Enter password"
                  value={newCleanerPassword}
                  onChange={(e) => setNewCleanerPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateCleanerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCleaner}>
                  Create Cleaner
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminDashboard;
