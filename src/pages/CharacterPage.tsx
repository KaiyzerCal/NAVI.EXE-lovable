import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import MbtiQuiz, { MBTI_CLASS_MAP, SUB_CLASSES } from "@/components/MbtiQuiz";
import EquipmentTab from "@/components/EquipmentTab";
import { getSubclass } from "@/lib/subclassRules";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sword, Brain, Heart, Zap, Star, Eye, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useOwner } from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const tabs = ["PROFILE", "SKILLS", "EQUIPMENT"] as const;

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  max_level: number;
  xp: number;
}

interface Subskill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  level: number;
}

interface EquipmentItem {
  stat_bonuses: Record<string, number>;
  is_equipped: boolean;
}

interface ActiveBuff {
  stat_affected: string;
  modifier_value: number;
  effect_type: string;
  expires_at: string | null;
}

const VARIANTS = ["cyan", "purple", "green", "amber"] as const;

const baseStatDefs = [
  { name: "STR", base: 14, icon: <Sword size={12} /> },
  { name: "INT", base: 22, icon: <Brain size={12} /> },
  { name: "VIT", base: 16, icon: <Heart size={12} /> },
  { name: "AGI", base: 18, icon: <Zap size={12} /> },
  { name: "RES", base: 20, icon: <Shield size={12} /> },
];

