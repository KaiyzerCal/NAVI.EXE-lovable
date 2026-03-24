import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Edit2, Trash2, Save, X, Eye, Loader2 } from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  xp_earned: number;
}

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
  const { user } = useAuth();
  const isOwner = useOwner();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "" });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("journal_entries")
      .select("id, title, content, created_at, tags, xp_earned")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setEntries(data as JournalEntry[]);
        setLoading(false);
      });
  }, [user]);

  const addEntry = async () => {
    if (!newEntry.title.trim() || !user) return;
    const tags = newEntry.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const { data } = await supabase
      .from("journal_entries")
      .insert({ user_id: user.id, title: newEntry.title, content: newEntry.content, tags, xp_earned: 10 } as any)
      .select("id, title, content, created_at, tags, xp_earned")
      .single();
    if (data) setEntries((prev) => [data as JournalEntry, ...prev]);
    setNewEntry({ title: "", content: "", tags: "" });
    setShowAdd(false);
  };

  const deleteEntry = async (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await supabase.from("journal_entries").delete().eq("id", id);
  };

  const updateEntry = async (id: string, updates: Partial<JournalEntry>) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    await supabase.from("journal_entries").update(updates as any).eq("id", id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

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

      {entries.length === 0 && !showAdd && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-mono">No journal entries yet. Start writing to log your journey.</p>
        </div>
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
                    <span className="text-xs font-mono text-neon-green">+{entry.xp_earned} XP</span>
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
                    {new Date(entry.created_at).toLocaleDateString()}
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
