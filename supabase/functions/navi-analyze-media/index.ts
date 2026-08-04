import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// deploy-trigger: the IDOR fix here landed in a merge-commit push that the
// prior CI diff logic (HEAD~1) silently failed to deploy — see
// a49326f's fix to deploy-edge-functions.yml. This touch gets it deployed
// for real through the now-fixed pipeline.
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

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
    // Previously trusted media_id (and file_url/file_type/file_name) from
    // the request body with no ownership check at all — any authenticated
    // caller could overwrite any other user's media.ai_description, and
    // could point the vision API at an arbitrary attacker-chosen file_url
    // regardless of what was actually stored for that media_id.
    const authedUser = await getAuthedUser(req);
    if (!authedUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { media_id } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API secret not set");

    const sb = serviceClient();

    const { data: mediaRow, error: mediaErr } = await sb
      .from("media")
      .select("id, user_id, file_url, file_type, file_name")
      .eq("id", media_id)
      .single();
    if (mediaErr || !mediaRow) {
      return new Response(JSON.stringify({ error: "Media not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mediaRow.user_id !== authedUser.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { file_url, file_type, file_name } = mediaRow;

    let description = "";

    if (file_type === "image") {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
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
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
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
