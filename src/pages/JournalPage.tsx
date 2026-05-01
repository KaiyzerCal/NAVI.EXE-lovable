import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Calendar, X, Copy, Pencil, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import type { JournalEntry } from "@/hooks/useJournal";
import UploadZone from "@/components/UploadZone";

const TAG_COLORS: Record<string, string> = {
  reflection: "bg-neon-cyan/10 text-neon-cyan",
  focus:      "bg-neon-purple/10 text-neon-purple",
  coding:     "bg-neon-amber/10 text-neon-amber",
  insight:    "bg-neon-green/10 text-neon-green",
  fitness:    "bg-pink-500/10 text-pink-400",
  health:     "bg-neon-green/10 text-neon-green",
  review:     "bg-neon-cyan/10 text-neon-cyan",
  planning:   "bg-neon-amber/10 text-neon-amber",
};
const tagColor = (tag: string) => TAG_COLORS[tag] ?? "bg-muted text-muted-foreground";

interface FormState { title: string; content: string; tags: string; }

// ─── Entry Form ────────────────────────────────────────────────────────────────
function EntryFormCard({
  title, initial, saving, onSave, onCancel,
}: {
  title: string; initial: FormState; saving?: boolean;
  onSave: (f: FormState) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  return (
    <HudCard title={title} icon={<BookOpen size={14} />} glow>
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">TITLE *</label>
          <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Entry title..." autoFocus
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">CONTENT</label>
          <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder="What happened? What did you learn? What will you do differently?" rows={5}
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors resize-none" />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">TAGS (comma separated)</label>
          <input type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="focus, coding, insight..."
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 transition-colors" />
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">ATTACHMENTS (optional)</label>
          <UploadZone linkedEntityType="journal_entry" compact />
          <p className="text-[9px] font-mono text-muted-foreground/60 mt-1">// Uploads are saved to your Atlas and visible to NAVI for analysis.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave(form)} disabled={!form.title.trim() || saving}
            className="flex-1 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin" />}
            SAVE ENTRY
          </button>
          <button onClick={onCancel}
            className="px-4 py-2 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors">
            CANCEL
          </button>
        </div>
      </div>
    </HudCard>
  );
}

// ─── Entry Detail Modal ────────────────────────────────────────────────────────
function EntryModal({
  entry, onClose, onEdit, onDelete,
}: {
  entry: JournalEntry; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const copyEntry = () => {
    navigator.clipboard.writeText(`${entry.title}\n${new Date(entry.created_at).toLocaleDateString()}\n\n${entry.content}`);
    toast({ title: "Copied", description: "Entry copied to clipboard." });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-card border border-primary/30 rounded-lg p-5 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <Calendar size={10} />
            {new Date(entry.created_at).toLocaleDateString()}
            <span className="text-neon-green">+{entry.xp_earned} XP</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-3">{entry.title}</h3>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {entry.tags.map((tag) => (
            <span key={tag} className={`text-[10px] font-mono px-2 py-0.5 rounded ${tagColor(tag)}`}>{tag}</span>
          ))}
        </div>
        <p className="text-sm font-body text-foreground/85 leading-relaxed mb-5 select-text whitespace-pre-wrap">{entry.content}</p>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={copyEntry} className="py-2 rounded border border-border bg-muted text-muted-foreground text-xs font-mono flex items-center justify-center gap-1.5 hover:text-foreground transition-colors">
            <Copy size={12} /> COPY
          </button>
          <button onClick={onEdit} className="py-2 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors">
            <Pencil size={12} /> EDIT
          </button>
          <button onClick={onDelete} className="py-2 rounded border border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono flex items-center justify-center gap-1.5 hover:bg-destructive/20 transition-colors">
            <X size={12} /> DELETE
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { entries, journalLoading: loading, createEntry, updateEntry, deleteEntry } = useAppData();
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCreate = useCallback(async (form: FormState) => {
    if (!form.title.trim()) return;
    setSaving(true);
    await createEntry({
      title: form.title,
      content: form.content,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    setShowNewForm(false);
  }, [createEntry]);

  const handleEdit = useCallback(async (form: FormState) => {
    if (!editingEntry || !form.title.trim()) return;
    setSaving(true);
    await updateEntry(editingEntry.id, {
      title: form.title,
      content: form.content,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    setEditingEntry(null);
    setViewingEntry(null);
    toast({ title: "Entry updated" });
  }, [editingEntry, updateEntry]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteEntry(id);
    setViewingEntry(null);
    toast({ title: "Entry deleted" });
  }, [deleteEntry]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="ml-3 text-xs font-mono text-muted-foreground">Loading vault...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="JOURNAL" subtitle="// VAULT ENTRIES">
        <button onClick={() => { setShowNewForm(true); setEditingEntry(null); }}
          className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors">
          <Plus size={14} /> NEW ENTRY
        </button>
      </PageHeader>

      {/* New / Edit Form */}
      <AnimatePresence>
        {(showNewForm || editingEntry) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
            <EntryFormCard
              title={editingEntry ? "EDIT ENTRY" : "NEW ENTRY"}
              saving={saving}
              initial={editingEntry
                ? { title: editingEntry.title, content: editingEntry.content, tags: editingEntry.tags.join(", ") }
                : { title: "", content: "", tags: "" }
              }
              onSave={editingEntry ? handleEdit : handleCreate}
              onCancel={() => { setShowNewForm(false); setEditingEntry(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono text-muted-foreground mb-4">NO JOURNAL ENTRIES YET</p>
          <button onClick={() => setShowNewForm(true)} className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">
            WRITE FIRST ENTRY
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-border rounded p-4 hover:border-primary/20 transition-colors cursor-pointer group"
              onClick={() => setViewingEntry(entry)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-sm font-semibold text-foreground">{entry.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-neon-green">+{entry.xp_earned} XP</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${entry.title}\n\n${entry.content}`);
                      toast({ title: "Copied" });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    title="Copy entry"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-body text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {entry.tags.map((tag) => (
                    <span key={tag} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColor(tag)}`}>{tag}</span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingEntry && !editingEntry && (
          <EntryModal
            entry={viewingEntry}
            onClose={() => setViewingEntry(null)}
            onEdit={() => { setEditingEntry(viewingEntry); setViewingEntry(null); }}
            onDelete={() => handleDelete(viewingEntry.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
