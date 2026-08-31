// Server-side counterpart to src/lib/embedTrigger.ts — same reasoning: tell
// navi-embed-memories a row was just written rather than leaving it NULL
// until some future backfill call happens to cover that user and scope.
// Fire-and-forget on purpose: an action executor's response should not wait
// on an embedding call, and a missed one costs delay, not correctness — the
// row is still there for the next backfill pass.

export type EmbedScope = "memory" | "journal" | "quests";

export function triggerEmbed(userId: string, scope: EmbedScope): void {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY || !userId) return;

  fetch(`${SUPABASE_URL}/functions/v1/navi-embed-memories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ user_id: userId, scope }),
  }).catch(() => {});
}
