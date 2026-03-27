import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import MbtiQuiz, { MBTI_CLASS_MAP, SUB_CLASSES } from "@/components/MbtiQuiz";
import { motion } from "framer-motion";
import { Shield, Sword, Brain, Heart, Zap, Star, Eye, Plus, Trash2, Pencil, Check, X, ScanEye, Clover, Coins } from "lucide-react";
import { useState, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useQuests } from "@/hooks/useQuests";
import { useJournal } from "@/hooks/useJournal";
import { useOperatorSkills, useEquipment, useActiveEffects } from "@/hooks/useSkillsAndEquipment";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const tabs = ["CHARACTER INFO", "SKILLS", "EQUIPMENT", "EFFECTS"] as const;

// XP per level (same formula as Dashboard/Stats)
const xpForLevel = (lv: number) => lv * 500;

// Compute base stats from real app data
function computeBaseStats(
  questsCompleted: number,
  journalEntries: number,
  currentStreak: number,
  xpTotal: number,
  naviLevel: number,
  operatorLevel: number,
  perception: number,
  luck: number,
) {
  const clamp = (v: number, min = 1, max = 100) => Math.max(min, Math.min(max, v));
  return [
    { name: "STR", label: "Strength",     value: clamp(Math.floor(questsCompleted / 3) + operatorLevel),        icon: <Sword size={12} />,  desc: "Quest completion power" },
    { name: "INT", label: "Intelligence", value: clamp(Math.floor(journalEntries * 2) + Math.floor(xpTotal / 500)), icon: <Brain size={12} />, desc: "Knowledge & reflection" },
    { name: "VIT", label: "Vitality",     value: clamp(currentStreak * 2 + operatorLevel),                       icon: <Heart size={12} />,  desc: "Consistency & endurance" },
    { name: "AGI", label: "Agility",      value: clamp(Math.floor(questsCompleted / 2) + naviLevel),             icon: <Zap size={12} />,    desc: "Speed of execution" },
    { name: "RES", label: "Resonance",    value: clamp(naviLevel * 2 + Math.floor(currentStreak / 2)),           icon: <Shield size={12} />, desc: "Navi bond strength" },
    { name: "PER", label: "Perception",   value: clamp(perception),                                              icon: <ScanEye size={12} />, desc: "Awareness & insight" },
    { name: "LCK", label: "Luck",         value: clamp(luck),                                                    icon: <Clover size={12} />,  desc: "Fortune & loot quality" },
  ];
}

const RARITY_COLORS: Record<string, string> = {
  COMMON: "text-muted-foreground bg-muted/40",
  UNCOMMON: "text-neon-green bg-neon-green/10",
  RARE: "text-primary bg-primary/10",
  EPIC: "text-secondary bg-secondary/10",
  LEGENDARY: "text-accent bg-accent/10",
};

