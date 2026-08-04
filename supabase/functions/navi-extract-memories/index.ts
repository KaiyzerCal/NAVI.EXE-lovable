import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { getAuthedUser, serviceClient } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `You are a memory extraction system for a personal AI companion.
Extract factual, durable memories from the user message below.
Only extract things that are genuinely worth remembering long-term (not conversational filler).
Return JSON: { "memories": [ { "memory_type": string, "content": string, "importance": number } ] }

memory_type must be one of: goals, preferences, relationships, struggles, projects, people, places, important_notes
importance: 1 (minor) to 5 (critical)

Return at most 4 memories. If nothing is worth remembering, return { "memories": [] }.
Do NOT extract questions the user asked. Only extract facts the user stated about themselves or their life.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Previously trusted user_id straight from the request body with no
  // ownership check — any authenticated caller could inject fabricated
  // "memories" into another user's navi_core_memory (AI companion memory
  // poisoning). Derive the caller from their verified JWT instead.
  const authedUser = await getAuthedUser(req);
  if (!authedUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const user_id = authedUser.id;

  const { message } = await req.json();
  if (!message) return new Response("missing params", { status: 400 });

  const openaiKey = Deno.env.get("OPENAI_API");
  if (!openaiKey) return new Response("no openai key", { status: 500 });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user",   content: message.slice(0, 1500) },
      ],
    }),
  });

  if (!res.ok) return new Response("openai error", { status: 500 });

  const data = await res.json();
  let memories: any[] = [];
  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    memories = parsed.memories ?? [];
  } catch {
    return new Response(JSON.stringify({ inserted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (!memories.length) {
    return new Response(JSON.stringify({ inserted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = serviceClient();

  const { count } = await supabase.from("navi_core_memory").upsert(
    memories.map((m: any) => ({
      user_id,
      memory_type: m.memory_type,
      content:     m.content,
      importance:  Math.min(5, Math.max(1, m.importance ?? 2)),
    })),
    { onConflict: "user_id,memory_type,content", ignoreDuplicates: true }
  );

  // Trigger embedding for newly saved memories (fire-and-forget)
  const embedUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/navi-embed-memories`;
  fetch(embedUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({ user_id }),
  }).catch(() => {});

  return new Response(JSON.stringify({ inserted: count ?? memories.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
