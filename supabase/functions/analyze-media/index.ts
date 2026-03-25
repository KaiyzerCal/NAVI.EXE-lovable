import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { media_id, file_url, file_type, file_name } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    let description = "";

    if (file_type === "image") {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Describe this image in 2-3 sentences. Identify any text, people, objects, or activities visible." },
                { type: "image_url", image_url: { url: file_url } },
              ],
            },
          ],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        description = data.choices?.[0]?.message?.content || "";
      }
    } else if (file_type === "document") {
      // For text/pdf docs, try to fetch content
      let textContent = "";
      const ext = file_name.split(".").pop()?.toLowerCase();
      if (ext === "txt" || ext === "md") {
        try {
          const r = await fetch(file_url);
          textContent = await r.text();
        } catch {}
      }

      if (textContent) {
        const truncated = textContent.slice(0, 3000);
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "user", content: `Summarize this document in 3-4 sentences:\n\n${truncated}` },
            ],
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          description = data.choices?.[0]?.message?.content || "";
        }
      }
    }

    if (description) {
      await sb.from("media").update({ ai_description: description }).eq("id", media_id);
    }

    return new Response(JSON.stringify({ ok: true, description }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
