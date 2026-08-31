// Fire-and-forget: tell navi-embed-memories a row was just written, so it
// gets a vector before the operator's next semantic search rather than
// sitting NULL until whatever next calls the backfill happens to run.
//
// Same pattern MavisChat.tsx already used for navi_core_memory inserts after
// a chat turn — this just gives every other write site (journal, quests, and
// the memory insert in useJournal.ts that never had one) the same call,
// instead of leaving them to rely on a backfill that isn't scheduled
// anywhere. A missed call here still self-heals on the next manual or
// scheduled backfill; nothing here is load-bearing for correctness, only for
// how soon a new entry becomes findable by meaning.
import { supabase } from "@/integrations/supabase/client";

const EMBED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/navi-embed-memories`;

export type EmbedScope = "memory" | "journal" | "quests";

export async function triggerEmbed(userId: string, scope: EmbedScope): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(EMBED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ user_id: userId, scope }),
    });
  } catch {
    // Best-effort. The next backfill pass (manual, or whatever future cron
    // picks this up) still finds and embeds the row.
  }
}
