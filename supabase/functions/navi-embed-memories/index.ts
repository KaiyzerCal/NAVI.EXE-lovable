import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY        = Deno.env.get("OPENAI_API")!;

interface Embeddable {
  table: string;
  /** The column embedded and searched. journal/quests also have a title,
   *  but the title alone isn't why someone would search these by meaning —
   *  the body is. Kept to one column, matching navi_core_memory's shape. */
  contentCol: string;
}

const TABLES: Record<string, Embeddable> = {
  memory:  { table: "navi_core_memory", contentCol: "content" },
  journal: { table: "journal_entries",  contentCol: "content" },
  quests:  { table: "quests",           contentCol: "description" },
};

/**
 * Rows with blank content can never produce an embedding — embedText would
 * just be asked to embed "". mythos-vantara's equivalent backfill spun
 * forever on exactly this: an unordered `embedding IS NULL` scan returned
 * the same unembeddable rows first every run, so `remaining` never reached
 * 0. Filtering on the query, not just skipping in the loop, is what makes
 * this resumable — see CLAUDE.md there for the full incident.
 *
 * `not.match` on a whitespace pattern rather than `neq.` a literal empty
 * string: `content <> ''` is true for "   ", so a whitespace-only row would
 * still be selected forever in the same way.
 */
const BLANK = "^[[:space:]]*$";

// Fetch unembedded, non-blank rows for a user (up to 50 per call).
async function fetchUnembedded(userId: string, t: Embeddable): Promise<{ id: string; content: string }[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/${t.table}` +
    `?user_id=eq.${userId}` +
    `&embedding=is.null` +
    `&${t.contentCol}=not.match.${encodeURIComponent(BLANK)}` +
    `&select=id,${t.contentCol}&limit=50`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!res.ok) {
    console.error(`fetchUnembedded(${t.table}) error:`, res.status, await res.text());
    return [];
  }
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows.map((r) => ({ id: String(r.id), content: String(r[t.contentCol] ?? "") }));
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
async function updateEmbedding(table: string, id: string, embedding: number[]): Promise<void> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
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
    console.error(`updateEmbedding(${table}) error for`, id, res.status, await res.text());
  }
}

async function embedScope(userId: string, key: string): Promise<{ embedded: number; total: number }> {
  const t = TABLES[key];
  const rows = await fetchUnembedded(userId, t);
  if (rows.length === 0) return { embedded: 0, total: 0 };

  const embeddings = await batchEmbed(rows.map((r) => r.content));

  let count = 0;
  await Promise.all(
    rows.map(async (row, i) => {
      const emb = embeddings[i];
      if (emb) {
        await updateEmbedding(t.table, row.id, emb);
        count++;
      }
    })
  );
  return { embedded: count, total: rows.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, scope } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wanted = scope && scope !== "all"
      ? String(scope).split(/[,\s]+/).filter((k: string) => k in TABLES)
      : Object.keys(TABLES);
    if (wanted.length === 0) {
      return new Response(JSON.stringify({ error: `unknown scope "${scope}"`, scopes: Object.keys(TABLES) }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report: Record<string, { embedded: number; total: number }> = {};
    for (const key of wanted) {
      report[key] = await embedScope(user_id, key);
    }

    // Backward-compatible top-level "embedded" for callers that only ever
    // asked for the default (memory) scope before this generalised.
    const embedded = Object.values(report).reduce((n, r) => n + r.embedded, 0);
    return new Response(JSON.stringify({ embedded, report }), {
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
