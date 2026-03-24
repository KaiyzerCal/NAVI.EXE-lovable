import PageHeader from "@/components/PageHeader";
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Edit2, Trash2, Save, X, Eye } from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: Date;
  tags: string[];
  xpEarned: number;
}

const initialEntries: JournalEntry[] = [
  { id: "1", title: "Morning Reflection", content: "Good start to the day. Focus session went well — completed 3 pomodoros on the side project. Need to improve evening routine.", date: new Date(2026, 2, 21), tags: ["reflection", "focus"], xpEarned: 10 },
  { id: "2", title: "Breakthrough on API Design", content: "Finally figured out the auth flow for the backend. Key insight: keep the token refresh logic server-side.", date: new Date(2026, 2, 20), tags: ["coding", "insight"], xpEarned: 25 },
  { id: "3", title: "Fitness Check-in", content: "Hit a new PR on deadlifts. Recovery is improving. Sleep score was 85 last night.", date: new Date(2026, 2, 19), tags: ["fitness", "health"], xpEarned: 10 },
  { id: "4", title: "Weekly Review", content: "Completed 5/7 daily quests this week. Epic quest at 30%. Need to allocate more time to reading.", date: new Date(2026, 2, 18), tags: ["review", "planning"], xpEarned: 50 },
];

const tagColors: Record<string, string> = {
  reflection: "bg-neon-cyan/10 text-neon-cyan",
  focus: "bg-neon-purple/10 text-neon-purple",
  coding: "bg-neon-amber/10 text-neon-amber",
  insight: "bg-neon-green/10 text-neon-green",
  fitness: "bg-neon-pink/10 text-neon-pink",
  health: "bg-neon-green/10 text-neon-green",
  review: "bg-neon-cyan/10 text-neon-cyan",
  planning: "bg-neon-amber/10 text-neon-amber",
};

export default function JournalPage() {
  const isOwner = useOwner();
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "" });

  const addEntry = () => {
    if (!newEntry.title.trim()) return;
    setEntries((prev) => [
      { id: Date.now().toString(), title: newEntry.title, content: newEntry.content, date: new Date(), tags: newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean), xpEarned: 10 },
      ...prev,
    ]);
    setNewEntry({ title: "", content: "", tags: "" });
    setShowAdd(false);
  };

  const deleteEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));
  const updateEntry = (id: string, updates: Partial<JournalEntry>) => setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));

  return (
    <div>
      <PageHeader title="JOURNAL" subtitle="// VAULT ENTRIES">
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
            <Plus size={14} /> NEW ENTRY
          </button>
        </div>
      </PageHeader>

      {/* Add Entry Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/20 rounded p-4 mb-4">
          <div className="space-y-3 mb-3">
            <Input placeholder="Entry title..." value={newEntry.title} onChange={(e) => setNewEntry((p) => ({ ...p, title: e.target.value }))} className="h-8 text-xs" />
            <textarea
              placeholder="Write your entry..."
              value={newEntry.content}
              onChange={(e) => setNewEntry((p) => ({ ...p, content: e.target.value }))}
              className="w-full h-24 rounded border border-input bg-background px-3 py-2 text-sm font-body placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Input placeholder="Tags (comma separated)" value={newEntry.tags} onChange={(e) => setNewEntry((p) => ({ ...p, tags: e.target.value }))} className="h-8 text-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addEntry} className="text-xs font-mono"><Save size={10} className="mr-1" /> SAVE</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="text-xs font-mono"><X size={10} className="mr-1" /> CANCEL</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded p-4 hover:border-primary/20 transition-colors"
          >
            {editMode && editingId === entry.id ? (
              <div className="space-y-2">
                <Input className="h-7 text-xs" defaultValue={entry.title} onBlur={(e) => updateEntry(entry.id, { title: e.target.value })} />
                <textarea
                  className="w-full h-20 rounded border border-input bg-background px-3 py-2 text-xs font-body resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue={entry.content}
                  onBlur={(e) => updateEntry(entry.id, { content: e.target.value })}
                />
                <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setEditingId(null)}>DONE</Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display text-sm font-semibold text-foreground">{entry.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-neon-green">+{entry.xpEarned} XP</span>
                    {editMode && (
                      <>
                        <button onClick={() => setEditingId(entry.id)} className="text-muted-foreground hover:text-primary"><Edit2 size={12} /></button>
                        <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm font-body text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {entry.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {entry.date.toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
