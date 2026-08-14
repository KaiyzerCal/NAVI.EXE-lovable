import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Art direction ───────────────────────────────────────────────────────────
// One shared style block keeps all 72 skins looking like they came from the
// same artist — the single biggest quality problem with generating them one
// call at a time. Everything here is deliberate:
//
//   painterly, NOT vector    — the old prompt asked for "simple clean design
//                              suitable for a game avatar icon", which is why
//                              the existing art reads flat and cheap.
//   NOT 3D/CGI               — the look we're matching is painted 2D. Asking
//                              for "CGI" yields glossy plastic Pixar renders,
//                              which is a different thing entirely.
//   transparent background   — the old prompt forced "solid white background"
//                              on an app whose theme is dark, so every skin
//                              sat in a white box.
//   muted base + hot accent  — desaturated earthy palette with a few saturated
//                              focal points (notably the eyes) is what makes
//                              the reference read as high-craft rather than
//                              generic-bright.
const STYLE = [
  "Painterly 2D game character art, in the style of a hand-painted RPG character sheet.",
  "Chibi proportions: roughly 2.5 heads tall, oversized expressive head, short stubby limbs, small body.",
  "Anthropomorphic creature standing upright on two legs, wearing layered clothing",
  "(jacket, hoodie, coat, scarf, or robe) with visible fabric folds and worn detail.",
  "Visible painterly brush texture and soft edges — NOT flat vector, NOT cel-shaded anime,",
  "NOT a 3D render, NOT glossy plastic, NOT photorealistic.",
  "Muted, desaturated, earthy colour palette (olive, rust, umber, slate, teal)",
  "with a small number of saturated accent colours used sparingly for focus.",
  "Glowing eyes as the strongest focal point. Strong dark outline and a clean readable silhouette.",
  "Subtle rim lighting separating the character from the background.",
  "Full body, facing forward, symmetrical relaxed idle stance, centered in frame,",
  "with a soft contact shadow beneath the feet.",
  "Transparent background. Single character only. No text, no logos, no watermark, no border, no frame.",
].join(" ");

// Per-category direction so a Tech skin and a Mythic skin don't come back as
// the same creature in a different hue. The old function drove colour off
// RARITY alone, which is exactly why the set looks repetitive.
const CATEGORY_DIRECTION: Record<string, string> = {
  ELEMENTAL: "Elemental spirit theme: the creature's element visibly manifests as part of its body — flame, water, frost, stone or lightning — bleeding into the clothing.",
  CLASS:     "Adventuring-class theme: fantasy job outfit with practical gear — armour plates, satchels, straps, a weapon or tool of the trade.",
  MYTHIC:    "Legendary myth theme: ornate ceremonial regalia, ancient patterned trim, an air of scale and gravity despite the small stature.",
  COSMIC:    "Cosmic theme: deep-space materials — starfield textures inside the silhouette, faint nebula glow, constellation markings.",
  NATURE:    "Nature theme: organic growth — moss, bark, leaves, petals or fungus integrated into the body and clothing.",
  TECH:      "Cyberpunk tech theme: panelled armour, exposed circuitry, thin glowing LED trim, a visor or antenna.",
  SPECIAL:   "Rare special theme: unusual materials and an unmistakably distinct design that reads as a prize.",
};

function buildPrompt(skinName: string, category?: string, accent?: string): string {
  const categoryLine = (category && CATEGORY_DIRECTION[category.toUpperCase()]) ?? "";
  // The name itself carries the creature identity (Flamebird, Ironbear,
  // Moonwitch...), so it drives the design rather than a rarity colour.
  const accentLine = accent ? `Accent colour palette: ${accent}.` : "";
  return [
    `A collectible creature companion character named "${skinName}".`,
    `Design the creature to match its name — its species, silhouette and outfit should read as "${skinName}" at a glance.`,
    categoryLine,
    accentLine,
    STYLE,
  ].filter(Boolean).join(" ");
}

// gpt-image-1 renders characters far better than dall-e-3 and supports real
// transparent backgrounds, but it requires a verified OpenAI org — so fall
// back to dall-e-3 rather than failing outright if it's unavailable.
// NOTE: `response_format` is deliberately absent. Passing it is what broke
// this function (OpenAI now rejects it with
// "Unknown parameter: 'response_format'"), which is why no skin has been
// generated since March and 8 of the 72 were never created at all.
// gpt-image-1 always returns b64_json; dall-e-3 returns a url by default,
// which is handled below.
async function generateImage(apiKey: string, prompt: string): Promise<Uint8Array> {
  const attempts: Array<Record<string, unknown>> = [
    { model: "gpt-image-1", prompt, n: 1, size: "1024x1024", quality: "high", background: "transparent", output_format: "png" },
    { model: "dall-e-3",    prompt, n: 1, size: "1024x1024", quality: "hd" },
  ];

  const errors: string[] = [];
  for (const body of attempts) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      errors.push(`${body.model}: ${res.status} ${(await res.text()).slice(0, 300)}`);
      continue;
    }

    const data = await res.json();
    const item = data.data?.[0];
    if (item?.b64_json) {
      return Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0));
    }
    if (item?.url) {
      const img = await fetch(item.url);
      if (img.ok) return new Uint8Array(await img.arrayBuffer());
      errors.push(`${body.model}: image fetch failed ${img.status}`);
      continue;
    }
    errors.push(`${body.model}: no image in response`);
  }

  throw new Error(`AI generation failed — ${errors.join(" | ")}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      skinName,
      skinColor,
      category,
      // Write somewhere other than "<name>.png" — used to render style
      // previews without overwriting the live art for a skin.
      pathOverride,
      // Regenerate even when a file already exists (restyling an existing set).
      force,
    } = await req.json();
    if (!skinName) throw new Error("skinName required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error: bucketError } = await supabase.storage.createBucket("navi-skins", { public: true });
    if (bucketError && !bucketError.message.includes("already exists")) {
      console.log("Bucket creation error:", bucketError.message);
    }

    const filePath = String(pathOverride ?? `${String(skinName).toLowerCase()}.png`);

    if (!force) {
      const { data: fileData } = await supabase.storage.from("navi-skins").download(filePath);
      if (fileData) {
        return new Response(
          JSON.stringify({ imageUrl: `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const apiKey = Deno.env.get("OPENAI_API");
    if (!apiKey) throw new Error("OPENAI_API secret not set");

    const binaryData = await generateImage(apiKey, buildPrompt(skinName, category, skinColor));

    const { error: uploadError } = await supabase.storage
      .from("navi-skins")
      .upload(filePath, binaryData, { contentType: "image/png", upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    return new Response(
      JSON.stringify({ imageUrl: `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
