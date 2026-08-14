import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Verified against the published source: Image.decode and Image#encode are both
// async (`static async decode(data)` / `async encode(compression = 1)`).
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Art direction ───────────────────────────────────────────────────────────
// One shared style block keeps all 72 skins looking like they came from the
// same artist — the single biggest quality problem with generating them one
// call at a time rather than as a single consistent sheet.
//
// 'cgi' is the style the app ships. 'painterly' is kept because it is a
// genuinely different treatment of the same roster and costs nothing to
// retain, but it is no longer wired into the UI.
//
// Two things the original prompt got wrong, worth not regressing into:
// it asked for "simple clean design suitable for a game avatar icon" (which
// is why the old art reads flat and cheap) on "a solid white background"
// (in an app themed dark, so every skin sat in a white box).
//
// Shared subject block so both styles depict the SAME character, with only
// the rendering treatment differing.
const SHARED_SUBJECT = [
  "Chibi proportions: roughly 2.5 heads tall, oversized expressive head, short stubby limbs, small body.",
  "Anthropomorphic creature standing upright on two legs, wearing layered clothing",
  "(jacket, hoodie, coat, scarf, or robe) with visible fabric folds and worn detail.",
  "Glowing eyes as the strongest focal point. Clean, readable silhouette.",
  "Full body, facing forward, symmetrical relaxed idle stance, centered in frame.",
  "Single character only. No text, no logos, no watermark, no border, no frame.",
].join(" ");

// Background instruction differs by provider. gpt-image-1 produces genuine
// alpha, so it is simply asked for a transparent background. Gemini has no
// transparency support and responds to "transparent background" by PAINTING a
// grey checkerboard — so it is asked for a flat chroma plate instead, which is
// keyed out afterwards.
const BACKGROUNDS: Record<string, string> = {
  transparent: "Transparent background. Soft contact shadow beneath the feet.",
  chroma: [
    "The background must be one completely flat, uniform, solid pure magenta colour (hex #FF00FF),",
    "filling the entire frame behind the character edge to edge.",
    "Absolutely no gradient, no vignette, no lighting falloff, no texture, no pattern,",
    "and critically NO grey-and-white checkerboard pattern of any kind.",
    "Do not cast the character's shadow onto the background — no contact shadow, no drop shadow.",
    "Do not use magenta anywhere on the character itself.",
  ].join(" "),
};

const PAINTERLY_STYLE = [
  "Painterly 2D game character art, in the style of a hand-painted RPG character sheet.",
  "Visible painterly brush texture and soft edges — NOT flat vector, NOT cel-shaded anime,",
  "NOT a 3D render, NOT glossy plastic, NOT photorealistic.",
  "Muted, desaturated, earthy colour palette (olive, rust, umber, slate, teal)",
  "with a small number of saturated accent colours used sparingly for focus.",
  "Strong dark outline. Subtle rim lighting separating the character from the background.",
  SHARED_SUBJECT,
].join(" ");

const CGI_STYLE = [
  "High-end stylized 3D CGI character render, as if from a modern animated feature film",
  "or a collectible vinyl designer toy. Rendered in three dimensions with real depth and volume.",
  "Physically-based materials with clearly differentiated surfaces: soft fuzzy fabric,",
  "brushed metal, worn leather, subsurface scattering through skin and ears.",
  "Cinematic three-point studio lighting with a strong rim light, soft global illumination,",
  "gentle ambient occlusion in the crevices, shallow depth of field.",
  "Crisp micro-detail — stitching, fabric weave, scuffs, fingerprints on metal.",
  "Richer and more saturated than a painting, but still grounded and tasteful.",
  "NOT a 2D drawing, NOT painterly, NOT flat, NOT cel-shaded, NOT pixel art.",
  SHARED_SUBJECT,
].join(" ");

const STYLES: Record<string, string> = {
  painterly: PAINTERLY_STYLE,
  cgi: CGI_STYLE,
};

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

function buildPrompt(
  skinName: string,
  category?: string,
  accent?: string,
  style?: string,
  background: "transparent" | "chroma" = "transparent",
): string {
  const categoryLine = (category && CATEGORY_DIRECTION[category.toUpperCase()]) ?? "";
  // The name itself carries the creature identity (Flamebird, Ironbear,
  // Moonwitch...), so it drives the design rather than a rarity colour.
  const accentLine = accent ? `Accent colour palette: ${accent}.` : "";
  const styleBlock = STYLES[String(style ?? "cgi").toLowerCase()] ?? CGI_STYLE;
  return [
    `A collectible creature companion character named "${skinName}".`,
    `Design the creature to match its name — its species, silhouette and outfit should read as "${skinName}" at a glance.`,
    categoryLine,
    accentLine,
    styleBlock,
    BACKGROUNDS[background],
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
// Image generation via Lovable's AI gateway (google/gemini-2.5-flash-image-preview).
// Billed against Lovable credits rather than the OpenAI key — the same gateway
// and key navi-chat already uses. Returns null (rather than throwing) so the
// caller can fall back to OpenAI, and reports the response shape on failure so
// a wrong assumption about the payload is visible instead of silent.
async function generateViaLovable(prompt: string): Promise<{ bytes?: Uint8Array; error?: string }> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { error: "LOVABLE_API_KEY not set" };

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) return { error: `lovable ${res.status} ${(await res.text()).slice(0, 300)}` };

  const data = await res.json();
  const msg = data?.choices?.[0]?.message;
  // Observed shape is images[].image_url.url as a data: URI, but accept the
  // other plausible carriers rather than assuming exactly one.
  const candidate =
    msg?.images?.[0]?.image_url?.url ??
    msg?.images?.[0]?.url ??
    data?.data?.[0]?.b64_json ??
    (typeof msg?.content === "string" && msg.content.startsWith("data:image") ? msg.content : undefined);

  if (typeof candidate !== "string") {
    return { error: `lovable: no image found; keys=${JSON.stringify(Object.keys(msg ?? {}))}` };
  }
  const b64 = candidate.startsWith("data:") ? candidate.split(",")[1] ?? "" : candidate;
  if (!b64) return { error: "lovable: empty image payload" };
  return { bytes: Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)) };
}

