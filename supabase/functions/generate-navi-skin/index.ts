import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skinName, skinColor } = await req.json();
    if (!skinName) throw new Error("skinName required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already cached
    const filePath = `${skinName.toLowerCase()}.png`;
    const { data: existing } = await supabase.storage
      .from("navi-skins")
      .createSignedUrl(filePath, 60);

    if (existing?.signedUrl) {
      // Verify the file actually exists by trying to download a tiny bit
      const { data: fileData } = await supabase.storage
        .from("navi-skins")
        .download(filePath);
      if (fileData) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`;
        return new Response(JSON.stringify({ imageUrl: publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Generate with AI
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const prompt = `A digital creature companion called "${skinName}" in the style of a MegaMan Battle Network NetNavi or Digimon. Humanoid digital creature, full body, centered, facing forward, clean transparent background. The creature has a ${skinColor} color theme. Cute but cool cyberpunk digital aesthetic with glowing circuit-line details. Simple clean design suitable for a game avatar icon. On a solid white background.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI generation failed: ${aiRes.status} ${errText}`);
    }

    const aiData = await aiRes.json();
    const base64Url = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!base64Url) throw new Error("No image in AI response");

    // Extract base64 data and upload to storage
    const base64Data = base64Url.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from("navi-skins")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`;
    return new Response(JSON.stringify({ imageUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
