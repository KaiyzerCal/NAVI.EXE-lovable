import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Flame } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface StatsData {
  completedQuests: number;
  bestStreak: number;
  weeklyXp: { day: string; xp: number }[];
  topSkills: { name: string; xp: number }[];
  achievements: { name: string; description: string; unlocked: boolean }[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function StatsPage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    completedQuests: 0, bestStreak: 0, weeklyXp: [], topSkills: [], achievements: [],
  });

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    Promise.all([
      supabase.from("quests").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
      supabase.from("skills" as any).select("name, xp").eq("user_id", user.id).order("xp", { ascending: false }).limit(5),
      supabase.from("achievements").select("name, description, unlocked").eq("user_id", user.id),
      supabase.from("activity_log" as any).select("xp_amount, created_at").eq("user_id", user.id).gte("created_at", startOfWeek.toISOString()).gt("xp_amount", 0),
    ]).then(([questsRes, skillsRes, achieveRes, activityRes]) => {
      // Build weekly XP chart
      const weeklyMap: Record<string, number> = {};
      DAYS.forEach((d) => (weeklyMap[d] = 0));
      ((activityRes.data || []) as any[]).forEach((item: any) => {
        const day = DAYS[new Date(item.created_at).getDay()];
        weeklyMap[day] += item.xp_amount || 0;
      });
      const weeklyXp = DAYS.map((d) => ({ day: d, xp: weeklyMap[d] }));

      setStats({
        completedQuests: questsRes.count || 0,
        bestStreak: profile.longest_streak,
        weeklyXp,
        topSkills: ((skillsRes.data || []) as any[]).map((s: any) => ({ name: s.name, xp: s.xp || 0 })),
        achievements: ((achieveRes.data || []) as any[]),
      });
    });
  }, [user, profile.longest_streak]);

  const maxXp = Math.max(1, ...stats.weeklyXp.map((d) => d.xp));

  return (
    <div>
      <PageHeader title="STATS" subtitle="// PERFORMANCE METRICS" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL XP", value: profile.xp_total.toLocaleString(), icon: <TrendingUp size={16} />, color: "text-neon-cyan" },
          { label: "QUESTS DONE", value: String(stats.completedQuests), icon: <Target size={16} />, color: "text-neon-green" },
          { label: "NAVI LEVEL", value: String(profile.navi_level), icon: <BarChart3 size={16} />, color: "text-neon-purple" },
          { label: "BEST STREAK", value: `${stats.bestStreak}d`, icon: <Flame size={16} />, color: "text-neon-amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      <HudCard title="WEEKLY XP" icon={<BarChart3 size={14} />} glow className="mb-6">
        <div className="flex items-end gap-2 h-40">
          {stats.weeklyXp.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground w-full text-center">No XP data this week.</p>
          ) : (
            stats.weeklyXp.map((d, i) => (
              <motion.div key={d.day} initial={{ height: 0 }}
                animate={{ height: d.xp > 0 ? `${(d.xp / maxXp) * 100}%` : "4px" }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex-1 flex flex-col items-center justify-end">
                <span className="text-[10px] font-mono text-neon-cyan mb-1">{d.xp > 0 ? d.xp : ""}</span>
                <div className="w-full rounded-t bg-primary/30 border border-primary/40 relative overflow-hidden" style={{ height: "100%" }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/10" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground mt-1">{d.day}</span>
              </motion.div>
            ))
          )}
        </div>
      </HudCard>

      <div className="grid md:grid-cols-2 gap-4">
        <HudCard title="TOP SKILLS BY XP" icon={<TrendingUp size={14} />}>
          <div className="space-y-2">
            {stats.topSkills.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No skills created yet.</p>
            ) : (
              stats.topSkills.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-sm font-body">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono text-neon-cyan">{s.xp.toLocaleString()} XP</span>
                </div>
              ))
            )}
          </div>
        </HudCard>

        <HudCard title="ACHIEVEMENTS" icon={<Target size={14} />}>
          <div className="space-y-2">
            {stats.achievements.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No achievements yet.</p>
            ) : (
              stats.achievements.map((a) => (
                <div key={a.name} className={`flex items-center gap-3 py-1 ${!a.unlocked ? "opacity-40" : ""}`}>
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                    a.unlocked ? "bg-neon-amber/20 text-neon-amber" : "bg-muted text-muted-foreground"
                  }`}>★</div>
                  <div>
                    <p className="text-sm font-body">{a.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{a.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </HudCard>
      </div>
    </div>
  );
}
