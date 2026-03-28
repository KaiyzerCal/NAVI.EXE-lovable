import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import HudCard from "@/components/HudCard";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Plus, Check, X, Star, Zap, Target, BookOpen,
  Layers, Pencil, Copy, RotateCcw, Eye, Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import type { Quest, QuestType, CreateQuestInput } from "@/hooks/useQuests";

const TYPE_CONFIG: Record<QuestType, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  Main:   { color: "text-accent",       bg: "bg-accent/10",       border: "border-accent/40",       icon: <Star size={10} />,     label: "MAIN" },
  Side:   { color: "text-neon-purple",  bg: "bg-neon-purple/10",  border: "border-neon-purple/30",  icon: <Layers size={10} />,   label: "SIDE" },
  Minor:  { color: "text-neon-green",   bg: "bg-neon-green/10",   border: "border-neon-green/30",   icon: <Target size={10} />,   label: "MINOR" },
  Daily:  { color: "text-neon-amber",   bg: "bg-neon-amber/10",   border: "border-neon-amber/30",   icon: <Zap size={10} />,      label: "DAILY" },
  Weekly: { color: "text-primary",      bg: "bg-primary/10",      border: "border-primary/30",      icon: <BookOpen size={10} />, label: "WEEKLY" },
  Epic:   { color: "text-pink-400",     bg: "bg-pink-500/10",     border: "border-pink-500/30",     icon: <Swords size={10} />,   label: "EPIC" },
};
const TYPE_ORDER: QuestType[] = ["Main", "Side", "Weekly", "Daily", "Minor", "Epic"];

interface QuestFormState {
  name: string;
  description: string;
  type: QuestType;
  total: number;
  xpReward: number;
}
const emptyForm = (q?: Quest): QuestFormState => ({
  name: q?.name ?? "",
  description: q?.description ?? "",
  type: q?.type ?? "Daily",
  total: q?.total ?? 1,
  xpReward: q?.xp_reward ?? 50,
});

// ─── Shared form component ───────────────────────────────────────────────────
function QuestFormCard({
  title,
  initial,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  initial: QuestFormState;
  saving?: boolean;
  onSave: (f: QuestFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<QuestFormState>(initial);
  return (
    <HudCard title={title} icon={<Plus size={14} />} glow>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST NAME *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Name your quest..."
            autoFocus
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What does completing this mean?"
            rows={3}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST TYPE</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QuestType }))}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
            >
              <option value="Main">Main — Primary story arc</option>
              <option value="Side">Side — Optional, big reward</option>
              <option value="Minor">Minor — Quick micro-win</option>
              <option value="Daily">Daily — Resets every day</option>
              <option value="Weekly">Weekly — Resets every week</option>
              <option value="Epic">Epic — Long-haul legendary</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground block mb-1">XP REWARD</label>
            <input
              type="number"
              value={form.xpReward}
              onChange={(e) => setForm((f) => ({ ...f, xpReward: Math.max(1, parseInt(e.target.value) || 0) }))}
              min={1}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">MILESTONES / STEPS</label>
          <input
            type="number"
            value={form.total}
            onChange={(e) => setForm((f) => ({ ...f, total: Math.max(1, parseInt(e.target.value) || 1) }))}
            min={1}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onSave(form)}
            disabled={!form.name.trim() || saving}
            className="flex-1 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={12} className="animate-spin" />}
            SAVE QUEST
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
          >
            CANCEL
          </button>
        </div>
      </div>
    </HudCard>
  );
}

