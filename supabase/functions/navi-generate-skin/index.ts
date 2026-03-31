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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // Ensure bucket exists
    const { error: bucketError } = await supabase.storage.createBucket("navi-skins", { public: true });
    if (bucketError && !bucketError.message.includes("already exists")) {
      console.log("Bucket creation error:", bucketError.message);
    }

    // Check if already cached
    const filePath = `${skinName.toLowerCase()}.png`;
    const { data: fileData } = await supabase.storage
      .from("navi-skins")
      .download(filePath);
    if (fileData) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`;
      return new Response(JSON.stringify({ imageUrl: publicUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate with OpenAI DALL-E 3
    const apiKey = Deno.env.get("OPENAI_API");
    if (!apiKey) throw new Error("OPENAI_API secret not set");

    const prompt = `A digital creature companion called "${skinName}" in the style of a MegaMan Battle Network NetNavi or Digimon. Humanoid digital creature, full body, centered, facing forward, clean transparent background. The creature has a ${skinColor} color theme. Cute but cool cyberpunk digital aesthetic with glowing circuit-line details. Simple clean design suitable for a game avatar icon. On a solid white background.`;

    const aiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI generation failed: ${aiRes.status} ${errText}`);
    }

    const aiData = await aiRes.json();
    const base64Data = aiData.data?.[0]?.b64_json;
    if (!base64Data) throw new Error("No image in AI response");

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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