export default function CharacterPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("PROFILE");
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const isOwner = useOwner();
  const [editMode, setEditMode] = useState(false);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [subskills, setSubskills] = useState<Subskill[]>([]);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({ name: "", description: "", category: "General", max_level: 10 });
  const [subForm, setSubForm] = useState({ name: "", description: "" });
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);

  // Equipment and buff bonuses for stat display
  const [equipBonuses, setEquipBonuses] = useState<Record<string, number>>({});
  const [buffBonuses, setBuffBonuses] = useState<Record<string, number>>({});

  const characterClass = profile.character_class || "Unknown";
  const mbtiType = profile.mbti_type || null;
  const classInfo = mbtiType ? MBTI_CLASS_MAP[mbtiType] : null;
  const subclassInfo = getSubclass(characterClass, mbtiType);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("skills" as any).select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("subskills" as any).select("*").eq("user_id", user.id),
      supabase.from("equipment" as any).select("stat_bonuses, is_equipped").eq("user_id", user.id).eq("is_equipped", true),
      supabase.from("buffs" as any).select("stat_affected, modifier_value, effect_type, expires_at").eq("user_id", user.id),
    ]).then(([skillsRes, subsRes, eqRes, buffRes]) => {
      setSkills((skillsRes.data || []) as unknown as Skill[]);
      setSubskills((subsRes.data || []) as unknown as Subskill[]);

      // Calculate equipment bonuses
      const eqBonuses: Record<string, number> = {};
      for (const item of (eqRes.data || []) as unknown as EquipmentItem[]) {
        for (const [k, v] of Object.entries(item.stat_bonuses || {})) {
          eqBonuses[k] = (eqBonuses[k] || 0) + (v as number);
        }
      }
      setEquipBonuses(eqBonuses);

      // Calculate buff bonuses
      const bBonuses: Record<string, number> = {};
      for (const b of (buffRes.data || []) as unknown as ActiveBuff[]) {
        if (b.expires_at && new Date(b.expires_at).getTime() < Date.now()) continue;
        const mult = b.effect_type === "debuff" ? -1 : 1;
        bBonuses[b.stat_affected] = (bBonuses[b.stat_affected] || 0) + b.modifier_value * mult;
      }
      setBuffBonuses(bBonuses);
    });
  }, [user]);

  const handleQuizComplete = async (mbti: string, charClass: string) => {
    const sc = getSubclass(charClass, mbti);
    await updateProfile({ mbti_type: mbti, character_class: charClass, subclass: sc?.subclass || null } as any);
  };

  const addSkill = async () => {
    if (!skillForm.name.trim() || !user) return;
    const { data } = await supabase.from("skills" as any).insert({
      user_id: user.id, name: skillForm.name, description: skillForm.description,
      category: skillForm.category, max_level: skillForm.max_level,
    }).select("*").single();
    if (data) setSkills((prev) => [...prev, data as unknown as Skill]);
    setSkillForm({ name: "", description: "", category: "General", max_level: 10 });
    setShowAddSkill(false);
  };

  const updateSkill = async (id: string, updates: Partial<Skill>) => {
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    await supabase.from("skills" as any).update(updates as any).eq("id", id);
    setEditingSkillId(null);
  };

  const deleteSkill = async (id: string) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    setSubskills((prev) => prev.filter((s) => s.skill_id !== id));
    await supabase.from("skills" as any).delete().eq("id", id);
  };

  const addSubskill = async (skillId: string) => {
    if (!subForm.name.trim() || !user) return;
    const { data } = await supabase.from("subskills" as any).insert({
      user_id: user.id, skill_id: skillId, name: subForm.name, description: subForm.description,
    }).select("*").single();
    if (data) setSubskills((prev) => [...prev, data as unknown as Subskill]);
    setSubForm({ name: "", description: "" });
    setAddingSubTo(null);
  };

  const deleteSubskill = async (id: string) => {
    setSubskills((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("subskills" as any).delete().eq("id", id);
  };

  const getEffectiveStat = (statName: string, base: number) => {
    const key = statName.toLowerCase();
    const eqBonus = equipBonuses[key] || equipBonuses[statName] || 0;
    const buffBonus = buffBonuses[key] || buffBonuses[statName] || 0;
    return base + eqBonus + buffBonus;
  };

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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/20 rounded p-6 mb-6 border-glow">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded bg-primary/10 border-2 border-primary/30 flex items-center justify-center glow-cyan">
            <Star className="text-primary" size={32} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-lg text-primary font-bold">{profile.display_name || "OPERATOR"}</h2>
              <span className="text-xs font-mono bg-secondary/10 text-secondary px-2 py-0.5 rounded">
                {characterClass.toUpperCase()}
                {subclassInfo ? ` // ${subclassInfo.subclass}` : ""}
              </span>
            </div>
            {mbtiType && (
              <p className="text-[10px] font-mono text-muted-foreground mb-1">MBTI: {mbtiType} // {classInfo?.desc || ""}</p>
            )}
            {subclassInfo && (
              <p className="text-[10px] font-mono text-secondary/80 mb-1">Subclass: {subclassInfo.subclass} — {subclassInfo.desc}</p>
            )}
            {mbtiType && !subclassInfo && (
              <p className="text-[10px] font-mono text-neon-amber/80 mb-1">Subclass: Undetermined — change class in Settings to unlock</p>
            )}
            <p className="text-xs font-mono text-muted-foreground mb-3">XP: {profile.xp_total.toLocaleString()}</p>
            <ProgressBar value={profile.xp_total % 1000} max={1000} variant="cyan" size="md" showValue={false} />
            {editMode && (
              <div className="mt-3 flex gap-2 items-center">
                <Input className="h-7 text-xs w-40" placeholder="Character class..." defaultValue={characterClass}
                  onBlur={(e) => {
                    const newClass = e.target.value;
                    const sc = getSubclass(newClass, mbtiType);
                    updateProfile({ character_class: newClass, subclass: sc?.subclass || null } as any);
                  }} />
                <Button variant="outline" size="sm" className="text-[10px] font-mono"
                  onClick={() => updateProfile({ mbti_type: null, character_class: null, subclass: null } as any)}>RETAKE QUIZ</Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex mb-4 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      {activeTab === "PROFILE" ? (
        <div className="grid md:grid-cols-2 gap-4">
          <HudCard title="BASE STATS" icon={<Shield size={14} />} glow>
            <div className="space-y-3">
              {baseStatDefs.map((stat) => {
                const effective = getEffectiveStat(stat.name, stat.base);
                const bonus = effective - stat.base;
                return (
                  <div key={stat.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-primary">{stat.icon}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono text-muted-foreground">{stat.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="font-display text-sm font-bold text-foreground">{effective}</span>
                          {bonus !== 0 && (
                            <span className={`text-[9px] font-mono ${bonus > 0 ? "text-neon-green" : "text-destructive"}`}>
                              ({bonus > 0 ? "+" : ""}{bonus})
                            </span>
                          )}
                        </div>
                      </div>
                      <ProgressBar value={effective} max={30} variant="cyan" showValue={false} />
                    </div>
                  </div>
                );
              })}
            </div>
          </HudCard>

          <HudCard title="CLASS INFO" icon={<Star size={14} />} glow>
            <div className="space-y-2">
              <div className="py-1.5 border-b border-border">
                <p className="text-[10px] font-mono text-muted-foreground">CLASS</p>
                <p className="text-sm font-body">{characterClass}</p>
              </div>
              {mbtiType && (
                <div className="py-1.5 border-b border-border">
                  <p className="text-[10px] font-mono text-muted-foreground">MBTI TYPE</p>
                  <p className="text-sm font-body">{mbtiType} — {classInfo?.desc}</p>
                </div>
              )}
              {subclassInfo && (
                <div className="py-1.5 border-b border-border">
                  <p className="text-[10px] font-mono text-muted-foreground">SUBCLASS</p>
                  <p className="text-sm font-body">{subclassInfo.subclass} — {subclassInfo.desc}</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-[10px] font-mono text-muted-foreground mb-2">SUB-CLASS // EQUIP A REAL-WORLD PATH</p>
              {profile.character_class && SUB_CLASSES[profile.character_class] ? (
                <div className="space-y-2">
                  {SUB_CLASSES[profile.character_class].map((sub) => {
                    const isEquipped = profile.subclass === sub.name;
                    return (
                      <button key={sub.name} onClick={() => updateProfile({ subclass: sub.name })}
                        className={`w-full text-left px-3 py-2.5 rounded border transition-all ${
                          isEquipped ? "border-secondary/50 bg-secondary/10" : "border-border bg-muted/20 hover:border-primary/30 hover:bg-primary/5"
                        }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs font-body font-semibold ${isEquipped ? "text-secondary" : "text-foreground"}`}>{sub.name}</p>
                          {isEquipped && <span className="text-[9px] font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">EQUIPPED</span>}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground">{sub.realWorld}</p>
                        <p className="text-[10px] font-mono text-neon-green mt-0.5">{sub.bonus}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground">Complete the MBTI quiz to unlock sub-class options</p>
              )}
            </div>
          </HudCard>
        </div>
      ) : activeTab === "EQUIPMENT" ? (
        <EquipmentTab />
      ) : (
        <div>
          {/* Add Skill Button */}
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddSkill(!showAddSkill)}
              className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors">
              <Plus size={14} /> ADD SKILL
            </button>
          </div>

          {/* Add Skill Form */}
          <AnimatePresence>
            {showAddSkill && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
                <HudCard title="NEW SKILL" icon={<Plus size={14} />} glow>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">NAME *</label>
                      <Input value={skillForm.name} onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))} placeholder="Skill name..." className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
                      <Input value={skillForm.description} onChange={(e) => setSkillForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this skill represents..." className="h-8 text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground block mb-1">CATEGORY</label>
                        <select value={skillForm.category} onChange={(e) => setSkillForm((f) => ({ ...f, category: e.target.value }))}
                          className="w-full bg-muted border border-border rounded px-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40">
                          {["General", "Combat", "Knowledge", "Social", "Fitness", "Creative", "Technical"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-muted-foreground block mb-1">MAX LEVEL</label>
                        <Input type="number" value={skillForm.max_level} onChange={(e) => setSkillForm((f) => ({ ...f, max_level: Math.max(1, parseInt(e.target.value) || 10) }))}
                          min={1} className="h-8 text-xs" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={addSkill} disabled={!skillForm.name.trim()} className="text-xs font-mono"><Save size={10} className="mr-1" /> CREATE</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddSkill(false)} className="text-xs font-mono"><X size={10} className="mr-1" /> CANCEL</Button>
                    </div>
                  </div>
                </HudCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skills List */}
          {skills.length === 0 && !showAddSkill ? (
            <div className="text-center py-12 text-muted-foreground">
              <Brain size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs font-mono">No skills yet. Add your first skill to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((skill, i) => {
                const variant = VARIANTS[i % VARIANTS.length];
                const subs = subskills.filter((s) => s.skill_id === skill.id);
                const isExpanded = expandedSkill === skill.id;
                const isEditing = editingSkillId === skill.id;
                const eqBonus = equipBonuses[skill.name.toLowerCase()] || 0;
                const bBonus = buffBonuses[skill.name.toLowerCase()] || 0;
                const totalBonus = eqBonus + bBonus;

                return (
                  <motion.div key={skill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded p-3 hover:border-primary/20 transition-colors">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input className="h-7 text-xs" defaultValue={skill.name} onBlur={(e) => updateSkill(skill.id, { name: e.target.value })} />
                        <Input className="h-7 text-xs" defaultValue={skill.description} onBlur={(e) => updateSkill(skill.id, { description: e.target.value })} />
                        <div className="flex gap-2">
                          <select defaultValue={skill.category} onChange={(e) => updateSkill(skill.id, { category: e.target.value })}
                            className="bg-muted border border-border rounded px-2 py-1 text-xs font-body text-foreground">
                            {["General", "Combat", "Knowledge", "Social", "Fitness", "Creative", "Technical"].map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setEditingSkillId(null)}>DONE</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-body">{skill.name}</span>
                            <span className="text-[9px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">{skill.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/{skill.max_level}</span>
                            {totalBonus !== 0 && (
                              <span className={`text-[9px] font-mono ${totalBonus > 0 ? "text-neon-green" : "text-destructive"}`}>
                                ({totalBonus > 0 ? "+" : ""}{totalBonus})
                              </span>
                            )}
                            <button onClick={() => setEditingSkillId(skill.id)} className="text-muted-foreground hover:text-primary"><Edit2 size={12} /></button>
                            <button onClick={() => deleteSkill(skill.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                            <button onClick={() => setExpandedSkill(isExpanded ? null : skill.id)} className="text-muted-foreground hover:text-foreground">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>
                        <ProgressBar value={skill.level} max={skill.max_level} variant={variant} showValue={false} />
                        {skill.description && <p className="text-[10px] font-mono text-muted-foreground mt-1">{skill.description}</p>}
                      </>
                    )}

                    {/* Subskills */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-muted-foreground">SUBSKILLS</span>
                            <button onClick={() => setAddingSubTo(addingSubTo === skill.id ? null : skill.id)}
                              className="text-[10px] font-mono text-primary hover:underline flex items-center gap-1">
                              <Plus size={10} /> ADD
                            </button>
                          </div>

                          {addingSubTo === skill.id && (
                            <div className="flex gap-2 mb-2">
                              <Input value={subForm.name} onChange={(e) => setSubForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Subskill name..." className="h-7 text-xs flex-1" />
                              <Button size="sm" onClick={() => addSubskill(skill.id)} disabled={!subForm.name.trim()} className="text-[10px] h-7">ADD</Button>
                            </div>
                          )}

                          {subs.length === 0 && addingSubTo !== skill.id ? (
                            <p className="text-[10px] font-mono text-muted-foreground">No subskills yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {subs.map((sub) => (
                                <div key={sub.id} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1.5">
                                  <div>
                                    <span className="text-xs font-body">{sub.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground ml-2">LVL {sub.level}</span>
                                  </div>
                                  <button onClick={() => deleteSubskill(sub.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={10} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
