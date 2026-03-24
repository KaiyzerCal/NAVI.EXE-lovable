import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Target, Clock, Flame } from "lucide-react";

export default function StatsPage() {
  const weeklyData = [
    { day: "Mon", quests: 5, xp: 120 },
    { day: "Tue", quests: 7, xp: 180 },
    { day: "Wed", quests: 4, xp: 90 },
    { day: "Thu", quests: 6, xp: 150 },
    { day: "Fri", quests: 8, xp: 220 },
    { day: "Sat", quests: 3, xp: 70 },
    { day: "Sun", quests: 5, xp: 130 },
  ];
  const maxXp = Math.max(...weeklyData.map((d) => d.xp));

  return (
    <div>
      <PageHeader title="STATS" subtitle="// PERFORMANCE METRICS" />

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "TOTAL XP", value: "12,450", icon: <TrendingUp size={16} />, color: "text-neon-cyan" },
          { label: "QUESTS DONE", value: "186", icon: <Target size={16} />, color: "text-neon-green" },
          { label: "HOURS LOGGED", value: "342", icon: <Clock size={16} />, color: "text-neon-purple" },
          { label: "BEST STREAK", value: "21d", icon: <Flame size={16} />, color: "text-neon-amber" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      {/* Weekly Chart */}
      <HudCard title="WEEKLY XP" icon={<BarChart3 size={14} />} glow className="mb-6">
        <div className="flex items-end gap-2 h-40">
          {weeklyData.map((d, i) => (
            <motion.div
              key={d.day}
              initial={{ height: 0 }}
              animate={{ height: `${(d.xp / maxXp) * 100}%` }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <span className="text-[10px] font-mono text-neon-cyan mb-1">{d.xp}</span>
              <div
                className="w-full rounded-t bg-primary/30 border border-primary/40 relative overflow-hidden"
                style={{ height: "100%" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/10" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground mt-1">{d.day}</span>
            </motion.div>
          ))}
        </div>
      </HudCard>

      <div className="grid md:grid-cols-2 gap-4">
        <HudCard title="TOP SKILLS BY XP" icon={<TrendingUp size={14} />}>
          <div className="space-y-2">
            {[
              { skill: "Coding", xp: 4200 },
              { skill: "Focus", xp: 2800 },
              { skill: "Reading", xp: 2100 },
              { skill: "Fitness", xp: 1800 },
              { skill: "Meditation", xp: 1550 },
            ].map((s, i) => (
              <div key={s.skill} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm font-body">{s.skill}</span>
                </div>
                <span className="text-xs font-mono text-neon-cyan">{s.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </HudCard>

        <HudCard title="ACHIEVEMENTS" icon={<Target size={14} />}>
          <div className="space-y-2">
            {[
              { name: "First Quest", desc: "Complete your first quest", unlocked: true },
              { name: "Week Warrior", desc: "7-day streak", unlocked: true },
              { name: "Century", desc: "Complete 100 quests", unlocked: true },
              { name: "Grandmaster", desc: "Reach level 100", unlocked: false },
              { name: "Polymath", desc: "Max out 5 skills", unlocked: false },
            ].map((a) => (
              <div key={a.name} className={`flex items-center gap-3 py-1 ${!a.unlocked ? "opacity-40" : ""}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                  a.unlocked ? "bg-neon-amber/20 text-neon-amber" : "bg-muted text-muted-foreground"
                }`}>
                  ★
                </div>
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
