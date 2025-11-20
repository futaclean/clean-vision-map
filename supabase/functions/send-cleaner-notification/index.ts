import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  reportId: string;
  cleanerId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, cleanerId }: NotificationRequest = await req.json();

    console.log("Processing notification for report:", reportId, "cleaner:", cleanerId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch cleaner profile
    const { data: cleanerProfile, error: cleanerError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", cleanerId)
      .single();

    if (cleanerError || !cleanerProfile) {
      console.error("Error fetching cleaner profile:", cleanerError);
      throw new Error("Cleaner not found");
    }

    // Fetch report details
    const { data: report, error: reportError } = await supabase
      .from("waste_reports")
      .select("waste_type, severity, location_address, description, created_at")
      .eq("id", reportId)
      .single();

    if (reportError || !report) {
      console.error("Error fetching report:", reportError);
      throw new Error("Report not found");
    }

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "CleanFuta <onboarding@resend.dev>",
        to: [cleanerProfile.email],
        subject: "New Waste Report Assigned to You",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">New Report Assignment</h1>
            <p>Hello ${cleanerProfile.full_name},</p>
            <p>You have been assigned a new waste report. Here are the details:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin-top: 0;">Report Details</h2>
              <p><strong>Type:</strong> ${report.waste_type || 'Not specified'}</p>
              <p><strong>Severity:</strong> <span style="text-transform: uppercase; color: ${
                report.severity === 'high' ? '#ef4444' : 
                report.severity === 'medium' ? '#eab308' : '#22c55e'
              };">${report.severity || 'medium'}</span></p>
              <p><strong>Location:</strong> ${report.location_address || 'Location not provided'}</p>
              ${report.description ? `<p><strong>Description:</strong> ${report.description}</p>` : ''}
              <p><strong>Reported:</strong> ${new Date(report.created_at).toLocaleString()}</p>
            </div>
            
            <p>Please log in to the CleanFuta dashboard to view full details and update the status.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This is an automated notification from CleanFuta. Please do not reply to this email.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData.message || emailResponse.statusText}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully",
        emailId: emailData.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-cleaner-notification function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
