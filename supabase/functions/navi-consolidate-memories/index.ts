import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API") ?? "";

async function fetchMemories(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/navi_core_memory?user_id=eq.${userId}&select=id,content,memory_type,importance,embedding,created_at&order=created_at.asc`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  if (!res.ok) return [];
  return await res.json() as any[];
}

function cosineSim(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function deleteMemory(id: string) {
  await fetch(`${SUPABASE_URL}/rest/v1/navi_core_memory?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
  });
}

async function summarizeAndReplace(userId: string, memories: any[]): Promise<number> {
  if (!OPENAI_API_KEY || memories.length < 2) return 0;
  const combined = memories.map((m) => `[${m.memory_type}] ${m.content}`).join("\n");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize these NAVI memory entries into one concise paragraph capturing the key facts, patterns, and important details. Be specific and retain names, dates, and numbers. Under 300 words." },
        { role: "user", content: combined.slice(0, 6000) },
      ],
      max_tokens: 400,
    }),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const summary = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!summary) return 0;
  for (const m of memories) await deleteMemory(m.id);
  await fetch(`${SUPABASE_URL}/rest/v1/navi_core_memory`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json", Prefer: "return=minimal",
    },
    body: JSON.stringify({ user_id: userId, memory_type: "consolidated_summary", content: summary, importance: 3 }),
  });
  return memories.length;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const memories = await fetchMemories(user_id);
    const withEmb = memories.filter((m) => Array.isArray(m.embedding) && m.embedding.length > 0);
    const withoutEmb = memories.filter((m) => !Array.isArray(m.embedding) || m.embedding.length === 0);

    let dedupCount = 0;
    let consolidatedCount = 0;

    // 1. Deduplicate vectors: cosine > 0.92 = near-duplicate, keep highest importance
    const toDelete = new Set<string>();
    for (let i = 0; i < withEmb.length; i++) {
      if (toDelete.has(withEmb[i].id)) continue;
      for (let j = i + 1; j < withEmb.length; j++) {
        if (toDelete.has(withEmb[j].id)) continue;
        if (cosineSim(withEmb[i].embedding, withEmb[j].embedding) > 0.92) {
          const loser = (withEmb[i].importance ?? 0) >= (withEmb[j].importance ?? 0) ? j : i;
          toDelete.add(withEmb[loser].id);
          dedupCount++;
        }
      }
    }
    for (const id of toDelete) await deleteMemory(id);

    // 2. Consolidate old low-importance memories (importance <= 2, older than 90 days)
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
    const stale = withoutEmb.filter((m) => (m.importance ?? 5) <= 2 && m.created_at < cutoff);
    for (let i = 0; i < stale.length; i += 10) {
      const batch = stale.slice(i, i + 10);
      if (batch.length >= 2) consolidatedCount += await summarizeAndReplace(user_id, batch);
    }

    return new Response(JSON.stringify({ deduped: dedupCount, consolidated: consolidatedCount, total: memories.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("consolidate-memories error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