export default function CharacterPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("CHARACTER INFO");
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { quests, stats: questStats } = useQuests();
  const { entries } = useJournal();
  const { skills, loading: skillsLoading, addSkill, updateSkill, deleteSkill } = useOperatorSkills();
  const { items, loading: equipLoading, addItem, equipItem, deleteItem } = useEquipment();
  const { effects, loading: effectsLoading, addEffect, removeEffect } = useActiveEffects();

  const [editMode, setEditMode] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemSlot, setNewItemSlot] = useState<"title"|"badge"|"perk"|"weapon"|"armor"|"accessory"|"inventory">("inventory");
  const [newItemRarity, setNewItemRarity] = useState<"COMMON"|"UNCOMMON"|"RARE"|"EPIC"|"LEGENDARY">("COMMON");
  const [newItemEffect, setNewItemEffect] = useState("");
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingSkillLevel, setEditingSkillLevel] = useState(1);

  const characterClass = profile.character_class || "Unknown";
  const mbtiType = profile.mbti_type || null;
  const classInfo = mbtiType ? MBTI_CLASS_MAP[mbtiType] : null;
  const operatorLevel = (profile as any).operator_level ?? 1;
  const operatorXp = (profile as any).operator_xp ?? profile.xp_total ?? 0;
  const xpToNext = xpForLevel(operatorLevel + 1);

  const baseStats = computeBaseStats(
    questStats.completed,
    entries.length,
    profile.current_streak,
    operatorXp,
    profile.navi_level,
    operatorLevel
  );

  const handleQuizComplete = (mbti: string, charClass: string) => {
    updateProfile({ mbti_type: mbti, character_class: charClass });
  };

  const handleAddSkill = useCallback(async () => {
    if (!newSkillName.trim()) return;
    await addSkill({ name: newSkillName, description: newSkillDesc });
    setNewSkillName(""); setNewSkillDesc("");
  }, [newSkillName, newSkillDesc, addSkill]);

  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) return;
    await addItem({ name: newItemName, slot: newItemSlot, rarity: newItemRarity, effect: newItemEffect || undefined, source: "manual" });
    setNewItemName(""); setNewItemEffect("");
  }, [newItemName, newItemSlot, newItemRarity, newItemEffect, addItem]);

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

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
      {/* ── Hero Banner ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-lg overflow-hidden border border-primary/20 mb-6"
        style={{ background: "linear-gradient(135deg, hsl(228 50% 8%) 0%, hsl(270 30% 12%) 50%, hsl(185 30% 10%) 100%)" }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.04)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none" />
        <div className="relative p-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-lg bg-primary/10 border-2 border-primary/40 flex items-center justify-center glow-cyan shrink-0">
            <Star className="text-primary" size={34} />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="font-display text-xl text-primary font-bold">{profile.display_name || "OPERATOR"}</h2>
              <span className="text-[10px] font-mono bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded">
                {characterClass.toUpperCase()}
              </span>
              {profile.subclass && (
                <span className="text-[10px] font-mono bg-neon-green/10 text-neon-green border border-neon-green/30 px-2 py-0.5 rounded">
                  {profile.subclass}
                </span>
              )}
            </div>
            {mbtiType && (
              <p className="text-[10px] font-mono text-muted-foreground mb-2">
                MBTI: <span className="text-primary">{mbtiType}</span> // {classInfo?.desc}
              </p>
            )}
            <p className="text-[10px] font-mono text-muted-foreground mb-2">
              OPERATOR LV{operatorLevel} · NAVI LV{profile.navi_level} · {operatorXp.toLocaleString()} XP
            </p>
            <ProgressBar value={operatorXp % xpForLevel(1) || operatorXp} max={xpToNext} variant="cyan" showValue={false} size="sm" />
            <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
              {operatorXp.toLocaleString()} / {xpToNext.toLocaleString()} XP TO LEVEL {operatorLevel + 1}
            </p>
        </div>
      </div>
      {/* Edit toggle — moved below hero to avoid blocking content on mobile */}
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)} className="text-[10px] font-mono">
          <Eye size={10} className="mr-1" /> {editMode ? "VIEW" : "EDIT"}
        </Button>
      </div>
        {/* Stat chips */}
        <div className="relative flex gap-2 px-6 pb-4 flex-wrap">
          {baseStats.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5 bg-card/60 border border-border rounded px-2 py-1" title={s.desc}>
              <span className="text-primary">{s.icon}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{s.name}</span>
              <span className="text-xs font-display font-bold text-foreground">{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex mb-5 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── CHARACTER INFO ───────────────────────────────────────────────── */}
      {activeTab === "CHARACTER INFO" && (
        <div className="space-y-4">
          {/* Base Stats */}
          <HudCard title="BASE STATS" icon={<Shield size={14} />} glow>
            <p className="text-[10px] font-mono text-muted-foreground mb-3">COMPUTED FROM YOUR REAL APP ACTIVITY</p>
            <div className="space-y-3">
              {baseStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary shrink-0">{stat.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-mono text-muted-foreground">{stat.name} — {stat.label}</span>
                      <span className="font-display text-sm font-bold text-foreground">{stat.value}</span>
                    </div>
                    <ProgressBar value={stat.value} max={100} variant="cyan" showValue={false} />
                    <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </HudCard>

          {/* Character Info (was "Class Info") */}
          <HudCard title="CHARACTER INFO" icon={<Star size={14} />} glow>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground">GUILD</p>
                  <p className="text-sm font-body">{characterClass}</p>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">RARE</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground">MBTI TYPE</p>
                  <p className="text-sm font-body">{mbtiType || "—"}</p>
                </div>
                {editMode && (
                  <Button variant="outline" size="sm" className="text-[9px] font-mono h-6 px-2" onClick={() => updateProfile({ mbti_type: null, character_class: null })}>
                    RETAKE
                  </Button>
                )}
              </div>
              {/* Sub-class selector */}
              <div>
                <p className="text-[10px] font-mono text-muted-foreground mb-2">SUB-CLASS // EQUIP A REAL-WORLD PATH</p>
                {profile.character_class && SUB_CLASSES[profile.character_class] ? (
                  <div className="space-y-1.5">
                    {SUB_CLASSES[profile.character_class].map((sub) => {
                      const isEquipped = profile.subclass === sub.name;
                      return (
                        <button
                          key={sub.name}
                          onClick={() => updateProfile({ subclass: sub.name })}
                          className={`w-full text-left px-3 py-2 rounded border transition-all ${isEquipped ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/20 hover:border-primary/30"}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-body font-semibold ${isEquipped ? "text-secondary" : ""}`}>{sub.name}</p>
                            {isEquipped && <span className="text-[9px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">EQUIPPED</span>}
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground">{sub.realWorld}</p>
                          <p className="text-[10px] font-mono text-neon-green">{sub.bonus}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-muted-foreground">Complete MBTI quiz to unlock sub-classes</p>
                )}
              </div>
            </div>
          </HudCard>
        </div>
      )}

      {/* ── SKILLS ───────────────────────────────────────────────────────── */}
      {activeTab === "SKILLS" && (
        <div className="space-y-4">
          <HudCard title="OPERATOR SKILLS" icon={<Zap size={14} />} glow>
            {skillsLoading ? (
              <Loader2 className="animate-spin text-primary" size={18} />
            ) : skills.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No skills yet. Add your first skill below or ask NAVI to add one.</p>
            ) : (
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="group">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-body">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/100</span>
                        {editMode && (
                          <>
                            {editingSkillId === skill.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={editingSkillLevel}
                                  onChange={(e) => setEditingSkillLevel(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                  className="w-14 bg-muted border border-border rounded px-1.5 py-0.5 text-xs font-mono text-foreground outline-none"
                                  min={1} max={100}
                                />
                                <button onClick={async () => { await updateSkill(skill.id, { level: editingSkillLevel }); setEditingSkillId(null); }} className="text-neon-green hover:text-neon-green/80"><Check size={12} /></button>
                                <button onClick={() => setEditingSkillId(null)} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => { setEditingSkillId(skill.id); setEditingSkillLevel(skill.level); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"><Pencil size={11} /></button>
                                <button onClick={() => deleteSkill(skill.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"><Trash2 size={11} /></button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <ProgressBar value={skill.level} max={100} variant="cyan" showValue={false} />
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.description}</p>
                  </div>
                ))}
              </div>
            )}
            {editMode && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <p className="text-[10px] font-mono text-muted-foreground">ADD NEW SKILL</p>
                <input type="text" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="Skill name..." className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
                <input type="text" value={newSkillDesc} onChange={(e) => setNewSkillDesc(e.target.value)} placeholder="Description..." className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
                <button onClick={handleAddSkill} disabled={!newSkillName.trim()} className="px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40">
                  <Plus size={10} className="inline mr-1" /> ADD SKILL
                </button>
              </div>
            )}
          </HudCard>
        </div>
      )}

      {/* ── EQUIPMENT ────────────────────────────────────────────────────── */}
      {activeTab === "EQUIPMENT" && (
        <div className="space-y-4">
          <HudCard title="INVENTORY & EQUIPMENT" icon={<Star size={14} />} glow>
            {equipLoading ? (
              <Loader2 className="animate-spin text-primary" size={18} />
            ) : items.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No equipment yet. Ask NAVI to grant items or add them manually.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className={`flex items-center justify-between py-2 border-b border-border last:border-0 group ${item.equipped ? "opacity-100" : "opacity-70"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.slot}</p>
                        {item.equipped && <span className="text-[9px] font-mono text-neon-green bg-neon-green/10 px-1.5 py-0.5 rounded">EQUIPPED</span>}
                      </div>
                      <p className="text-sm font-body truncate">{item.name}</p>
                      {item.effect && <p className="text-[10px] font-mono text-neon-green">{item.effect}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${RARITY_COLORS[item.rarity]}`}>{item.rarity}</span>
                      {editMode && (
                        <>
                          {!item.equipped && <button onClick={() => equipItem(item.id)} className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 text-[10px] font-mono">EQUIP</button>}
                          <button onClick={() => deleteItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editMode && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <p className="text-[10px] font-mono text-muted-foreground">ADD ITEM</p>
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item name..." className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={newItemSlot} onChange={(e) => setNewItemSlot(e.target.value as any)} className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                    {["title","badge","perk","weapon","armor","accessory","inventory"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={newItemRarity} onChange={(e) => setNewItemRarity(e.target.value as any)} className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                    {["COMMON","UNCOMMON","RARE","EPIC","LEGENDARY"].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <input type="text" value={newItemEffect} onChange={(e) => setNewItemEffect(e.target.value)} placeholder="Effect (optional)..." className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
                <button onClick={handleAddItem} disabled={!newItemName.trim()} className="px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40">
                  <Plus size={10} className="inline mr-1" /> ADD ITEM
                </button>
              </div>
            )}
          </HudCard>
        </div>
      )}

      {/* ── ACTIVE EFFECTS ────────────────────────────────────────────────── */}
      {activeTab === "EFFECTS" && (
        <HudCard title="ACTIVE EFFECTS" icon={<Zap size={14} />} glow>
          {effectsLoading ? (
            <Loader2 className="animate-spin text-primary" size={18} />
          ) : effects.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground">No active effects. NAVI can apply buffs when you complete quests or reach milestones.</p>
          ) : (
            <div className="space-y-2">
              {effects.map((effect) => (
                <div key={effect.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 group">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-body">{effect.name}</p>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${effect.effect_type === "buff" ? "bg-neon-green/10 text-neon-green" : effect.effect_type === "debuff" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        {effect.effect_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground">{effect.description}</p>
                    {effect.expires_at && <p className="text-[9px] font-mono text-neon-amber">Expires: {new Date(effect.expires_at).toLocaleDateString()}</p>}
                  </div>
                  {editMode && (
                    <button onClick={() => removeEffect(effect.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </HudCard>
      )}
    </div>
  );
}
