import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Edit2, Trash2, Save, X, Eye, Loader2, Image as ImageIcon, Film, FileText, Grid } from "lucide-react";
import { useOwner } from "@/hooks/useOwner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UploadZone, { MediaThumbnail, MediaLightbox } from "@/components/UploadZone";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  xp_earned: number;
}

interface MediaFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  ai_description?: string | null;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
  created_at: string;
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
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [entryMedia, setEntryMedia] = useState<Record<string, MediaFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "" });
  const [newEntryFiles, setNewEntryFiles] = useState<MediaFile[]>([]);
  const [lightboxFile, setLightboxFile] = useState<MediaFile | null>(null);
  const [activeTab, setActiveTab] = useState<"entries" | "media">("entries");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("journal_entries").select("id, title, content, created_at, tags, xp_earned")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("media" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([entriesRes, mediaRes]) => {
      if (entriesRes.data) setEntries(entriesRes.data as JournalEntry[]);
      const media = (mediaRes.data || []) as MediaFile[];
      setAllMedia(media);
      // Group media by linked journal entry
      const grouped: Record<string, MediaFile[]> = {};
      for (const m of media) {
        if (m.linked_entity_type === "journal" && m.linked_entity_id) {
          if (!grouped[m.linked_entity_id]) grouped[m.linked_entity_id] = [];
          grouped[m.linked_entity_id].push(m);
        }
      }
      setEntryMedia(grouped);
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
    if (data) {
      const entry = data as JournalEntry;
      setEntries((prev) => [entry, ...prev]);
      // Link any uploaded files to this entry
      if (newEntryFiles.length > 0) {
        for (const f of newEntryFiles) {
          await supabase.from("media" as any).update({
            linked_entity_type: "journal",
            linked_entity_id: entry.id,
          }).eq("id", f.id);
        }
        setEntryMedia((prev) => ({ ...prev, [entry.id]: newEntryFiles }));
        setAllMedia((prev) => [...newEntryFiles, ...prev]);
      }
    }
    setNewEntry({ title: "", content: "", tags: "" });
    setNewEntryFiles([]);
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

      {/* Tabs: Entries / Media */}
      <div className="flex gap-2 mb-4">
        {(["entries", "media"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase transition-colors ${
              activeTab === tab ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}>
            {tab === "entries" ? "ENTRIES" : "MEDIA"}
          </button>
        ))}
      </div>

      {activeTab === "media" ? (
        <div>
          <div className="mb-4">
            <UploadZone onUploadComplete={(f) => setAllMedia((prev) => [f as MediaFile, ...prev])} />
          </div>
          {allMedia.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-mono">No media uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {allMedia.map((m) => (
                <div key={m.id} className="relative">
                  <MediaThumbnail file={m} onClick={() => setLightboxFile(m)} />
                  {m.ai_description && (
                    <p className="text-[8px] font-mono text-muted-foreground mt-0.5 line-clamp-2">{m.ai_description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
                <UploadZone compact onUploadComplete={(f) => setNewEntryFiles((prev) => [...prev, f as MediaFile])} />
                {newEntryFiles.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {newEntryFiles.map((f) => (
                      <MediaThumbnail key={f.id} file={f} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addEntry} className="text-xs font-mono"><Save size={10} className="mr-1" /> SAVE</Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewEntryFiles([]); }} className="text-xs font-mono"><X size={10} className="mr-1" /> CANCEL</Button>
              </div>
            </motion.div>
          )}

          {entries.length === 0 && !showAdd && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-mono">No journal entries yet. Start writing to log your journey.</p>
            </div>
          )}

          <div className="space-y-3">
            {entries.map((entry, i) => {
              const media = entryMedia[entry.id] || [];
              const images = media.filter((m) => m.file_type === "image");
              const videos = media.filter((m) => m.file_type === "video");
              const docs = media.filter((m) => m.file_type === "document");

              return (
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
                      <UploadZone compact linkedEntityType="journal" linkedEntityId={entry.id}
                        onUploadComplete={(f) => {
                          setEntryMedia((prev) => ({ ...prev, [entry.id]: [...(prev[entry.id] || []), f as MediaFile] }));
                          setAllMedia((prev) => [f as MediaFile, ...prev]);
                        }} />
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

                      {/* Attached media */}
                      {images.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mb-2">
                          {images.map((img) => (
                            <MediaThumbnail key={img.id} file={img} onClick={() => setLightboxFile(img)} />
                          ))}
                        </div>
                      )}
                      {videos.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {videos.map((vid) => (
                            <div key={vid.id}>
                              <video src={vid.file_url} controls className="w-full max-w-md rounded border border-border" />
                              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                                {vid.file_name} — {(vid.file_size / (1024 * 1024)).toFixed(1)} MB
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {docs.length > 0 && (
                        <div className="flex flex-col gap-1 mb-2">
                          {docs.map((doc) => (
                            <div key={doc.id}>
                              <MediaThumbnail file={doc} />
                              {doc.ai_description && (
                                <p className="text-[9px] font-mono text-muted-foreground mt-0.5 ml-5">{doc.ai_description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

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
              );
            })}
          </div>
        </>
      )}

      <MediaLightbox file={lightboxFile} onClose={() => setLightboxFile(null)} />
    </div>
  );
}
