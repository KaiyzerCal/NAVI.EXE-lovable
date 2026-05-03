import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY        = Deno.env.get("OPENAI_API")!;

// Fetch unembedded memories for a user (up to 50 per call)
async function fetchUnembedded(userId: string): Promise<{ id: string; content: string }[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/navi_core_memory?user_id=eq.${userId}&embedding=is.null&select=id,content&limit=50`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) {
    console.error("fetchUnembedded error:", res.status, await res.text());
    return [];
  }
  return await res.json();
}

// Batch-embed an array of strings via OpenAI text-embedding-3-small.
// Returns parallel array of float arrays (or null on error).
async function batchEmbed(texts: string[]): Promise<(number[] | null)[]> {
  if (texts.length === 0) return [];
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts.map((t) => t.slice(0, 8000)),
    }),
  });
  if (!res.ok) {
    console.error("OpenAI embed error:", res.status, await res.text());
    return texts.map(() => null);
  }
  const data = await res.json();
  // data.data is sorted by index
  const sorted = (data.data as { index: number; embedding: number[] }[])
    .sort((a, b) => a.index - b.index);
  return sorted.map((d) => d.embedding ?? null);
}

// Write embedding back to a single row using the service key (bypasses RLS)
async function updateEmbedding(id: string, embedding: number[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/navi_core_memory?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ embedding }),
    }
  );
  if (!res.ok) {
    console.error("updateEmbedding error for", id, res.status, await res.text());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = await fetchUnembedded(user_id);
    if (rows.length === 0) {
      return new Response(JSON.stringify({ embedded: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddings = await batchEmbed(rows.map((r) => r.content));

    let count = 0;
    await Promise.all(
      rows.map(async (row, i) => {
        const emb = embeddings[i];
        if (emb) {
          await updateEmbedding(row.id, emb);
          count++;
        }
      })
    );

    return new Response(JSON.stringify({ embedded: count, total: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("navi-embed-memories error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
