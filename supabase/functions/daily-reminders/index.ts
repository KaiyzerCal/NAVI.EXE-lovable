import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Runs every hour via Supabase cron. Fires proactive alerts at the right local hour per user.
serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const now = new Date();
  const utcHour = now.getUTCHours();
  const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);

  async function notify(userId: string, title: string, body: string) {
    await supabase.functions.invoke("send-push-notification", {
      body: { user_id: userId, title, body },
    });
  }

  function localHour(tzName: string | null): number {
    if (!tzName) return utcHour;
    try {
      const h = parseInt(new Date().toLocaleTimeString("en-US", { timeZone: tzName, hour: "2-digit", hour12: false }));
      return isNaN(h) ? utcHour : h % 24;
    } catch { return utcHour; }
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, navi_name, display_name, current_streak, last_active, timezone, notification_settings")
    .not("last_active", "is", null);

  const stats = { streakAlerts: 0, inactiveAlerts: 0, questExpiry: 0, journalNudge: 0, celebrated: 0 };

  for (const p of profiles ?? []) {
    const notifs = (p.notification_settings as any) ?? {};
    if (notifs.push === false) continue;

    const lh = localHour(p.timezone);
    const lastActive = p.last_active ? new Date(p.last_active) : null;

    // 9pm local — streak at risk
    if (lh === 21 && (p.current_streak ?? 0) > 0 && lastActive && lastActive < new Date(twentyHoursAgo)) {
      await notify(p.id, "⚡ STREAK ALERT", `OPERATOR. Your ${p.current_streak}-day streak is at risk. Log in before midnight.`);
      stats.streakAlerts++;
    }

    // 6pm local — inactive 48h+
    if (lh === 18 && lastActive && lastActive < new Date(fortyEightHoursAgo)) {
      await notify(p.id, "OPERATOR ABSENT", `${p.navi_name ?? "NAVI"} is waiting. Your quests need you.`);
      stats.inactiveAlerts++;
    }

    // 8pm local — daily quests expiring tonight
    if (lh === 20) {
      const { data: expiring } = await supabase
        .from("quests")
        .select("name")
        .eq("user_id", p.id)
        .eq("type", "Daily")
        .eq("completed", false)
        .limit(3);
      if (expiring && expiring.length > 0) {
        const names = expiring.map((q: any) => q.name).join(", ");
        await notify(p.id, "DAILY QUESTS EXPIRING", `${expiring.length} quest(s) incomplete tonight: ${names}`);
        stats.questExpiry++;
      }
    }

    // 7pm local — no journal entry in 4 days
    if (lh === 19) {
      const { data: recent } = await supabase
        .from("journal_entries").select("id").eq("user_id", p.id).gt("created_at", fourDaysAgo).limit(1);
      if (!recent || recent.length === 0) {
        await notify(p.id, `${p.navi_name ?? "NAVI"} NOTICED`, "Four days since your last journal entry. What's been happening?");
        stats.journalNudge++;
      }
    }

    // 3pm local — celebrate 3+ quests completed today
    if (lh === 15) {
      const { data: done } = await supabase
        .from("quests").select("id").eq("user_id", p.id).eq("completed", true)
        .gt("updated_at", todayStart.toISOString()).limit(5);
      if (done && done.length >= 3) {
        await notify(p.id, "TRIPLE SYNC", `${done.length} quests completed today. ${p.navi_name ?? "NAVI"} is proud of you.`);
        stats.celebrated++;
      }
    }
  }

  return new Response(JSON.stringify({ processed: profiles?.length ?? 0, ...stats }), {
    headers: { "Content-Type": "application/json" },
  });
});
