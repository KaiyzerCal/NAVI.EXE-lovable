import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Plus, Check, X, ChevronDown, ChevronUp, Star, Zap, Target, BookOpen, Layers } from "lucide-react";

type QuestType = "Daily" | "Weekly" | "Main" | "Side" | "Minor" | "Epic";

interface Quest {
  id: string;
  name: string;
  description?: string;
  type: QuestType;
  progress: number;
  total: number;
  xpReward: number;
  completed: boolean;
}

const initialQuests: Quest[] = [
  { id: "1", name: "Morning Routine Protocol", type: "Daily", progress: 5, total: 7, xpReward: 50, completed: false, description: "Complete all morning ritual steps before 9AM." },
  { id: "2", name: "Read 30 Pages", type: "Daily", progress: 30, total: 30, xpReward: 30, completed: true, description: "Absorb 30 pages of any book in your reading queue." },
  { id: "3", name: "Launch the MVP", type: "Main", progress: 3, total: 10, xpReward: 500, completed: false, description: "Build and ship the first version of your app. This is the primary story arc." },
  { id: "4", name: "Workout Session", type: "Daily", progress: 0, total: 1, xpReward: 40, completed: false, description: "Complete at least 30 minutes of physical training." },
  { id: "5", name: "Meditate 10 Minutes", type: "Minor", progress: 1, total: 1, xpReward: 20, completed: true, description: "Quiet the mind for 10 minutes. Small but powerful." },
  { id: "6", name: "Weekly Review", type: "Weekly", progress: 0, total: 1, xpReward: 100, completed: false, description: "Review wins, losses, and set intentions for the week ahead." },
  { id: "7", name: "Learn New Framework", type: "Side", progress: 7, total: 20, xpReward: 300, completed: false, description: "Complete the framework tutorial series. Optional but the rewards are worth it." },
  { id: "8", name: "Network with 3 People", type: "Side", progress: 1, total: 3, xpReward: 150, completed: false, description: "Reach out and connect with 3 people in your field." },
  { id: "9", name: "Drink 8 Glasses of Water", type: "Minor", progress: 5, total: 8, xpReward: 15, completed: false, description: "Hydration is a micro-habit with macro impact." },
];

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
  description: string;
  type: QuestType;
  total: number;
  xpReward: number;
}

const defaultForm: NewQuestForm = {
  name: "",
  description: "",
  type: "Daily",
  total: 1,
  xpReward: 50,
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [typeFilter, setTypeFilter] = useState<QuestType | "all">("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<NewQuestForm>(defaultForm);

  const filtered = quests.filter((q) => {
    const statusMatch = filter === "active" ? !q.completed : filter === "completed" ? q.completed : true;
    const typeMatch = typeFilter === "all" || q.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    quests: filtered.filter((q) => q.type === type),
  })).filter((g) => g.quests.length > 0);

  const toggleQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, completed: !q.completed, progress: !q.completed ? q.total : 0 } : q
      )
    );
  };

  const addQuest = () => {
    if (!form.name.trim()) return;
    const newQuest: Quest = {
      id: `q-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      progress: 0,
      total: form.total,
      xpReward: form.xpReward,
      completed: false,
    };
    setQuests((prev) => [newQuest, ...prev]);
    setForm(defaultForm);
    setShowNewForm(false);
  };

  const deleteQuest = (id: string) => {
    setQuests((prev) => prev.filter((q) => q.id !== id));
  };

  const totalXP = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xpReward, 0);
  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div>
      <PageHeader title="QUESTS" subtitle="// MISSION CONTROL">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors"
        >
          <Plus size={14} />
          NEW QUEST
        </button>
      </PageHeader>

      {/* Stats Row */}
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

      {/* New Quest Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <HudCard title="NEW QUEST" icon={<Plus size={14} />} glow>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground block mb-1">QUEST NAME *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Name your quest..."
                    className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-muted-foreground block mb-1">DESCRIPTION</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="What does completing this mean?"
                    rows={2}
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
                    onClick={addQuest}
                    disabled={!form.name.trim()}
                    className="flex-1 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ACCEPT QUEST
                  </button>
                  <button
                    onClick={() => { setShowNewForm(false); setForm(defaultForm); }}
                    className="px-4 py-2 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </HudCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors ${
                filter === f
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="w-px bg-border" />
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors ${
              typeFilter === "all"
                ? "bg-primary/10 text-primary border border-primary/30"
                : "text-muted-foreground border border-transparent hover:border-border"
            }`}
          >
            ALL TYPES
          </button>
          {TYPE_ORDER.map((t) => {
            const cfg = TYPE_CONFIG[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-colors flex items-center gap-1 ${
                  typeFilter === t
                    ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                    : "text-muted-foreground border border-transparent hover:border-border"
                }`}
              >
                {cfg.icon}
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quest Groups */}
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
                    <motion.div
                      key={quest.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`bg-card border rounded transition-colors ${
                        quest.completed ? "border-neon-green/20 opacity-60" : "border-border hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <button
                          onClick={() => toggleQuest(quest.id)}
                          className={`w-6 h-6 rounded shrink-0 border flex items-center justify-center transition-colors ${
                            quest.completed
                              ? "bg-neon-green/20 border-neon-green/40 text-neon-green"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {quest.completed && <Check size={12} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-body truncate mb-1 ${quest.completed ? "line-through text-muted-foreground" : ""}`}>
                            {quest.name}
                          </p>
                          <ProgressBar
                            value={quest.completed ? quest.total : quest.progress}
                            max={quest.total}
                            variant={quest.completed ? "green" : "amber"}
                            showValue={false}
                          />
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <div>
                            <p className="text-xs font-mono text-neon-green">+{quest.xpReward} XP</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{quest.progress}/{quest.total}</p>
                          </div>
                          {quest.description && (
                            <button
                              onClick={() => setExpandedId(expandedId === quest.id ? null : quest.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expandedId === quest.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          <button
                            onClick={() => deleteQuest(quest.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedId === quest.id && quest.description && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 border-t border-border">
                              <p className="text-xs font-body text-muted-foreground mt-2 leading-relaxed">
                                {quest.description}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
