import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";

export default function EmailPreferences() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Manage your email notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="weekly" className="text-base font-medium">
                    Weekly Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a summary of your waste reports every Monday
                  </p>
                </div>
                <Switch
                  id="weekly"
                  checked={weeklyEnabled}
                  onCheckedChange={setWeeklyEnabled}
                />
              </div>

              <div className="flex items-center justify-between space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="monthly" className="text-base font-medium">
                    Monthly Summary
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a monthly report summary on the first of each month
                  </p>
                </div>
                <Switch
                  id="monthly"
                  checked={monthlyEnabled}
                  onCheckedChange={setMonthlyEnabled}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={savePreferences}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
