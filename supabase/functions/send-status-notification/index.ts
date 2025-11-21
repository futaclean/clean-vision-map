import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  reportId: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, status }: NotificationRequest = await req.json();
    console.log(`Processing notification for report ${reportId} with status ${status}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch report details
    const { data: report, error: reportError } = await supabase
      .from("waste_reports")
      .select(`
        *,
        user:profiles!waste_reports_user_id_fkey(full_name, email),
        cleaner:profiles!waste_reports_assigned_to_fkey(full_name, email)
      `)
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      console.error("Error fetching report:", reportError);
      throw new Error("Report not found");
    }

    // Send email to user when report is resolved
    if (status === "resolved" && report.user?.email) {
      const userEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "CleanFuta <onboarding@resend.dev>",
          to: [report.user.email],
          subject: "Your Waste Report Has Been Resolved!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10b981;">Report Resolved ✓</h1>
              <p>Hi ${report.user.full_name},</p>
              <p>Great news! Your waste report has been successfully resolved.</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Report Details:</h3>
                <p><strong>Location:</strong> ${report.location_address || "Location provided"}</p>
                <p><strong>Type:</strong> ${report.waste_type}</p>
                <p><strong>Severity:</strong> ${report.severity}</p>
                <p><strong>Reported on:</strong> ${new Date(report.created_at).toLocaleDateString()}</p>
                ${report.cleaner?.full_name ? `<p><strong>Resolved by:</strong> ${report.cleaner.full_name}</p>` : ""}
              </div>

              <p>Thank you for helping keep our community clean!</p>
              <p>Best regards,<br>The CleanFuta Team</p>
            </div>
          `,
        }),
      });

      if (!userEmailResponse.ok) {
        console.error("Failed to send user email:", await userEmailResponse.text());
      } else {
        console.log("User notification email sent:", await userEmailResponse.json());
      }
    }

    // Send thank you email to cleaner when they complete a report
    if (status === "resolved" && report.cleaner?.email) {
      const cleanerEmailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "CleanFuta <onboarding@resend.dev>",
          to: [report.cleaner.email],
          subject: "Great Job! Report Completed",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10b981;">Excellent Work! 🎉</h1>
              <p>Hi ${report.cleaner.full_name},</p>
              <p>Thank you for completing the waste cleanup task!</p>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Completed Task:</h3>
                <p><strong>Location:</strong> ${report.location_address || "Location provided"}</p>
                <p><strong>Type:</strong> ${report.waste_type}</p>
                <p><strong>Severity:</strong> ${report.severity}</p>
                <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <p>Your dedication to keeping our community clean is greatly appreciated!</p>
              <p>Best regards,<br>The CleanFuta Team</p>
            </div>
          `,
        }),
      });

      if (!cleanerEmailResponse.ok) {
        console.error("Failed to send cleaner email:", await cleanerEmailResponse.text());
      } else {
        console.log("Cleaner notification email sent:", await cleanerEmailResponse.json());
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
