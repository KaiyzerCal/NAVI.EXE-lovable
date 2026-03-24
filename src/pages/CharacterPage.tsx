import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import MbtiQuiz, { MBTI_CLASS_MAP } from "@/components/MbtiQuiz";
import { motion } from "framer-motion";
import { Shield, Sword, Brain, Heart, Zap, Star, Eye, Plus, Trash2, Edit2, Trophy, Save, X } from "lucide-react";
import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useOwner } from "@/hooks/useOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tabs = ["PROFILE", "SKILLS", "ACHIEVEMENTS"] as const;

interface Stat { name: string; value: number; icon: React.ReactNode; }
interface Skill { id: string; name: string; level: number; max: number; variant: "cyan" | "purple" | "green" | "amber"; desc: string; }
interface Achievement { id: string; name: string; desc: string; unlocked: boolean; xp: number; }

const defaultStats: Stat[] = [
  { name: "STR", value: 14, icon: <Sword size={12} /> },
  { name: "INT", value: 22, icon: <Brain size={12} /> },
  { name: "VIT", value: 16, icon: <Heart size={12} /> },
  { name: "AGI", value: 18, icon: <Zap size={12} /> },
  { name: "RES", value: 20, icon: <Shield size={12} /> },
];

const defaultOperatorSkills: Skill[] = [
  { id: "1", name: "Focus", level: 8, max: 10, variant: "cyan", desc: "Sustained concentration ability" },
  { id: "2", name: "Coding", level: 15, max: 20, variant: "purple", desc: "Programming & development" },
  { id: "3", name: "Fitness", level: 6, max: 10, variant: "green", desc: "Physical training consistency" },
  { id: "4", name: "Reading", level: 12, max: 15, variant: "amber", desc: "Knowledge absorption rate" },
  { id: "5", name: "Meditation", level: 4, max: 10, variant: "cyan", desc: "Mental clarity & calm" },
  { id: "6", name: "Discipline", level: 9, max: 15, variant: "purple", desc: "Routine adherence" },
];

const defaultAchievements: Achievement[] = [
  { id: "1", name: "First Steps", desc: "Complete your first quest", unlocked: true, xp: 50 },
  { id: "2", name: "Week Warrior", desc: "Maintain a 7-day streak", unlocked: true, xp: 100 },
  { id: "3", name: "Centurion", desc: "Complete 100 quests", unlocked: false, xp: 500 },
  { id: "4", name: "Knowledge Seeker", desc: "Read 1000 pages total", unlocked: false, xp: 300 },
  { id: "5", name: "Iron Will", desc: "30-day streak", unlocked: false, xp: 1000 },
  { id: "6", name: "Full Sync", desc: "Reach 100% bond with your Navi", unlocked: false, xp: 2000 },
  { id: "7", name: "Epic Slayer", desc: "Complete an Epic quest", unlocked: true, xp: 250 },
  { id: "8", name: "Journal Master", desc: "Write 50 journal entries", unlocked: false, xp: 200 },
];

