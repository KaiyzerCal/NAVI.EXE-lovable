import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Check, X, ChevronDown, ChevronUp, Star, Zap, Target, BookOpen, Layers, Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type QuestType = "Daily" | "Weekly" | "Main" | "Side" | "Minor" | "Epic";

interface Quest {
  id: string;
  name: string;
  type: QuestType;
  progress: number;
  total: number;
  xp_reward: number;
  completed: boolean;
  loot_description: string;
  equipment_reward_id: string | null;
  buff_reward_id: string | null;
  debuff_penalty_id: string | null;
}

const TYPE_CONFIG: Record<QuestType, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  Main:   { color: "text-accent",         bg: "bg-accent/10",         border: "border-accent/40",       icon: <Star size={10} />,     label: "MAIN" },
  Side:   { color: "text-neon-purple",    bg: "bg-neon-purple/10",    border: "border-neon-purple/30",   icon: <Layers size={10} />,   label: "SIDE" },
  Minor:  { color: "text-neon-green",     bg: "bg-neon-green/10",     border: "border-neon-green/30",    icon: <Target size={10} />,   label: "MINOR" },
  Daily:  { color: "text-neon-amber",     bg: "bg-neon-amber/10",     border: "border-neon-amber/30",    icon: <Zap size={10} />,      label: "DAILY" },
  Weekly: { color: "text-primary",        bg: "bg-primary/10",        border: "border-primary/30",       icon: <BookOpen size={10} />, label: "WEEKLY" },
  Epic:   { color: "text-pink-400",       bg: "bg-pink-500/10",       border: "border-pink-500/30",      icon: <Swords size={10} />,   label: "EPIC" },
};

const TYPE_ORDER: QuestType[] = ["Main", "Side", "Weekly", "Daily", "Minor", "Epic"];

interface NewQuestForm {
  name: string;
  type: QuestType;
  total: number;
  xp_reward: number;
  buff_name: string;
  buff_stat: string;
  buff_value: number;
  buff_duration: string;
  debuff_name: string;
  debuff_stat: string;
  debuff_value: number;
  debuff_duration: string;
}

const defaultForm: NewQuestForm = {
  name: "", type: "Daily", total: 1, xp_reward: 50,
  buff_name: "", buff_stat: "", buff_value: 0, buff_duration: "",
  debuff_name: "", debuff_stat: "", debuff_value: 0, debuff_duration: "",
};

