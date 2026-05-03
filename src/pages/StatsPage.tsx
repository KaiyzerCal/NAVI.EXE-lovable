import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Flame, BookOpen, Loader2, Trophy, Clock, Calendar } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useEffect, useMemo } from "react";

// ── Data builders ──────────────────────────────────────────────────────────

function build30DayData(quests: { completed: boolean; updated_at: string; xp_reward: number }[]) {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toDateString();
    const dayQuests = quests.filter((q) => q.completed && new Date(q.updated_at).toDateString() === dateStr);
    return {
      date: d,
      label: d.getDate().toString(),
      xp: dayQuests.reduce((s, q) => s + q.xp_reward, 0),
      count: dayQuests.length,
    };
  });
}

function buildHeatmap(
  quests: { completed: boolean; updated_at: string }[],
  entries: { created_at: string }[]
) {
  const now = new Date();
  return Array.from({ length: 91 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (90 - i));
    const dateStr = d.toDateString();
    const questsOnDay = quests.filter((q) => q.completed && new Date(q.updated_at).toDateString() === dateStr).length;
    const entriesOnDay = entries.filter((e) => new Date(e.created_at).toDateString() === dateStr).length;
    const total = questsOnDay + entriesOnDay;
    return { date: d, total, level: total === 0 ? 0 : total <= 1 ? 1 : total <= 3 ? 2 : total <= 5 ? 3 : 4 };
  });
}

function buildTimeOfDay(quests: { completed: boolean; updated_at: string }[]) {
  const buckets = [
    { label: "00–05", range: [0, 5], count: 0 },
    { label: "06–09", range: [6, 9], count: 0 },
    { label: "10–12", range: [10, 12], count: 0 },
    { label: "13–17", range: [13, 17], count: 0 },
    { label: "18–21", range: [18, 21], count: 0 },
    { label: "22–23", range: [22, 23], count: 0 },
  ];
  for (const q of quests) {
    if (!q.completed) continue;
    const h = new Date(q.updated_at).getHours();
    const b = buckets.find((b) => h >= b.range[0] && h <= b.range[1]);
    if (b) b.count++;
  }
  return buckets;
}

