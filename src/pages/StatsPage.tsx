import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Flame, BookOpen, Loader2, Trophy } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useEffect } from "react";

function buildWeeklyData(quests: ReturnType<typeof useQuests>["quests"]) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return { day: days[d.getDay()], date: d.toDateString(), xp: 0, count: 0 };
  });
  for (const q of quests) {
    if (!q.completed) continue;
    const updated = new Date(q.updated_at).toDateString();
    const slot = week.find((w) => w.date === updated);
    if (slot) { slot.xp += q.xp_reward; slot.count += 1; }
  }
  return week;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-primary",
  EPIC: "text-secondary",
  LEGENDARY: "text-accent",
};

export default function StatsPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { quests, loading: questsLoading, stats } = useQuests();
  const { entries, loading: journalLoading } = useJournal();
  const { achievements, loading: achLoading, checkAchievements, stats: achStats } = useAchievements();

  const loading = profileLoading || questsLoading || journalLoading || achLoading;

  // Auto-check achievements whenever data loads
  useEffect(() => {
    if (loading) return;
    checkAchievements({
      questsCompleted: stats.completed,
      journalEntries: entries.length,
      currentStreak: profile.current_streak,
      xpTotal: profile.xp_total,
      operatorLevel: (profile as any).operator_level ?? 1,
      naviLevel: profile.navi_level,
      hasMbti: !!profile.mbti_type,
      hasSubClass: !!(profile as any).sub_class,
      hasMainQuestCompleted: quests.some((q) => q.type === "Main" && q.completed),
      sideQuestsCompleted: quests.filter((q) => q.type === "Side" && q.completed).length,
    });
  }, [loading]);

  const weeklyData = buildWeeklyData(quests);
  const maxXp = Math.max(...weeklyData.map((d) => d.xp), 1);

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

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL XP",       value: profile.xp_total.toLocaleString(), icon: <TrendingUp size={16} />, color: "text-neon-cyan" },
          { label: "QUESTS DONE",    value: stats.completed,                   icon: <Target size={16} />,     color: "text-neon-green" },
          { label: "JOURNAL ENTRIES",value: entries.length,                    icon: <BookOpen size={16} />,   color: "text-neon-purple" },
          { label: "BEST STREAK",    value: `${profile.longest_streak}d`,      icon: <Flame size={16} />,      color: "text-neon-amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      {/* Weekly XP chart */}
      <HudCard title="XP THIS WEEK" icon={<BarChart3 size={14} />} glow className="mb-6">
        <div className="flex items-end gap-2 h-32">
          {weeklyData.map((d, i) => (
            <motion.div key={d.day} initial={{ height: 0 }} animate={{ height: `${(d.xp / maxXp) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.4 }} className="flex-1 flex flex-col items-center justify-end">
              {d.xp > 0 && <span className="text-[9px] font-mono text-neon-cyan mb-1">{d.xp}</span>}
              <div className="w-full rounded-t bg-primary/30 border border-primary/40 relative overflow-hidden" style={{ height: "100%", minHeight: d.xp > 0 ? "4px" : "2px" }}>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/10" />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground mt-1">{d.day}</span>
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
              const total = quests.filter((q) => q.type === type).length;
              const done = quests.filter((q) => q.type === type && q.completed).length;
              if (total === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-body">{type}</span>
                  <span className="text-xs font-mono text-muted-foreground">{done}/{total}</span>
                </div>
              );
            })}
            {quests.length === 0 && <p className="text-xs font-mono text-muted-foreground">No quests yet</p>}
          </div>
        </HudCard>

        {/* Achievements — ALL from DB, real unlocked status */}
        <HudCard title={`ACHIEVEMENTS (${achStats.unlocked}/${achStats.total})`} icon={<Trophy size={14} />}>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {achievements.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">Loading achievements...</p>
            ) : (
              achievements.map((a) => (
                <div key={a.id} className={`flex items-center gap-3 py-1 ${!a.unlocked ? "opacity-35" : ""}`}>
                  <div className={`w-7 h-7 rounded flex items-center justify-center text-sm shrink-0 ${a.unlocked ? "bg-neon-amber/20" : "bg-muted"}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-body ${RARITY_COLORS[a.rarity]}`}>{a.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{a.description}</p>
                    {a.unlocked && a.unlocked_at && (
                      <p className="text-[9px] font-mono text-neon-green">{new Date(a.unlocked_at).toLocaleDateString()}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-mono shrink-0 ${RARITY_COLORS[a.rarity]}`}>{a.rarity}</span>
                </div>
              ))
            )}
          </div>
        </HudCard>
      </div>
    </div>
  );
}
