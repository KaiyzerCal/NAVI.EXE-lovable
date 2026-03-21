import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Shield, Sword, Brain, Heart, Zap, Star } from "lucide-react";

export default function CharacterPage() {
  const stats = [
    { name: "STR", value: 14, icon: <Sword size={12} /> },
    { name: "INT", value: 22, icon: <Brain size={12} /> },
    { name: "VIT", value: 16, icon: <Heart size={12} /> },
    { name: "AGI", value: 18, icon: <Zap size={12} /> },
    { name: "RES", value: 20, icon: <Shield size={12} /> },
  ];

  const skills = [
    { name: "Focus", level: 8, maxLevel: 10, variant: "cyan" as const },
    { name: "Coding", level: 15, maxLevel: 20, variant: "purple" as const },
    { name: "Fitness", level: 6, maxLevel: 10, variant: "green" as const },
    { name: "Reading", level: 12, maxLevel: 15, variant: "amber" as const },
    { name: "Meditation", level: 4, maxLevel: 10, variant: "cyan" as const },
  ];

  return (
    <div>
      <PageHeader title="CHARACTER" subtitle="// OPERATOR PROFILE" />

      {/* Character Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-primary/20 rounded p-6 mb-6 border-glow"
      >
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded bg-primary/10 border-2 border-primary/30 flex items-center justify-center glow-cyan">
            <Star className="text-primary" size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-lg text-primary font-bold">OPERATOR</h2>
              <span className="text-xs font-mono bg-neon-purple/10 text-neon-purple px-2 py-0.5 rounded">TECHNOMANCER</span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mb-3">LEVEL 12 // 2,450 / 3,000 XP</p>
            <ProgressBar value={2450} max={3000} variant="cyan" size="md" showValue={false} />
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Stats */}
        <HudCard title="BASE STATS" icon={<Shield size={14} />} glow>
          <div className="space-y-3">
            {stats.map((stat) => (
              <div key={stat.name} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-muted-foreground">{stat.name}</span>
                    <span className="font-display text-sm font-bold text-foreground">{stat.value}</span>
                  </div>
                  <ProgressBar value={stat.value} max={30} variant="cyan" showValue={false} />
                </div>
              </div>
            ))}
          </div>
        </HudCard>

        {/* Skills */}
        <HudCard title="SKILL TREE" icon={<Star size={14} />} glow>
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-body">{skill.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">LVL {skill.level}</span>
                </div>
                <ProgressBar value={skill.level} max={skill.maxLevel} variant={skill.variant} showValue={false} />
              </div>
            ))}
          </div>
        </HudCard>
      </div>
    </div>
  );
}
