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

WASTE TYPE CATEGORIES (choose the best match):
- "plastic" - Plastic bottles, bags, containers, packaging
- "paper" - Paper, cardboard, newspapers, documents
- "food" - Food scraps, organic waste, leftover meals
- "hazardous" - Batteries, chemicals, electronic waste, medical waste
- "mixed" - Multiple types of waste mixed together
- "other" - Anything that doesn't fit above categories

SEVERITY LEVELS (assess based on volume, health risk, and environmental impact):
- "low" - Small amount of waste, minimal health risk, easy to clean up (e.g. a few pieces of litter, a single bottle)
- "medium" - Moderate amount of waste, some health concern, requires effort to clean (e.g. a pile of trash, overflowing bin)
- "high" - Large amount of waste, significant health/environmental hazard, urgent cleanup needed (e.g. illegal dumping, hazardous materials, large debris piles)

Respond with a JSON object containing:
- "isWaste": boolean (true if the image shows waste that should be reported)
- "confidence": number (0-100)
- "reason": string (brief explanation)
- "wasteType": string (one of: plastic, paper, food, hazardous, mixed, other)
- "wasteDescription": string (brief description of what waste was detected, e.g. "Plastic bottles and bags near a drain")
- "severity": string (one of: low, medium, high)

Be strict but fair. If there's visible waste in the image, accept it and categorize it accurately.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and determine if it shows waste that should be reported for cleanup. Identify the waste type and provide a brief description. Respond with JSON only."
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
        max_tokens: 300
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

    // Validate waste type
    const validWasteTypes = ['plastic', 'paper', 'food', 'hazardous', 'mixed', 'other'];
    const suggestedType = validWasteTypes.includes(result.wasteType) ? result.wasteType : 'mixed';

    // Validate severity
    const validSeverities = ['low', 'medium', 'high'];
    const suggestedSeverity = validSeverities.includes(result.severity) ? result.severity : 'medium';

    return new Response(
      JSON.stringify({
        verified: result.isWaste === true,
        confidence: result.confidence || 50,
        reason: result.reason || (result.isWaste ? "Waste verified" : "No waste detected in image"),
        suggestedWasteType: result.isWaste ? suggestedType : null,
        wasteDescription: result.isWaste ? (result.wasteDescription || null) : null,
        suggestedSeverity: result.isWaste ? suggestedSeverity : null
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