// Turns the flat magenta plate Gemini produces into real transparency.
//
// Keying is done by flood-filling inward from the frame edges rather than by
// removing every magenta-ish pixel globally, so magenta that appears *on the
// character* (glowing trim, a gem) survives — only background connected to the
// border is cut. Edge pixels are then despilled, because anti-aliasing blends
// character colour with the magenta plate and would otherwise leave a pink
// fringe on every silhouette.
async function keyOutChroma(png: Uint8Array): Promise<Uint8Array> {
  const img = await Image.decode(png);
  const { width: w, height: h } = img;
  const px = img.bitmap; // RGBA, row-major

  // How strongly a pixel reads as the magenta key: red and blue both high while
  // green is suppressed. Neutral and non-magenta colours score at or below zero.
  const keyScore = (i: number) => Math.min(px[i], px[i + 2]) - px[i + 1];

  const HARD = 40; // definitely background
  const isBg = new Uint8Array(w * h);
  const queue: number[] = [];

  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (isBg[p]) return;
    if (keyScore(p * 4) < HARD) return;
    isBg[p] = 1;
    queue.push(p);
  };

  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

  while (queue.length) {
    const p = queue.pop()!;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }

  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (isBg[p]) { px[i + 3] = 0; continue; }

    // Despill: pull red and blue back down toward green by however much magenta
    // bled in, and fade alpha on heavily-contaminated (i.e. anti-aliased) pixels.
    const spill = keyScore(i);
    if (spill > 0) {
      const cap = px[i + 1] + Math.max(0, spill - 24);
      px[i] = Math.min(px[i], cap);
      px[i + 2] = Math.min(px[i + 2], cap);
      if (spill > 24) px[i + 3] = Math.max(0, Math.min(255, Math.round(255 * (1 - (spill - 24) / (HARD - 24)))));
    }
  }

  return await img.encode();
}

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
      // "painterly" (2D hand-painted) or "cgi" (stylized 3D render). These are
      // the app's two render modes — the same character in two art treatments.
      style,
      // Write somewhere other than the default style path — used to render
      // previews without overwriting live art.
      pathOverride,
      // Regenerate even when a file already exists (restyling an existing set).
      force,
      // "lovable" (default, Lovable credits) | "openai" | "auto" (try Lovable,
      // fall back to OpenAI).
      provider: providerRaw,
      // Skip chroma keying and store the raw magenta plate — for inspecting
      // whether the model actually produced a clean, flat key colour.
      rawChroma,
    } = await req.json();
    if (!skinName) throw new Error("skinName required");

    // Each style gets its own folder. The original flat "<name>.png" layout is
    // left alone so the pre-existing art stays available as a fallback.
    const styleKey = STYLES[String(style ?? "cgi").toLowerCase()] ? String(style ?? "cgi").toLowerCase() : "cgi";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error: bucketError } = await supabase.storage.createBucket("navi-skins", { public: true });
    if (bucketError && !bucketError.message.includes("already exists")) {
      console.log("Bucket creation error:", bucketError.message);
    }

    const filePath = String(pathOverride ?? `${styleKey}/${String(skinName).toLowerCase()}.png`);

    if (!force) {
      const { data: fileData } = await supabase.storage.from("navi-skins").download(filePath);
      if (fileData) {
        return new Response(
          JSON.stringify({ imageUrl: `${supabaseUrl}/storage/v1/object/public/navi-skins/${filePath}`, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Prefer Lovable's gateway (Lovable credits) over OpenAI (per-image billing
    // on the OpenAI key). `provider` forces one or the other for comparison.
    const provider = String(providerRaw ?? "lovable").toLowerCase();
    let binaryData: Uint8Array | undefined;
    let lovableError: string | undefined;

    if (provider !== "openai") {
      // Gemini cannot emit alpha, so ask for a flat magenta plate and key it out.
      const r = await generateViaLovable(buildPrompt(skinName, category, skinColor, styleKey, "chroma"));
      binaryData = r.bytes;
      lovableError = r.error;
      if (!binaryData && provider === "lovable") {
        throw new Error(`Lovable image generation failed: ${lovableError}`);
      }
      // `rawChroma` skips keying so the un-processed plate can be inspected.
      if (binaryData && !rawChroma) binaryData = await keyOutChroma(binaryData);
    }

    if (!binaryData) {
      const apiKey = Deno.env.get("OPENAI_API");
      if (!apiKey) throw new Error(`OPENAI_API secret not set (lovable: ${lovableError ?? "skipped"})`);
      binaryData = await generateImage(apiKey, buildPrompt(skinName, category, skinColor, styleKey, "transparent"));
    }

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
