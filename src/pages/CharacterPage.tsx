import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import MbtiQuiz, { MBTI_CLASS_MAP } from "@/components/MbtiQuiz";
import { motion } from "framer-motion";
import { Shield, Sword, Brain, Heart, Zap, Star, Eye } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useOwner } from "@/hooks/useOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tabs = ["PROFILE", "SKILLS"] as const;

const baseStats = [
  { name: "STR", value: 14, icon: <Sword size={12} /> },
  { name: "INT", value: 22, icon: <Brain size={12} /> },
  { name: "VIT", value: 16, icon: <Heart size={12} /> },
  { name: "AGI", value: 18, icon: <Zap size={12} /> },
  { name: "RES", value: 20, icon: <Shield size={12} /> },
];

const operatorSkills = [
  { name: "Focus", level: 8, max: 10, variant: "cyan" as const, desc: "Sustained concentration ability" },
  { name: "Coding", level: 15, max: 20, variant: "purple" as const, desc: "Programming & development" },
  { name: "Fitness", level: 6, max: 10, variant: "green" as const, desc: "Physical training consistency" },
  { name: "Reading", level: 12, max: 15, variant: "amber" as const, desc: "Knowledge absorption rate" },
  { name: "Meditation", level: 4, max: 10, variant: "cyan" as const, desc: "Mental clarity & calm" },
  { name: "Discipline", level: 9, max: 15, variant: "purple" as const, desc: "Routine adherence" },
];

const naviSkills = [
  { name: "Data Scan", level: 5, max: 10, variant: "cyan" as const, desc: "Analyze quest parameters" },
  { name: "Sync Pulse", level: 3, max: 8, variant: "purple" as const, desc: "Operator focus amplifier" },
  { name: "Firewall", level: 7, max: 10, variant: "green" as const, desc: "Distraction resistance shield" },
  { name: "Cache Burst", level: 2, max: 6, variant: "amber" as const, desc: "Rapid memory recall" },
  { name: "Overclock", level: 1, max: 10, variant: "cyan" as const, desc: "Temporary stat multiplier" },
];

export default function CharacterPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("PROFILE");
  const { profile, updateProfile } = useProfile();
  const isOwner = useOwner();
  const [editMode, setEditMode] = useState(false);

  const characterClass = profile.character_class || "Unknown";
  const mbtiType = profile.mbti_type || null;
  const classInfo = mbtiType ? MBTI_CLASS_MAP[mbtiType] : null;

  const handleQuizComplete = (mbti: string, charClass: string) => {
    updateProfile({ mbti_type: mbti, character_class: charClass });
  };

  // Show quiz if no class assigned yet
  if (!mbtiType && !profile.character_class) {
    return (
      <div>
        <PageHeader title="CHARACTER" subtitle="// OPERATOR CALIBRATION REQUIRED" />
        <MbtiQuiz onComplete={handleQuizComplete} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="CHARACTER" subtitle="// OPERATOR PROFILE">
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)} className="text-xs font-mono">
            <Eye size={12} className="mr-1" /> {editMode ? "VIEW MODE" : "EDIT MODE"}
          </Button>
        )}
      </PageHeader>

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
              <h2 className="font-display text-lg text-primary font-bold">
                {profile.display_name || "OPERATOR"}
              </h2>
              <span className="text-xs font-mono bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                {characterClass.toUpperCase()}
              </span>
            </div>
            {mbtiType && (
              <p className="text-[10px] font-mono text-muted-foreground mb-1">
                MBTI: {mbtiType} // {classInfo?.desc || ""}
              </p>
            )}
            <p className="text-xs font-mono text-muted-foreground mb-3">LEVEL 12 // 2,450 / 3,000 XP</p>
            <ProgressBar value={2450} max={3000} variant="cyan" size="md" showValue={false} />
            {editMode && (
              <div className="mt-3 flex gap-2 items-center">
                <Input
                  className="h-7 text-xs w-40"
                  placeholder="Character class..."
                  defaultValue={characterClass}
                  onBlur={(e) => updateProfile({ character_class: e.target.value })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[10px] font-mono"
                  onClick={() => updateProfile({ mbti_type: null, character_class: null })}
                >
                  RETAKE QUIZ
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex mb-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "PROFILE" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <HudCard title="BASE STATS" icon={<Shield size={14} />} glow>
            <div className="space-y-3">
              {baseStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">{stat.icon}</div>
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

          <HudCard title="EQUIPMENT" icon={<Star size={14} />} glow>
            <div className="space-y-2">
              {[
                { slot: "TITLE", item: characterClass, rarity: "RARE" },
                { slot: "BADGE", item: "Early Adopter", rarity: "EPIC" },
                { slot: "PERK", item: "Night Owl (+10% XP after 10PM)", rarity: "UNCOMMON" },
              ].map((eq) => (
                <div key={eq.slot} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground">{eq.slot}</p>
                    <p className="text-sm font-body">{eq.item}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    eq.rarity === "EPIC" ? "bg-secondary/10 text-secondary" :
                    eq.rarity === "RARE" ? "bg-primary/10 text-primary" :
                    "bg-neon-green/10 text-neon-green"
                  }`}>{eq.rarity}</span>
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <HudCard title="OPERATOR SKILLS" icon={<Zap size={14} />} glow>
            <div className="space-y-3">
              {operatorSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-body">{skill.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/{skill.max}</span>
                  </div>
                  <ProgressBar value={skill.level} max={skill.max} variant={skill.variant} showValue={false} />
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.desc}</p>
                </div>
              ))}
            </div>
          </HudCard>

          <HudCard title="NAVI SKILLS" icon={<Brain size={14} />} glow>
            <div className="space-y-3">
              {naviSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-body">{skill.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/{skill.max}</span>
                  </div>
                  <ProgressBar value={skill.level} max={skill.max} variant={skill.variant} showValue={false} />
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.desc}</p>
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      )}
    </div>
  );
}