const HEATMAP_COLORS = [
  "bg-muted/20",
  "bg-primary/20",
  "bg-primary/45",
  "bg-primary/70",
  "bg-primary",
];

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-muted-foreground",
  RARE: "text-primary",
  EPIC: "text-secondary",
  LEGENDARY: "text-accent",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function StatsPage() {
  const {
    profile, profileLoading, quests, questsLoading, questStats: stats,
    entries, journalLoading, achievements, achievementsLoading: achLoading,
    checkAchievements, achievementStats: achStats,
  } = useAppData();

  const loading = profileLoading || questsLoading || journalLoading || achLoading;

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

  const data30 = useMemo(() => build30DayData(quests), [quests]);
  const heatmap = useMemo(() => buildHeatmap(quests, entries), [quests, entries]);
  const timeOfDay = useMemo(() => buildTimeOfDay(quests), [quests]);

  const max30Xp = Math.max(...data30.map((d) => d.xp), 1);
  const maxTod = Math.max(...timeOfDay.map((b) => b.count), 1);

  const xpByType = useMemo(() => {
    const types = ["Main", "Side", "Weekly", "Daily", "Minor", "Epic"] as const;
    return types.map((type) => ({
      type,
      xp: quests.filter((q) => q.type === type && q.completed).reduce((s, q) => s + q.xp_reward, 0),
      done: quests.filter((q) => q.type === type && q.completed).length,
      total: quests.filter((q) => q.type === type).length,
    })).filter((t) => t.total > 0);
  }, [quests]);

  const maxTypeXp = Math.max(...xpByType.map((t) => t.xp), 1);

  // Heatmap: group into weeks of 7
  const heatmapWeeks = useMemo(() => {
    const weeks: typeof heatmap[] = [];
    for (let i = 0; i < heatmap.length; i += 7) weeks.push(heatmap.slice(i, i + 7));
    return weeks;
  }, [heatmap]);

  // Month labels for heatmap
  const monthLabels = useMemo(() => {
    const seen = new Set<string>();
    return heatmapWeeks.map((week) => {
      const month = week[0]?.date.toLocaleString("default", { month: "short" });
      if (seen.has(month)) return "";
      seen.add(month);
      return month;
    });
  }, [heatmapWeeks]);

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

      {/* Overview tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL XP",        value: profile.xp_total.toLocaleString(), icon: <TrendingUp size={16} />, color: "text-neon-cyan" },
          { label: "QUESTS DONE",     value: stats.completed,                   icon: <Target size={16} />,     color: "text-neon-green" },
          { label: "JOURNAL ENTRIES", value: entries.length,                    icon: <BookOpen size={16} />,   color: "text-neon-purple" },
          { label: "BEST STREAK",     value: `${profile.longest_streak}d`,      icon: <Flame size={16} />,      color: "text-neon-amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      {/* 30-day XP trend */}
      <HudCard title="XP — LAST 30 DAYS" icon={<BarChart3 size={14} />} glow className="mb-5">
        <div className="flex items-end gap-0.5 h-28">
          {data30.map((d, i) => (
            <motion.div
              key={i}
              className="flex-1 flex flex-col items-center justify-end group relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
            >
              {/* Tooltip on hover */}
              {d.xp > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-card border border-border rounded px-1.5 py-1 text-[9px] font-mono whitespace-nowrap shadow">
                    <p className="text-primary">{d.xp} XP</p>
                    <p className="text-muted-foreground">{d.count} quest{d.count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              )}
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max((d.xp / max30Xp) * 100, d.xp > 0 ? 4 : 1)}%`,
                  background: d.xp > 0
                    ? `linear-gradient(to top, rgba(56,189,248,0.6), rgba(56,189,248,0.2))`
                    : "rgba(255,255,255,0.04)",
                  border: d.xp > 0 ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(255,255,255,0.05)",
                }}
              />
              {/* Date label every 5 days */}
              {(i === 0 || i === 9 || i === 19 || i === 29) && (
                <span className="text-[8px] font-mono text-muted-foreground/60 mt-1 absolute -bottom-4">
                  {d.date.getDate()}/{d.date.getMonth() + 1}
                </span>
              )}
            </motion.div>
          ))}
        </div>
        <div className="mt-5 flex justify-between text-[9px] font-mono text-muted-foreground/40">
          <span>30 days ago</span>
          <span>today</span>
        </div>
        {data30.every((d) => d.xp === 0) && (
          <p className="text-[10px] font-mono text-muted-foreground text-center mt-2">
            Complete quests to populate this chart
          </p>
        )}
      </HudCard>

      {/* Activity heatmap */}
      <HudCard title="ACTIVITY — LAST 90 DAYS" icon={<Calendar size={14} />} className="mb-5">
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                <span className="text-[8px] font-mono text-muted-foreground/50 h-3">{monthLabels[wi]}</span>
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${day.date.toLocaleDateString()} — ${day.total} action${day.total !== 1 ? "s" : ""}`}
                    className={`w-3 h-3 rounded-sm ${HEATMAP_COLORS[day.level]} transition-colors`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[8px] font-mono text-muted-foreground/50">less</span>
            {HEATMAP_COLORS.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[8px] font-mono text-muted-foreground/50">more</span>
          </div>
        </div>
      </HudCard>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Time of day */}
        <HudCard title="ACTIVE HOURS" icon={<Clock size={14} />}>
          <div className="space-y-2">
            {timeOfDay.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-12 shrink-0">{bucket.label}</span>
                <div className="flex-1 h-3 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary/50 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(bucket.count / maxTod) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">{bucket.count}</span>
              </div>
            ))}
            {quests.filter((q) => q.completed).length === 0 && (
              <p className="text-[10px] font-mono text-muted-foreground">No activity data yet</p>
            )}
          </div>
          {(() => {
            const peak = timeOfDay.reduce((best, b) => b.count > best.count ? b : best, timeOfDay[0]);
            if (peak.count === 0) return null;
            const labels: Record<string, string> = {
              "00–05": "you work when the world sleeps",
              "06–09": "you hit the ground running",
              "10–12": "peak morning operator",
              "13–17": "afternoon focus blocks",
              "18–21": "evening grinder",
              "22–23": "late-night execution mode",
            };
            return (
              <p className="text-[10px] font-mono text-primary/70 mt-3 border-t border-border pt-2">
                // {labels[peak.label] ?? "steady across the day"}
              </p>
            );
          })()}
        </HudCard>

        {/* XP by quest type */}
        <HudCard title="XP BY TYPE" icon={<Target size={14} />}>
          <div className="space-y-2.5">
            {xpByType.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No completed quests yet</p>
            ) : (
              xpByType
                .sort((a, b) => b.xp - a.xp)
                .map((t) => (
                  <div key={t.type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono text-foreground">{t.type}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {t.xp.toLocaleString()} XP · {t.done}/{t.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(t.xp / maxTypeXp) * 100}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </HudCard>
      </div>

      {/* Achievements */}
      <HudCard title={`ACHIEVEMENTS (${achStats.unlocked}/${achStats.total})`} icon={<Trophy size={14} />}>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {achievements.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground">No achievements yet</p>
          ) : (
            achievements.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 py-1 ${!a.unlocked ? "opacity-35" : ""}`}>
                <div className={`w-7 h-7 rounded flex items-center justify-center text-sm shrink-0 ${a.unlocked ? "bg-neon-amber/20" : "bg-muted"}`}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body ${RARITY_COLORS[a.rarity] ?? "text-foreground"}`}>{a.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate">{a.description}</p>
                  {a.unlocked && a.unlocked_at && (
                    <p className="text-[9px] font-mono text-neon-green">{new Date(a.unlocked_at).toLocaleDateString()}</p>
                  )}
                </div>
                <span className={`text-[9px] font-mono shrink-0 ${RARITY_COLORS[a.rarity] ?? ""}`}>{a.rarity}</span>
              </div>
            ))
          )}
        </div>
      </HudCard>
    </div>
  );
}
