import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportSummary {
  userId: string;
  email: string;
  fullName: string;
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  recentReports: Array<{
    wasteType: string;
    status: string;
    createdAt: string;
    locationAddress: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frequency } = await req.json();
    
    if (!frequency || (frequency !== "weekly" && frequency !== "monthly")) {
      throw new Error("Invalid frequency. Must be 'weekly' or 'monthly'");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Fetching all user profiles for ${frequency} summaries...`);

    // Get all user profiles with email and preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        email_preferences:email_preferences(weekly_enabled, monthly_enabled)
      `);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles`);

    const summaries: ReportSummary[] = [];

    // For each user, get their report summary
    for (const profile of profiles || []) {
      // Check if user has opted in for this frequency
      const prefs = profile.email_preferences?.[0];
      const shouldSend = frequency === "weekly" 
        ? prefs?.weekly_enabled !== false 
        : prefs?.monthly_enabled !== false;

      if (!shouldSend) {
        console.log(`Skipping ${profile.email} - opted out of ${frequency} summaries`);
        continue;
      }
      const { data: reports, error: reportsError } = await supabase
        .from("waste_reports")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      if (reportsError) {
        console.error(`Error fetching reports for user ${profile.id}:`, reportsError);
        continue;
      }

      // Only send email if user has reports
      if (reports && reports.length > 0) {
        const totalReports = reports.length;
        const pendingReports = reports.filter(r => r.status === "pending").length;
        const inProgressReports = reports.filter(r => r.status === "in_progress").length;
        const resolvedReports = reports.filter(r => r.status === "resolved").length;

        // Get 5 most recent reports
        const recentReports = reports.slice(0, 5).map(r => ({
          wasteType: r.waste_type || "General Waste",
          status: r.status,
          createdAt: r.created_at,
          locationAddress: r.location_address || "Location not specified",
        }));

        summaries.push({
          userId: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          totalReports,
          pendingReports,
          inProgressReports,
          resolvedReports,
          recentReports,
        });
      }
    }

    console.log(`Sending emails to ${summaries.length} users with reports`);

    // Send emails to all users with reports
    const emailPromises = summaries.map(async (summary) => {
      const emailHtml = generateEmailHtml(summary);

      try {
        const emailResponse = await resend.emails.send({
          from: "CleanFUTA <onboarding@resend.dev>",
          to: [summary.email],
          subject: "Your CleanFUTA Report Summary",
          html: emailHtml,
        });

        console.log(`Email sent to ${summary.email}:`, emailResponse);
        return { success: true, email: summary.email };
      } catch (error) {
        console.error(`Failed to send email to ${summary.email}:`, error);
        return { success: false, email: summary.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email summary: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent: successCount,
        emailsFailed: failureCount,
        totalUsers: summaries.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-report-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateEmailHtml(summary: ReportSummary): string {
  const statusColors = {
    pending: "#eab308",
    in_progress: "#3b82f6",
    resolved: "#22c55e",
  };

  const recentReportsHtml = summary.recentReports
    .map(
      (report) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px;">
            <strong>${report.wasteType}</strong>
          </td>
          <td style="padding: 12px 8px;">
            <span style="background-color: ${statusColors[report.status as keyof typeof statusColors]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${report.status === "in_progress" ? "In Progress" : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </span>
          </td>
          <td style="padding: 12px 8px; font-size: 14px; color: #6b7280;">
            ${new Date(report.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your CleanFUTA Report Summary</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center;">
            <div style="background-color: white; border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">🌿</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CleanFUTA</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 16px;">Your Report Summary</p>
          </div>

          <!-- Content -->
          <div style="padding: 32px 24px;">
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Hello, ${summary.fullName}!</h2>
            <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px;">
              Here's a summary of your waste reporting activity on CleanFUTA.
            </p>

            <!-- Stats Cards -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 32px;">
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e5e7eb;">
                <div style="font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 4px;">
                  ${summary.totalReports}
                </div>
                <div style="font-size: 14px; color: #6b7280;">Total Reports</div>
              </div>
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #fbbf24;">
                <div style="font-size: 32px; font-weight: bold; color: #eab308; margin-bottom: 4px;">
                  ${summary.pendingReports}
                </div>
                <div style="font-size: 14px; color: #92400e;">Pending</div>
              </div>
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #3b82f6;">
                <div style="font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 4px;">
                  ${summary.inProgressReports}
                </div>
                <div style="font-size: 14px; color: #1e3a8a;">In Progress</div>
              </div>
              <div style="background-color: #dcfce7; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #22c55e;">
                <div style="font-size: 32px; font-weight: bold; color: #22c55e; margin-bottom: 4px;">
                  ${summary.resolvedReports}
                </div>
                <div style="font-size: 14px; color: #14532d;">Resolved</div>
              </div>
            </div>

            <!-- Recent Reports -->
            <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Recent Reports</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
              <thead>
                <tr style="background-color: #e5e7eb;">
                  <th style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Waste Type</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Status</th>
                  <th style="padding: 12px 8px; text-align: left; font-size: 14px; font-weight: 600; color: #374151;">Date</th>
                </tr>
              </thead>
              <tbody>
                ${recentReportsHtml}
              </tbody>
            </table>

            <!-- Call to Action -->
            <div style="margin-top: 32px; text-align: center;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace("/rest/v1", "") || "https://cleanfuta.com"}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                View Full Dashboard
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Thank you for contributing to a cleaner environment! 🌍
            </p>
            <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
              CleanFUTA - Making our campus cleaner, one report at a time.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
