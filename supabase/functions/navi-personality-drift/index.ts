import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PERSONALITY_TYPES = [
  "guardian","hype","rogue","shadow","sage",
  "companion","analytical","wildcard","strategist","mentor",
] as const;

const MIN_SESSIONS    = 5;
const DRIFT_THRESHOLD = 0.6;

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from("personality_session_scores")
    .select("user_id, guardian_score, hype_score, rogue_score, shadow_score, sage_score, companion_score, analytical_score, wildcard_score, strategist_score, mentor_score, quests_completed_after, bond_delta")
    .gte("session_date", cutoff);

  if (!sessions?.length) return new Response("no data", { status: 200 });

  const byUser = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id)!.push(s);
  }

  let updated = 0;

  for (const [userId, userSessions] of byUser) {
    if (userSessions.length < MIN_SESSIONS) continue;

    const totals: Record<string, number> = {};
    for (const pt of PERSONALITY_TYPES) totals[pt] = 0;
    let totalWeight = 0;

    for (const s of userSessions) {
      const weight = 1 + (s.quests_completed_after ?? 0) * 0.5 + Math.max(0, s.bond_delta ?? 0) * 0.1;
      totalWeight += weight;
      for (const pt of PERSONALITY_TYPES) {
        totals[pt] += ((s as any)[`${pt}_score`] ?? 0) * weight;
      }
    }

    const maxPt = PERSONALITY_TYPES.reduce((a, b) => totals[a] > totals[b] ? a : b);
    const confidence = totalWeight > 0 ? totals[maxPt] / (totalWeight * 100) : 0;

    await supabase.from("personality_drift_config").upsert({
      user_id:           userId,
      drift_personality: maxPt.toUpperCase(),
      drift_confidence:  Math.round(confidence * 100) / 100,
      last_computed_at:  new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (confidence >= DRIFT_THRESHOLD) {
      await supabase.from("profiles")
        .update({ navi_personality: maxPt.toUpperCase() })
        .eq("id", userId);
      updated++;
    }
  }

  return new Response(JSON.stringify({ processed: byUser.size, drifted: updated }), {
    headers: { "Content-Type": "application/json" },
  });
});