export default function CharacterPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("PROFILE");
  const { profile, updateProfile } = useProfile();
  const isOwner = useOwner();
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState<Stat[]>(defaultStats);
  const [operatorSkills, setOperatorSkills] = useState<Skill[]>(defaultOperatorSkills);
  const [achievements, setAchievements] = useState<Achievement[]>(defaultAchievements);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", desc: "", max: 10 });
  const [newAchievement, setNewAchievement] = useState({ name: "", desc: "", xp: 100 });

  const characterClass = profile.character_class || "Unknown";
  const mbtiType = profile.mbti_type || null;
  const classInfo = mbtiType ? MBTI_CLASS_MAP[mbtiType] : null;

  const handleQuizComplete = (mbti: string, charClass: string) => {
    updateProfile({ mbti_type: mbti, character_class: charClass });
  };

  if (!mbtiType && !profile.character_class) {
    return (
      <div>
        <PageHeader title="CHARACTER" subtitle="// OPERATOR CALIBRATION REQUIRED" />
        <MbtiQuiz onComplete={handleQuizComplete} />
      </div>
    );
  }

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    setOperatorSkills((prev) => [...prev, { id: Date.now().toString(), name: newSkill.name, level: 1, max: newSkill.max, variant: "cyan", desc: newSkill.desc }]);
    setNewSkill({ name: "", desc: "", max: 10 });
    setShowAddSkill(false);
  };

  const addAchievement = () => {
    if (!newAchievement.name.trim()) return;
    setAchievements((prev) => [...prev, { id: Date.now().toString(), ...newAchievement, unlocked: false }]);
    setNewAchievement({ name: "", desc: "", xp: 100 });
    setShowAddAchievement(false);
  };

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

      {activeTab === "PROFILE" && (
        <div className="grid md:grid-cols-2 gap-4">
          <HudCard title="BASE STATS" icon={<Shield size={14} />} glow>
            <div className="space-y-3">
              {stats.map((stat, idx) => (
                <div key={stat.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">{stat.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-muted-foreground">{stat.name}</span>
                      {editMode ? (
                        <Input
                          type="number"
                          className="h-6 w-16 text-xs text-right"
                          defaultValue={stat.value}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setStats((prev) => prev.map((s, i) => i === idx ? { ...s, value: Math.min(30, Math.max(0, v)) } : s));
                          }}
                        />
                      ) : (
                        <span className="font-display text-sm font-bold text-foreground">{stat.value}</span>
                      )}
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
      )}

      {activeTab === "SKILLS" && (
        <div>
          <HudCard title="OPERATOR SKILLS" icon={<Zap size={14} />} glow className="mb-4">
            {editMode && (
              <div className="mb-3">
                {showAddSkill ? (
                  <div className="bg-muted/20 border border-border rounded p-3 space-y-2 mb-2">
                    <Input placeholder="Skill name" value={newSkill.name} onChange={(e) => setNewSkill((p) => ({ ...p, name: e.target.value }))} className="h-7 text-xs" />
                    <Input placeholder="Description" value={newSkill.desc} onChange={(e) => setNewSkill((p) => ({ ...p, desc: e.target.value }))} className="h-7 text-xs" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addSkill} className="text-xs font-mono"><Save size={10} className="mr-1" /> ADD</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddSkill(false)} className="text-xs font-mono"><X size={10} /> CANCEL</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowAddSkill(true)} className="text-xs font-mono mb-2"><Plus size={10} className="mr-1" /> ADD SKILL</Button>
                )}
              </div>
            )}
            <div className="space-y-3">
              {operatorSkills.map((skill) => (
                <div key={skill.id}>
                  {editMode && editingSkillId === skill.id ? (
                    <div className="bg-muted/10 rounded p-2 space-y-1">
                      <Input className="h-6 text-xs" defaultValue={skill.name} onBlur={(e) => setOperatorSkills((prev) => prev.map((s) => s.id === skill.id ? { ...s, name: e.target.value } : s))} />
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] font-mono text-muted-foreground">LVL</span>
                        <Input type="number" className="h-6 text-xs w-16" defaultValue={skill.level} onBlur={(e) => setOperatorSkills((prev) => prev.map((s) => s.id === skill.id ? { ...s, level: parseInt(e.target.value) || 0 } : s))} />
                        <Button size="sm" variant="outline" className="text-[10px] h-6" onClick={() => setEditingSkillId(null)}>DONE</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-sm font-body">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/{skill.max}</span>
                          {editMode && (
                            <>
                              <button onClick={() => setEditingSkillId(skill.id)} className="text-muted-foreground hover:text-primary"><Edit2 size={10} /></button>
                              <button onClick={() => setOperatorSkills((prev) => prev.filter((s) => s.id !== skill.id))} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                            </>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={skill.level} max={skill.max} variant={skill.variant} showValue={false} />
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.desc}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      )}

      {activeTab === "ACHIEVEMENTS" && (
        <div>
          <HudCard title="ACHIEVEMENTS" icon={<Trophy size={14} />} glow>
            {editMode && (
              <div className="mb-3">
                {showAddAchievement ? (
                  <div className="bg-muted/20 border border-border rounded p-3 space-y-2 mb-2">
                    <Input placeholder="Achievement name" value={newAchievement.name} onChange={(e) => setNewAchievement((p) => ({ ...p, name: e.target.value }))} className="h-7 text-xs" />
                    <Input placeholder="Description" value={newAchievement.desc} onChange={(e) => setNewAchievement((p) => ({ ...p, desc: e.target.value }))} className="h-7 text-xs" />
                    <Input type="number" placeholder="XP" value={newAchievement.xp} onChange={(e) => setNewAchievement((p) => ({ ...p, xp: parseInt(e.target.value) || 0 }))} className="h-7 text-xs w-24" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addAchievement} className="text-xs font-mono"><Save size={10} className="mr-1" /> ADD</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddAchievement(false)} className="text-xs font-mono"><X size={10} /> CANCEL</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowAddAchievement(true)} className="text-xs font-mono mb-2"><Plus size={10} className="mr-1" /> ADD ACHIEVEMENT</Button>
                )}
              </div>
            )}
            <div className="space-y-2">
              {achievements.map((a) => (
                <div key={a.id} className={`flex items-center gap-3 p-3 rounded border transition-colors ${a.unlocked ? "border-neon-green/20 bg-neon-green/5" : "border-border bg-muted/10 opacity-50"}`}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${a.unlocked ? "bg-neon-green/20 text-neon-green" : "bg-muted text-muted-foreground"}`}>
                    <Trophy size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold">{a.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{a.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-neon-green">+{a.xp} XP</span>
                    {editMode && (
                      <>
                        <button onClick={() => setAchievements((prev) => prev.map((ac) => ac.id === a.id ? { ...ac, unlocked: !ac.unlocked } : ac))} className="text-[10px] font-mono text-muted-foreground hover:text-primary border border-border rounded px-1.5 py-0.5">
                          {a.unlocked ? "LOCK" : "UNLOCK"}
                        </button>
                        <button onClick={() => setAchievements((prev) => prev.filter((ac) => ac.id !== a.id))} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </HudCard>
        </div>
      )}
    </div>
  );
}
