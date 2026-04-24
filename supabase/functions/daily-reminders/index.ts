import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Triggered by a Supabase cron job: 0 20 * * * (8pm UTC daily)
serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = new Date();
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  async function notify(userId: string, title: string, body: string) {
    await supabase.functions.invoke("send-push-notification", {
      body: { user_id: userId, title, body },
    });
  }

  // Streak at risk — active recently but not in 20h
  const { data: atRisk } = await supabase
    .from("profiles")
    .select("id, navi_name, current_streak")
    .gt("last_active", fortyEightHoursAgo)
    .lt("last_active", twentyHoursAgo)
    .gt("current_streak", 0);

  for (const p of atRisk ?? []) {
    await notify(p.id, "STREAK ALERT", `OPERATOR. Your ${p.current_streak}-day streak is at risk. Log in before midnight.`);
  }

  // Inactive 48h+
  const { data: inactive } = await supabase
    .from("profiles")
    .select("id, navi_name")
    .lt("last_active", fortyEightHoursAgo);

  for (const p of inactive ?? []) {
    await notify(p.id, "OPERATOR ABSENT", `${p.navi_name ?? "NAVI"} is waiting for you. Your quests won't complete themselves.`);
  }

  return new Response(JSON.stringify({ processed: { atRisk: atRisk?.length ?? 0, inactive: inactive?.length ?? 0 } }), {
    headers: { "Content-Type": "application/json" },
  });
});