export default function QuestsPage() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<QuestType | "all">("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState<NewQuestForm>(defaultForm);

  useEffect(() => {
    if (!user) return;
    supabase.from("quests").select("id, name, type, progress, total, xp_reward, completed, loot_description, equipment_reward_id, buff_reward_id, debuff_penalty_id")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setQuests(data as Quest[]);
        setLoading(false);
      });
  }, [user]);

  const filtered = quests.filter((q) => {
    const statusMatch = filter === "active" ? !q.completed : filter === "completed" ? q.completed : true;
    const typeMatch = typeFilter === "all" || q.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    quests: filtered.filter((q) => q.type === type),
  })).filter((g) => g.quests.length > 0);

  const completeQuest = async (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest || !user) return;

    setQuests((prev) => prev.map((q) => q.id === id ? { ...q, completed: true, progress: q.total } : q));
    await supabase.from("quests").update({ completed: true, progress: quest.total }).eq("id", id);

    // Award XP
    const { data: profile } = await supabase.from("profiles").select("xp_total").eq("id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ xp_total: profile.xp_total + quest.xp_reward }).eq("id", user.id);
    }
    await supabase.from("activity_log" as any).insert({
      user_id: user.id, event_type: "quest_completed", description: `Quest completed: ${quest.name}`, xp_amount: quest.xp_reward,
    });

    // Apply buff reward if defined
    if (quest.buff_reward_id) {
      const { data: buffTemplate } = await supabase.from("buffs" as any).select("*").eq("id", quest.buff_reward_id).single();
      if (buffTemplate) {
        const bt = buffTemplate as any;
        const expiresAt = bt.duration_hours ? new Date(Date.now() + bt.duration_hours * 3600000).toISOString() : null;
        await supabase.from("buffs" as any).insert({
          user_id: user.id, name: bt.name, description: bt.description || "", effect_type: "buff",
          stat_affected: bt.stat_affected, modifier_value: bt.modifier_value, duration_hours: bt.duration_hours,
          source: quest.name, expires_at: expiresAt,
        });
        await supabase.from("activity_log" as any).insert({
          user_id: user.id, event_type: "buff_gained", description: `Buff gained: ${bt.name} from ${quest.name}`, xp_amount: 0,
        });
      }
    }
  };

  const failQuest = async (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest || !user) return;

    setQuests((prev) => prev.filter((q) => q.id !== id));
    await supabase.from("quests").delete().eq("id", id);

    await supabase.from("activity_log" as any).insert({
      user_id: user.id, event_type: "quest_failed", description: `Quest failed: ${quest.name}`, xp_amount: 0,
    });

    // Apply debuff penalty if defined
    if (quest.debuff_penalty_id) {
      const { data: debuffTemplate } = await supabase.from("buffs" as any).select("*").eq("id", quest.debuff_penalty_id).single();
      if (debuffTemplate) {
        const dt = debuffTemplate as any;
        const expiresAt = dt.duration_hours ? new Date(Date.now() + dt.duration_hours * 3600000).toISOString() : null;
        await supabase.from("buffs" as any).insert({
          user_id: user.id, name: dt.name, description: dt.description || "", effect_type: "debuff",
          stat_affected: dt.stat_affected, modifier_value: dt.modifier_value, duration_hours: dt.duration_hours,
          source: quest.name, expires_at: expiresAt,
        });
        await supabase.from("activity_log" as any).insert({
          user_id: user.id, event_type: "debuff_gained", description: `Debuff applied: ${dt.name} from failing ${quest.name}`, xp_amount: 0,
        });
      }
    }
  };

  const generateLootDesc = (f: NewQuestForm): string => {
    const parts: string[] = [];
    if (f.xp_reward > 0) parts.push(`+${f.xp_reward} XP`);
    if (f.buff_name.trim()) parts.push(`Buff: ${f.buff_name} (+${f.buff_value} ${f.buff_stat})`);
    if (f.debuff_name.trim()) parts.push(`Penalty on fail: ${f.debuff_name} (${f.debuff_value} ${f.debuff_stat})`);
    return parts.join(" | ") || "No rewards set";
  };

  const addQuest = async () => {
    if (!form.name.trim() || !user) return;

    let buffId: string | null = null;
    let debuffId: string | null = null;

    // Create buff template if defined
    if (form.buff_name.trim()) {
      const dur = parseInt(form.buff_duration) || null;
      const { data } = await supabase.from("buffs" as any).insert({
        user_id: user.id, name: form.buff_name, effect_type: "buff", stat_affected: form.buff_stat,
        modifier_value: form.buff_value, duration_hours: dur, source: "quest_reward",
      }).select("id").single();
      if (data) buffId = (data as any).id;
    }

    // Create debuff template if defined
    if (form.debuff_name.trim()) {
      const dur = parseInt(form.debuff_duration) || null;
      const { data } = await supabase.from("buffs" as any).insert({
        user_id: user.id, name: form.debuff_name, effect_type: "debuff", stat_affected: form.debuff_stat,
        modifier_value: form.debuff_value, duration_hours: dur, source: "quest_penalty",
      }).select("id").single();
      if (data) debuffId = (data as any).id;
    }

    const loot = generateLootDesc(form);

    const { data } = await supabase.from("quests").insert({
      user_id: user.id, name: form.name.trim(), type: form.type, total: form.total,
      xp_reward: form.xp_reward, loot_description: loot,
      buff_reward_id: buffId, debuff_penalty_id: debuffId,
    } as any).select("id, name, type, progress, total, xp_reward, completed, loot_description, equipment_reward_id, buff_reward_id, debuff_penalty_id").single();
    if (data) setQuests((prev) => [data as Quest, ...prev]);
    setForm(defaultForm);
    setShowNewForm(false);
  };

  const deleteQuest = async (id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
    await supabase.from("quests").delete().eq("id", id);
  };

  const totalXP = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xp_reward, 0);
  const completedCount = quests.filter((q) => q.completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="QUESTS" subtitle="// MISSION CONTROL">
        <button onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors">
          <Plus size={14} /> NEW QUEST
        </button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "ACTIVE", value: quests.filter((q) => !q.completed).length, color: "text-neon-amber" },
          { label: "DONE", value: completedCount, color: "text-neon-green" },
          { label: "XP EARNED", value: `+${totalXP}`, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded p-2 text-center">
            <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
            <HudCard title="NEW QUEST" icon={<Plus size={14} />} glow>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST NAME *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name your quest..." className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST TYPE</label>
                    <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QuestType }))}
                      className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors">
                      <option value="Main">Main</option><option value="Side">Side</option><option value="Minor">Minor</option>
                      <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Epic">Epic</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">XP REWARD</label>
                    <input type="number" value={form.xp_reward} onChange={(e) => setForm((f) => ({ ...f, xp_reward: Math.max(1, parseInt(e.target.value) || 0) }))}
                      min={1} className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground block mb-1">STEPS</label>
                  <input type="number" value={form.total} onChange={(e) => setForm((f) => ({ ...f, total: Math.max(1, parseInt(e.target.value) || 1) }))}
                    min={1} className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
                </div>

                {/* Buff Reward */}
                <div className="border border-neon-green/20 rounded p-2 space-y-2">
                  <p className="text-[10px] font-mono text-neon-green">BUFF REWARD (optional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={form.buff_name} onChange={(e) => setForm((f) => ({ ...f, buff_name: e.target.value }))}
                      placeholder="Buff name" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                    <input type="text" value={form.buff_stat} onChange={(e) => setForm((f) => ({ ...f, buff_stat: e.target.value }))}
                      placeholder="Stat affected" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.buff_value} onChange={(e) => setForm((f) => ({ ...f, buff_value: parseInt(e.target.value) || 0 }))}
                      placeholder="Value" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                    <input type="text" value={form.buff_duration} onChange={(e) => setForm((f) => ({ ...f, buff_duration: e.target.value }))}
                      placeholder="Hours (blank=permanent)" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                  </div>
                </div>

                {/* Debuff Penalty */}
                <div className="border border-destructive/20 rounded p-2 space-y-2">
                  <p className="text-[10px] font-mono text-destructive">DEBUFF PENALTY (optional)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={form.debuff_name} onChange={(e) => setForm((f) => ({ ...f, debuff_name: e.target.value }))}
                      placeholder="Debuff name" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                    <input type="text" value={form.debuff_stat} onChange={(e) => setForm((f) => ({ ...f, debuff_stat: e.target.value }))}
                      placeholder="Stat affected" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.debuff_value} onChange={(e) => setForm((f) => ({ ...f, debuff_value: parseInt(e.target.value) || 0 }))}
                      placeholder="Value" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                    <input type="text" value={form.debuff_duration} onChange={(e) => setForm((f) => ({ ...f, debuff_duration: e.target.value }))}
                      placeholder="Hours (blank=permanent)" className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none" />
                  </div>
                </div>

                {/* Loot preview */}
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-[9px] font-mono text-muted-foreground">LOOT PREVIEW</p>
                  <p className="text-[10px] font-mono text-foreground">{generateLootDesc(form)}</p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={addQuest} disabled={!form.name.trim()}
                    className="flex-1 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40">ACCEPT QUEST</button>
                  <button onClick={() => { setShowNewForm(false); setForm(defaultForm); }}
                    className="px-4 py-2 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors">CANCEL</button>
                </div>
              </div>
            </HudCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors ${
                filter === f ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}>{f}</button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${
              typeFilter === "all" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground border border-transparent hover:border-border"
            }`}>ALL TYPES</button>
          {TYPE_ORDER.map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors flex items-center gap-1 ${
                  typeFilter === t ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : "text-muted-foreground border border-transparent hover:border-border"
                }`}>{cfg.icon}{t}</button>
            );
          })}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Swords size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono">NO QUESTS FOUND</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ type, quests: groupQuests }) => {
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type}>
                <div className={`flex items-center gap-2 mb-2 pb-1 border-b ${cfg.border}`}>
                  <span className={`${cfg.color} flex items-center gap-1`}>{cfg.icon}</span>
                  <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>{cfg.label} QUESTS</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {groupQuests.filter((q) => q.completed).length}/{groupQuests.length} COMPLETE
                  </span>
                </div>
                <div className="space-y-2">
                  {groupQuests.map((quest, i) => (
                    <motion.div key={quest.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className={`bg-card border rounded transition-colors ${quest.completed ? "border-neon-green/20 opacity-60" : "border-border hover:border-primary/20"}`}>
                      <div className="flex items-center gap-3 p-3">
                        <button onClick={() => !quest.completed && completeQuest(quest.id)}
                          className={`w-6 h-6 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            quest.completed ? "bg-neon-green/20 border-neon-green/40 text-neon-green" : "border-border hover:border-primary/40"
                          }`}>{quest.completed && <Check size={12} />}</button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-body truncate mb-1 ${quest.completed ? "line-through text-muted-foreground" : ""}`}>{quest.name}</p>
                          <ProgressBar value={quest.completed ? quest.total : quest.progress} max={quest.total}
                            variant={quest.completed ? "green" : "amber"} showValue={false} />
                          {quest.loot_description && (
                            <p className="text-[9px] font-mono text-muted-foreground mt-1">{quest.loot_description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <p className="text-xs font-mono text-neon-green">+{quest.xp_reward} XP</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{quest.progress}/{quest.total}</p>
                          </div>
                          {!quest.completed && (
                            <button onClick={() => failQuest(quest.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Fail quest">
                              <AlertTriangle size={12} />
                            </button>
                          )}
                          <button onClick={() => deleteQuest(quest.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
