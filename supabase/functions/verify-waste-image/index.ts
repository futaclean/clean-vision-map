import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Verifying waste image:", imageUrl);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a waste detection AI. Your job is to analyze images and determine if they contain waste, garbage, litter, or environmental pollution that should be reported for cleanup.

VALID waste includes:
- Garbage, trash, litter
- Plastic waste, bottles, cans
- Paper waste, cardboard
- Food waste, organic waste
- Construction debris
- Electronic waste
- Medical waste
- Hazardous materials
- Overflowing bins
- Illegal dumping

INVALID images (reject these):
- Selfies or photos of people
- Landscape photos without waste
- Screenshots or memes
- Blurry or unrecognizable images
- Clean areas with no visible waste
- Photos of buildings/structures without waste
- Random objects that are not waste

Respond with a JSON object containing:
- "isWaste": boolean (true if the image shows waste that should be reported)
- "confidence": number (0-100)
- "reason": string (brief explanation)

Be strict but fair. If there's visible waste in the image, accept it.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and determine if it shows waste that should be reported for cleanup. Respond with JSON only."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            verified: true,
            reason: "Rate limited - accepting image",
            confidence: 50
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            verified: true,
            reason: "Credits exhausted - accepting image",
            confidence: 50
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      // On error, accept the image to not block users
      return new Response(
        JSON.stringify({ 
          verified: true,
          reason: "Verification service unavailable - accepting image",
          confidence: 50
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    // Parse the JSON response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, try to interpret the text response
        const isWaste = content.toLowerCase().includes("true") || 
                        content.toLowerCase().includes("waste") ||
                        content.toLowerCase().includes("garbage");
        result = {
          isWaste,
          confidence: 70,
          reason: isWaste ? "Waste detected in image" : "No waste detected"
        };
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Default to accepting if we can't parse
      result = {
        isWaste: true,
        confidence: 60,
        reason: "Unable to verify - accepting image"
      };
    }

    return new Response(
      JSON.stringify({
        verified: result.isWaste === true,
        confidence: result.confidence || 50,
        reason: result.reason || (result.isWaste ? "Waste verified" : "No waste detected in image")
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error verifying waste image:", error);
    // On any error, accept the image to not block users
    return new Response(
      JSON.stringify({ 
        verified: true,
        reason: "Verification error - accepting image",
        confidence: 50
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
