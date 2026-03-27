import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Flame, BookOpen, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useQuests } from "@/hooks/useQuests";
import { useJournal } from "@/hooks/useJournal";

// Build last-7-days XP bars from quest completion timestamps
function buildWeeklyData(quests: ReturnType<typeof useQuests>["quests"]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { day: days[d.getDay()], date: d.toDateString(), xp: 0, quests: 0 };
  });

  for (const q of quests) {
    if (!q.completed) continue;
    const updated = new Date(q.updated_at).toDateString();
    const slot = week.find((w) => w.date === updated);
    if (slot) { slot.xp += q.xp_reward; slot.quests += 1; }
  }
  return week;
}

export default function StatsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { quests, loading: questsLoading, stats } = useQuests();
  const { entries, loading: journalLoading } = useJournal();

  const loading = profileLoading || questsLoading || journalLoading;

  const weeklyData = buildWeeklyData(quests);
  const maxXp = Math.max(...weeklyData.map((d) => d.xp), 1);

  // Achievements derived from real data
  const achievements = [
    { name: "First Quest",    desc: "Complete your first quest",  unlocked: stats.completed >= 1 },
    { name: "Week Warrior",   desc: "Complete 7 quests",          unlocked: stats.completed >= 7 },
    { name: "Century",        desc: "Complete 100 quests",        unlocked: stats.completed >= 100 },
    { name: "Chronicler",     desc: "Write 10 journal entries",   unlocked: entries.length >= 10 },
    { name: "Grandmaster",    desc: "Reach Navi level 20",        unlocked: profile.navi_level >= 20 },
    { name: "XP Hunter",      desc: "Earn 10,000 total XP",       unlocked: profile.xp_total >= 10000 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="ml-3 text-xs font-mono text-muted-foreground">Loading stats...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="STATS" subtitle="// PERFORMANCE METRICS" />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL XP",      value: profile.xp_total.toLocaleString(), icon: <TrendingUp size={16} />, color: "text-neon-cyan" },
          { label: "QUESTS DONE",   value: stats.completed,                   icon: <Target size={16} />,    color: "text-neon-green" },
          { label: "JOURNAL ENTRIES", value: entries.length,                  icon: <BookOpen size={16} />,  color: "text-neon-purple" },
          { label: "BEST STREAK",   value: `${profile.longest_streak}d`,      icon: <Flame size={16} />,     color: "text-neon-amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      {/* Weekly XP chart — real data */}
      <HudCard title="XP THIS WEEK (BY QUEST COMPLETIONS)" icon={<BarChart3 size={14} />} glow className="mb-6">
        <div className="flex items-end gap-2 h-40">
          {weeklyData.map((d, i) => (
            <motion.div
              key={d.day}
              initial={{ height: 0 }}
              animate={{ height: `${(d.xp / maxXp) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-end"
            >
              {d.xp > 0 && <span className="text-[10px] font-mono text-neon-cyan mb-1">{d.xp}</span>}
              <div className="w-full rounded-t bg-primary/30 border border-primary/40 relative overflow-hidden" style={{ height: "100%", minHeight: d.xp > 0 ? "4px" : "2px" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/10" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground mt-1">{d.day}</span>
            </motion.div>
          ))}
        </div>
        {weeklyData.every((d) => d.xp === 0) && (
          <p className="text-[10px] font-mono text-muted-foreground text-center mt-3">Complete quests to see XP data here</p>
        )}
      </HudCard>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Quest breakdown */}
        <HudCard title="QUEST BREAKDOWN" icon={<Target size={14} />}>
          <div className="space-y-2">
            {(["Main","Side","Weekly","Daily","Minor","Epic"] as const).map((type) => {
              const count = quests.filter((q) => q.type === type).length;
              const done  = quests.filter((q) => q.type === type && q.completed).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-body">{type}</span>
                  <span className="text-xs font-mono text-muted-foreground">{done}/{count} complete</span>
                </div>
              );
            })}
            {quests.length === 0 && <p className="text-xs font-mono text-muted-foreground">No quests yet</p>}
          </div>
        </HudCard>

        {/* Achievements — all derived from real data */}
        <HudCard title="ACHIEVEMENTS" icon={<TrendingUp size={14} />}>
          <div className="space-y-2">
            {achievements.map((a) => (
              <div key={a.name} className={`flex items-center gap-3 py-1 ${!a.unlocked ? "opacity-40" : ""}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${a.unlocked ? "bg-neon-amber/20 text-neon-amber" : "bg-muted text-muted-foreground"}`}>★</div>
                <div>
                  <p className="text-sm font-body">{a.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </HudCard>
      </div>
    </div>
  );
}
