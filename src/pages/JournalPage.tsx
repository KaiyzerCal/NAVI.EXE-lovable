import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Calendar, X, Copy, Pencil, Loader2, Images, FileText, Film } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import type { JournalEntry } from "@/hooks/useJournal";
import UploadZone, { MediaThumbnail, MediaLightbox } from "@/components/UploadZone";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  ai_description?: string | null;
  created_at?: string;
}

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
  title, initial, saving, entryId, onSave, onCancel,
}: {
  title: string; initial: FormState; saving?: boolean;
  entryId?: string;
  onSave: (f: FormState) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [attached, setAttached] = useState<MediaFile[]>([]);
  const [lightbox, setLightbox] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (!entryId) return;
    supabase
      .from("media")
      .select("*")
      .eq("linked_entity_type", "journal")
      .eq("linked_entity_id", entryId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAttached(data as MediaFile[]);
      });
  }, [entryId]);

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
          <label className="text-[10px] font-mono text-muted-foreground block mb-1">ATTACHMENTS</label>
          {attached.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attached.map((f) => (
                <MediaThumbnail key={f.id} file={f} onClick={() => setLightbox(f)} />
              ))}
            </div>
          )}
          {entryId ? (
            <UploadZone
              compact
              linkedEntityType="journal"
              linkedEntityId={entryId}
              onUploadComplete={(f) => setAttached((prev) => [f as MediaFile, ...prev])}
            />
          ) : (
            <p className="text-[10px] font-mono text-muted-foreground italic">
              Save the entry first to attach files.
            </p>
          )}
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
      <MediaLightbox file={lightbox} onClose={() => setLightbox(null)} />
    </HudCard>
  );
}

// ─── Entry Detail Modal ────────────────────────────────────────────────────────
function EntryModal({
  entry, onClose, onEdit, onDelete,
}: {
  entry: JournalEntry; onClose: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [lightbox, setLightbox] = useState<MediaFile | null>(null);

  useEffect(() => {
    supabase
      .from("media")
      .select("*")
      .eq("linked_entity_type", "journal")
      .eq("linked_entity_id", entry.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setMedia(data as MediaFile[]);
      });
  }, [entry.id]);

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
        {media.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] font-mono text-muted-foreground mb-2">ATTACHMENTS</p>
            <div className="flex flex-wrap gap-2">
              {media.map((f) => (
                <MediaThumbnail key={f.id} file={f} onClick={() => setLightbox(f)} />
              ))}
            </div>
          </div>
        )}
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
      <MediaLightbox file={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { entries, journalLoading: loading, createEntry, updateEntry, deleteEntry } = useAppData();
  const { user } = useAuth();
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"entries" | "gallery">("entries");
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video" | "document">("all");
  const [galleryLightbox, setGalleryLightbox] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (view !== "gallery" || !user) return;
    setMediaLoading(true);
    supabase
      .from("media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAllMedia(data as MediaFile[]);
        setMediaLoading(false);
      });
  }, [view, user]);

  const filteredMedia = allMedia.filter((m) =>
    mediaFilter === "all" ? true : m.file_type === mediaFilter
  );

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
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded overflow-hidden">
            <button
              onClick={() => setView("entries")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors ${
                view === "entries" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen size={12} /> ENTRIES
            </button>
            <button
              onClick={() => setView("gallery")}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-l border-border transition-colors ${
                view === "gallery" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Images size={12} /> GALLERY
            </button>
          </div>
          {view === "entries" && (
            <button onClick={() => { setShowNewForm(true); setEditingEntry(null); }}
              className="flex items-center gap-2 px-3 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-sm font-display hover:bg-primary/20 transition-colors">
              <Plus size={14} /> NEW ENTRY
            </button>
          )}
        </div>
      </PageHeader>

      {/* New / Edit Form */}
      <AnimatePresence>
        {view === "entries" && (showNewForm || editingEntry) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
            <EntryFormCard
              title={editingEntry ? "EDIT ENTRY" : "NEW ENTRY"}
              saving={saving}
              entryId={editingEntry?.id}
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

      {/* Gallery view */}
      {view === "gallery" && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "image", "video", "document"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setMediaFilter(f)}
                className={`px-3 py-1.5 text-[10px] font-mono rounded border transition-colors ${
                  mediaFilter === f
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.toUpperCase()}
                {f !== "all" && (
                  <span className="ml-1.5 opacity-60">
                    {allMedia.filter((m) => m.file_type === f).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {mediaLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-primary" size={20} />
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="text-center py-16">
              <Images size={36} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs font-mono text-muted-foreground">NO MEDIA UPLOADED YET</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-2">
                Attach files to journal entries to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredMedia.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="group cursor-pointer"
                  onClick={() => setGalleryLightbox(file)}
                >
                  <div className="relative aspect-square bg-muted border border-border rounded overflow-hidden group-hover:border-primary/40 transition-colors">
                    {file.file_type === "image" ? (
                      <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" loading="lazy" />
                    ) : file.file_type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={28} className="text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText size={28} className="text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground truncate mt-1">{file.file_name}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/60">
                    {new Date(file.created_at as any).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          <MediaLightbox file={galleryLightbox} onClose={() => setGalleryLightbox(null)} />
        </div>
      )}

      {/* Empty state */}
      {view === "entries" && entries.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={36} className="mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono text-muted-foreground mb-4">NO JOURNAL ENTRIES YET</p>
          <button onClick={() => setShowNewForm(true)} className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/20 transition-colors">
            WRITE FIRST ENTRY
          </button>
        </div>
      ) : view === "entries" ? (
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
      ) : null}

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
