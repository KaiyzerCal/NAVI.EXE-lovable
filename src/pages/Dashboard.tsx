import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Swords, Star, BookOpen, Activity, TrendingUp, Zap } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="DASHBOARD" subtitle="// SYSTEM OVERVIEW" />

      {/* Status Banner */}
      <motion.div {...fadeIn} className="bg-card border border-primary/20 rounded p-4 mb-6 border-glow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Zap className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm text-primary font-bold">OPERATOR</span>
              <span className="text-xs font-mono text-muted-foreground">// LVL 12</span>
            </div>
            <ProgressBar value={2450} max={3000} variant="cyan" label="XP TO NEXT LEVEL" size="md" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display text-2xl text-primary font-bold text-glow-cyan">12</p>
            <p className="text-[10px] font-mono text-muted-foreground">LEVEL</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "ACTIVE QUESTS", value: "7", icon: <Swords size={16} />, color: "text-neon-amber" },
          { label: "SKILLS UNLOCKED", value: "23", icon: <Star size={16} />, color: "text-neon-purple" },
          { label: "JOURNAL ENTRIES", value: "48", icon: <BookOpen size={16} />, color: "text-neon-green" },
          { label: "STREAK", value: "14d", icon: <Activity size={16} />, color: "text-neon-cyan" },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <HudCard title="ACTIVE QUESTS" icon={<Swords size={14} />} glow>
            <div className="space-y-3">
              {[
                { name: "Morning Routine Protocol", progress: 5, total: 7, type: "Daily" },
                { name: "Read 30 Pages", progress: 22, total: 30, type: "Daily" },
                { name: "Complete Side Project MVP", progress: 3, total: 10, type: "Epic" },
                { name: "Meditate 10 min", progress: 1, total: 1, type: "Daily" },
              ].map((quest) => (
                <div key={quest.name} className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    quest.type === "Epic" ? "bg-neon-purple/10 text-neon-purple" : "bg-neon-amber/10 text-neon-amber"
                  }`}>
                    {quest.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-body">{quest.name}</p>
                    <ProgressBar 
                      value={quest.progress} 
                      max={quest.total} 
                      variant={quest.progress === quest.total ? "green" : "amber"} 
                      showValue={false} 
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {quest.progress}/{quest.total}
                  </span>
                </div>
              ))}
            </div>
          </HudCard>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <HudCard title="RECENT ACTIVITY" icon={<TrendingUp size={14} />} glow>
            <div className="space-y-3">
              {[
                { action: "Completed quest: Morning Routine", time: "2h ago", xp: "+50 XP" },
                { action: "New journal entry: Reflection", time: "5h ago", xp: "+10 XP" },
                { action: "Skill leveled up: Focus", time: "1d ago", xp: "+100 XP" },
                { action: "Streak bonus unlocked!", time: "1d ago", xp: "+200 XP" },
                { action: "New quest started: Build MVP", time: "2d ago", xp: "" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body truncate">{item.action}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{item.time}</p>
                  </div>
                  {item.xp && (
                    <span className="text-xs font-mono text-neon-green shrink-0">{item.xp}</span>
                  )}
                </div>
              ))}
            </div>
          </HudCard>
        </motion.div>
      </div>
    </div>
  );
}
