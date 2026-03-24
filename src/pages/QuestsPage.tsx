import PageHeader from "@/components/PageHeader";
import ProgressBar from "@/components/ProgressBar";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Trash2, Edit2, X, Save } from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye } from "lucide-react";

interface Quest {
  id: string;
  name: string;
  type: "Daily" | "Weekly" | "Epic";
  progress: number;
  total: number;
  xpReward: number;
  completed: boolean;
}

const initialQuests: Quest[] = [
  { id: "1", name: "Morning Routine Protocol", type: "Daily", progress: 5, total: 7, xpReward: 50, completed: false },
  { id: "2", name: "Read 30 Pages", type: "Daily", progress: 30, total: 30, xpReward: 30, completed: true },
  { id: "3", name: "Complete Side Project MVP", type: "Epic", progress: 3, total: 10, xpReward: 500, completed: false },
  { id: "4", name: "Workout Session", type: "Daily", progress: 0, total: 1, xpReward: 40, completed: false },
  { id: "5", name: "Meditate 10 Minutes", type: "Daily", progress: 1, total: 1, xpReward: 20, completed: true },
  { id: "6", name: "Weekly Review", type: "Weekly", progress: 0, total: 1, xpReward: 100, completed: false },
  { id: "7", name: "Learn New Framework", type: "Epic", progress: 7, total: 20, xpReward: 300, completed: false },
];

const typeColors = {
  Daily: "bg-neon-amber/10 text-neon-amber",
  Weekly: "bg-neon-cyan/10 text-neon-cyan",
  Epic: "bg-neon-purple/10 text-neon-purple",
};

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const isOwner = useOwner();
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newQuest, setNewQuest] = useState({ name: "", type: "Daily" as Quest["type"], total: 1, xpReward: 50 });

  const filtered = quests.filter((q) => {
    if (filter === "active") return !q.completed;
    if (filter === "completed") return q.completed;
    return true;
  });

  const toggleQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, completed: !q.completed, progress: !q.completed ? q.total : 0 } : q
      )
    );
  };

  const addQuest = () => {
    if (!newQuest.name.trim()) return;
    setQuests((prev) => [...prev, { ...newQuest, id: Date.now().toString(), progress: 0, completed: false }]);
    setNewQuest({ name: "", type: "Daily", total: 1, xpReward: 50 });
    setShowAdd(false);
  };

  const deleteQuest = (id: string) => setQuests((prev) => prev.filter((q) => q.id !== id));

  const updateQuest = (id: string, updates: Partial<Quest>) => {
    setQuests((prev) => prev.map((q) => q.id === id ? { ...q, ...updates } : q));
  };

  return (
    <div>
      <PageHeader title="QUESTS" subtitle="// MISSION CONTROL">
        <div className="flex gap-2">
          {isOwner && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)} className="text-xs font-mono">
              <Eye size={12} className="mr-1" /> {editMode ? "VIEW" : "EDIT"}
            </Button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors"
          >
            <Plus size={14} /> NEW QUEST
          </button>
        </div>
      </PageHeader>

      {/* Add Quest Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/20 rounded p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Input placeholder="Quest name..." value={newQuest.name} onChange={(e) => setNewQuest((p) => ({ ...p, name: e.target.value }))} className="h-8 text-xs" />
            <select value={newQuest.type} onChange={(e) => setNewQuest((p) => ({ ...p, type: e.target.value as Quest["type"] }))} className="h-8 text-xs rounded border border-input bg-background px-2 font-mono">
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Epic">Epic</option>
            </select>
            <Input type="number" placeholder="Steps" value={newQuest.total} onChange={(e) => setNewQuest((p) => ({ ...p, total: parseInt(e.target.value) || 1 }))} className="h-8 text-xs" />
            <Input type="number" placeholder="XP Reward" value={newQuest.xpReward} onChange={(e) => setNewQuest((p) => ({ ...p, xpReward: parseInt(e.target.value) || 0 }))} className="h-8 text-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addQuest} className="text-xs font-mono"><Save size={10} className="mr-1" /> ADD</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="text-xs font-mono"><X size={10} className="mr-1" /> CANCEL</Button>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
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

      {/* Quest List */}
      <div className="space-y-2">
        {filtered.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`bg-card border rounded p-3 flex items-center gap-3 transition-colors ${
              quest.completed ? "border-neon-green/20 opacity-60" : "border-border hover:border-primary/20"
            }`}
          >
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
              {editMode && editingId === quest.id ? (
                <div className="space-y-2">
                  <Input className="h-7 text-xs" defaultValue={quest.name} onBlur={(e) => updateQuest(quest.id, { name: e.target.value })} />
                  <div className="flex gap-2">
                    <Input type="number" className="h-7 text-xs w-20" defaultValue={quest.progress} onBlur={(e) => updateQuest(quest.id, { progress: parseInt(e.target.value) || 0 })} />
                    <span className="text-xs font-mono text-muted-foreground self-center">/</span>
                    <Input type="number" className="h-7 text-xs w-20" defaultValue={quest.total} onBlur={(e) => updateQuest(quest.id, { total: parseInt(e.target.value) || 1 })} />
                    <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setEditingId(null)}>DONE</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${typeColors[quest.type]}`}>
                      {quest.type}
                    </span>
                    <p className={`text-sm font-body truncate ${quest.completed ? "line-through" : ""}`}>
                      {quest.name}
                    </p>
                  </div>
                  <ProgressBar
                    value={quest.completed ? quest.total : quest.progress}
                    max={quest.total}
                    variant={quest.completed ? "green" : "amber"}
                    showValue={false}
                  />
                </>
              )}
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <div>
                <p className="text-xs font-mono text-neon-green">+{quest.xpReward} XP</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {quest.progress}/{quest.total}
                </p>
              </div>
              {editMode && (
                <div className="flex flex-col gap-1">
                  <button onClick={() => setEditingId(quest.id)} className="text-muted-foreground hover:text-primary transition-colors"><Edit2 size={12} /></button>
                  <button onClick={() => deleteQuest(quest.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
