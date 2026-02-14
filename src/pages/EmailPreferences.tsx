import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Scan } from "lucide-react";

export default function EmailPreferences() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [monthlyEnabled, setMonthlyEnabled] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWeeklyEnabled(data.weekly_enabled);
        setMonthlyEnabled(data.monthly_enabled);
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      toast({
        title: "Error",
        description: "Failed to load email preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          weekly_enabled: weeklyEnabled,
          monthly_enabled: monthlyEnabled,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email preferences updated successfully",
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save email preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!user) return;

    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke("send-report-summary", {
        body: { test: true, userId: user.id },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test summary email",
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 neon-border rounded-xl flex items-center justify-center mx-auto mb-4">
            <Scan className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-9 w-9 mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-primary rounded-xl p-2 shadow-button">
              <Mail className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-display font-bold text-foreground leading-tight">Email Preferences</span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Notification Settings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl pt-24 pb-8 px-4">
        <Card className="neon-border shadow-card bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="neon-border rounded-xl p-2.5 bg-primary/5">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display">Email Notifications</CardTitle>
                <CardDescription className="text-xs font-mono tracking-wider">
                  Manage your notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4 p-4 neon-border rounded-xl bg-card/50">
                <div className="space-y-1">
                  <Label htmlFor="weekly" className="text-sm font-display font-medium">
                    Weekly Summary
                  </Label>
                  <p className="text-xs font-mono text-muted-foreground">
                    Receive a summary every Monday
                  </p>
                </div>
                <Switch
                  id="weekly"
                  checked={weeklyEnabled}
                  onCheckedChange={setWeeklyEnabled}
                />
              </div>

              <div className="flex items-center justify-between space-x-4 p-4 neon-border rounded-xl bg-card/50">
                <div className="space-y-1">
                  <Label htmlFor="monthly" className="text-sm font-display font-medium">
                    Monthly Summary
                  </Label>
                  <p className="text-xs font-mono text-muted-foreground">
                    Receive a monthly report on the 1st
                  </p>
                </div>
                <Switch
                  id="monthly"
                  checked={monthlyEnabled}
                  onCheckedChange={setMonthlyEnabled}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-3">
              <Button
                onClick={savePreferences}
                disabled={saving}
                className="w-full shadow-button font-semibold"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
              <Button
                onClick={sendTestEmail}
                disabled={sendingTest}
                variant="outline"
                className="w-full neon-border font-mono text-xs tracking-wider"
              >
                {sendingTest ? "Sending..." : "Send Test Email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