// ─── Quest Detail Modal ───────────────────────────────────────────────────────
function QuestDetailModal({
  quest,
  onClose,
  onEdit,
  onToggle,
  onDelete,
}: {
  quest: Quest;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cfg = TYPE_CONFIG[quest.type];
  const copyEntry = () => {
    const text = `[${quest.type.toUpperCase()}] ${quest.name}\n${quest.description || ""}\nProgress: ${quest.progress}/${quest.total} · XP: +${quest.xp_reward}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Quest copied to clipboard." });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-card border border-primary/30 rounded-lg p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-1 rounded border flex items-center gap-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.icon} {cfg.label}
            </span>
            {quest.completed && (
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-neon-green/10 text-neon-green border border-neon-green/30">COMPLETE</span>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        <h3 className={`font-display text-lg font-bold mb-2 ${quest.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {quest.name}
        </h3>
        {quest.description
          ? <p className="text-sm font-body text-muted-foreground leading-relaxed mb-4">{quest.description}</p>
          : <p className="text-xs font-mono text-muted-foreground/50 italic mb-4">No description.</p>
        }
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-muted-foreground">PROGRESS</span>
            <span className="text-[10px] font-mono text-foreground">{quest.progress}/{quest.total}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quest.completed ? "bg-neon-green" : "bg-neon-amber"}`}
              style={{ width: `${Math.min(100, (quest.progress / quest.total) * 100)}%` }}
            />
          </div>
        </div>
        <p className="text-sm font-mono text-neon-green mb-5">+{quest.xp_reward} XP REWARD</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onToggle} className={`py-2 rounded border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors ${quest.completed ? "bg-muted border-border text-muted-foreground hover:text-foreground" : "bg-neon-green/10 border-neon-green/30 text-neon-green hover:bg-neon-green/20"}`}>
            {quest.completed ? <><RotateCcw size={12} /> UNMARK DONE</> : <><Check size={12} /> MARK DONE</>}
          </button>
          <button onClick={onEdit} className="py-2 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors">
            <Pencil size={12} /> EDIT
          </button>
          <button onClick={copyEntry} className="py-2 rounded border border-border bg-muted text-muted-foreground text-xs font-mono flex items-center justify-center gap-1.5 hover:text-foreground transition-colors">
            <Copy size={12} /> COPY
          </button>
          <button onClick={onDelete} className="py-2 rounded border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-destructive/20 transition-colors">
            <X size={12} /> DELETE
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuestsPage() {
  const { quests, loading, stats, createQuest, updateQuest, toggleQuest, deleteQuest } = useQuests();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<QuestType | "all">("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [viewingQuest, setViewingQuest] = useState<Quest | null>(null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = quests.filter((q) => {
    const statusMatch = filter === "active" ? !q.completed : filter === "completed" ? q.completed : true;
    const typeMatch = typeFilter === "all" || q.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    quests: filtered.filter((q) => q.type === type),
  })).filter((g) => g.quests.length > 0);

  const handleCreate = useCallback(async (form: QuestFormState) => {
    if (!form.name.trim()) return;
    setSaving(true);
    await createQuest({
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      total: form.total,
      xp_reward: form.xpReward,
    } as CreateQuestInput);
    setSaving(false);
    setShowNewForm(false);
    toast({ title: "Quest created", description: "New quest added to your log." });
  }, [createQuest]);

  const handleEdit = useCallback(async (form: QuestFormState) => {
    if (!editingQuest || !form.name.trim()) return;
    setSaving(true);
    await updateQuest(editingQuest.id, {
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      total: form.total,
      xp_reward: form.xpReward,
    });
    setSaving(false);
    setEditingQuest(null);
    setViewingQuest(null);
    toast({ title: "Quest updated" });
  }, [editingQuest, updateQuest]);

  const handleToggle = useCallback(async (id: string) => {
    await toggleQuest(id);
    setViewingQuest((prev) => {
      if (!prev || prev.id !== id) return prev;
      const nowCompleted = !prev.completed;
      return { ...prev, completed: nowCompleted, progress: nowCompleted ? prev.total : prev.progress };
    });
  }, [toggleQuest]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteQuest(id);
    setViewingQuest(null);
    toast({ title: "Quest deleted" });
  }, [deleteQuest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="ml-3 text-xs font-mono text-muted-foreground">Loading quest log...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="QUESTS" subtitle="// MISSION CONTROL">
        <button
          onClick={() => { setShowNewForm(true); setEditingQuest(null); }}
          className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors"
        >
          <Plus size={14} /> NEW QUEST
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "ACTIVE", value: stats.active, color: "text-neon-amber" },
          { label: "DONE", value: stats.completed, color: "text-neon-green" },
          { label: "XP EARNED", value: `+${stats.xpEarned}`, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded p-2 text-center">
            <p className={`text-lg font-display font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New / Edit Form */}
      <AnimatePresence>
        {(showNewForm || editingQuest) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <QuestFormCard
              title={editingQuest ? "EDIT QUEST" : "NEW QUEST"}
              initial={emptyForm(editingQuest ?? undefined)}
              saving={saving}
              onSave={editingQuest ? handleEdit : handleCreate}
              onCancel={() => { setShowNewForm(false); setEditingQuest(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors ${filter === f ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${typeFilter === "all" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground border border-transparent hover:border-border"}`}>
            ALL
          </button>
          {TYPE_ORDER.map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors flex items-center gap-1 ${typeFilter === t ? `${cfg.bg} ${cfg.color} border ${cfg.border}` : "text-muted-foreground border border-transparent hover:border-border"}`}>
                {cfg.icon} {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {quests.length === 0 ? (
        <div className="text-center py-16">
          <Swords size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono text-muted-foreground mb-4">NO QUESTS YET, OPERATOR</p>
          <button onClick={() => setShowNewForm(true)} className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">
            CREATE FIRST QUEST
          </button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs font-mono text-muted-foreground">NO QUESTS MATCH FILTER</p>
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
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`bg-card border rounded transition-colors cursor-pointer group ${quest.completed ? "border-neon-green/20 opacity-60 hover:opacity-80" : "border-border hover:border-primary/30"}`}
                      onClick={() => setViewingQuest(quest)}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(quest.id); }}
                          title={quest.completed ? "Unmark complete" : "Mark complete"}
                          className={`w-6 h-6 rounded shrink-0 border flex items-center justify-center transition-colors ${quest.completed ? "bg-neon-green/20 border-neon-green/40 text-neon-green" : "border-border hover:border-primary/40"}`}
                        >
                          {quest.completed && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-body truncate mb-1 ${quest.completed ? "line-through text-muted-foreground" : ""}`}>{quest.name}</p>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${quest.completed ? "bg-neon-green" : "bg-neon-amber"}`} style={{ width: `${Math.min(100, (quest.progress / quest.total) * 100)}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <p className="text-xs font-mono text-neon-green">+{quest.xp_reward} XP</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{quest.progress}/{quest.total}</p>
                          </div>
                          <Eye size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
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

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingQuest && !editingQuest && (
          <QuestDetailModal
            quest={viewingQuest}
            onClose={() => setViewingQuest(null)}
            onEdit={() => { setEditingQuest(viewingQuest); setViewingQuest(null); }}
            onToggle={() => handleToggle(viewingQuest.id)}
            onDelete={() => handleDelete(viewingQuest.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
