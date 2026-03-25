import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Edit2, Trash2, Save, X, Eye, Loader2, ChevronDown, ChevronUp, Tag, AlertCircle } from "lucide-react";
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
  category: string;
  importance: string;
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

const CATEGORIES = ["personal", "business", "legal", "evidence", "achievement"] as const;
const IMPORTANCE_LEVELS = ["low", "medium", "high", "critical"] as const;

const categoryColors: Record<string, string> = {
  personal: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30",
  business: "bg-neon-purple/10 text-neon-purple border-neon-purple/30",
  legal: "bg-neon-amber/10 text-neon-amber border-neon-amber/30",
  evidence: "bg-neon-pink/10 text-neon-pink border-neon-pink/30",
  achievement: "bg-neon-green/10 text-neon-green border-neon-green/30",
};

const importanceColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-neon-cyan",
  high: "text-neon-amber",
  critical: "text-destructive",
};

const importanceIcons: Record<string, string> = {
  low: "○",
  medium: "◑",
  high: "●",
  critical: "◉",
};

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", content: "", tags: "", category: "personal", importance: "medium" });
  const [newEntryFiles, setNewEntryFiles] = useState<MediaFile[]>([]);
  const [lightboxFile, setLightboxFile] = useState<MediaFile | null>(null);
  const [activeTab, setActiveTab] = useState<"entries" | "media">("entries");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("journal_entries").select("id, title, content, created_at, tags, xp_earned, category, importance")
        .eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("media" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([entriesRes, mediaRes]) => {
      if (entriesRes.data) setEntries(entriesRes.data as JournalEntry[]);
      const media = ((mediaRes.data || []) as unknown) as MediaFile[];
      setAllMedia(media);
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
      .insert({
        user_id: user.id, title: newEntry.title, content: newEntry.content, tags, xp_earned: 10,
        category: newEntry.category, importance: newEntry.importance,
      } as any)
      .select("id, title, content, created_at, tags, xp_earned, category, importance")
      .single();
    if (data) {
      const entry = data as JournalEntry;
      setEntries((prev) => [entry, ...prev]);
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
    setNewEntry({ title: "", content: "", tags: "", category: "personal", importance: "medium" });
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

  const filteredEntries = categoryFilter === "all"
    ? entries
    : entries.filter((e) => e.category === categoryFilter);

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

      {/* Tabs */}
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
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap mb-4">
            <button onClick={() => setCategoryFilter("all")}
              className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-colors ${
                categoryFilter === "all" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground border border-transparent hover:border-border"
              }`}>ALL</button>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-colors border ${
                  categoryFilter === cat ? categoryColors[cat] : "text-muted-foreground border-transparent hover:border-border"
                }`}>{cat}</button>
            ))}
          </div>

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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">CATEGORY</label>
                    <select value={newEntry.category} onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value }))}
                      className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-muted-foreground block mb-1">IMPORTANCE</label>
                    <select value={newEntry.importance} onChange={(e) => setNewEntry((p) => ({ ...p, importance: e.target.value }))}
                      className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                      {IMPORTANCE_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
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

          {filteredEntries.length === 0 && !showAdd && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm font-mono">No journal entries yet. Start writing to log your journey.</p>
            </div>
          )}

          <div className="space-y-2">
            {filteredEntries.map((entry, i) => {
              const media = entryMedia[entry.id] || [];
              const images = media.filter((m) => m.file_type === "image");
              const videos = media.filter((m) => m.file_type === "video");
              const docs = media.filter((m) => m.file_type === "document");
              const isExpanded = expandedId === entry.id;
              const isEditing = editMode && editingId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border border-border rounded hover:border-primary/20 transition-colors"
                >
                  {isEditing ? (
                    <div className="p-4 space-y-2">
                      <Input className="h-7 text-xs" defaultValue={entry.title} onBlur={(e) => updateEntry(entry.id, { title: e.target.value })} />
                      <textarea
                        className="w-full h-20 rounded border border-input bg-background px-3 py-2 text-xs font-body resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        defaultValue={entry.content}
                        onBlur={(e) => updateEntry(entry.id, { content: e.target.value })}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select defaultValue={entry.category} onChange={(e) => updateEntry(entry.id, { category: e.target.value })}
                          className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                        <select defaultValue={entry.importance} onChange={(e) => updateEntry(entry.id, { importance: e.target.value })}
                          className="bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                          {IMPORTANCE_LEVELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                        </select>
                      </div>
                      <UploadZone compact linkedEntityType="journal" linkedEntityId={entry.id}
                        onUploadComplete={(f) => {
                          setEntryMedia((prev) => ({ ...prev, [entry.id]: [...(prev[entry.id] || []), f as MediaFile] }));
                          setAllMedia((prev) => [f as MediaFile, ...prev]);
                        }} />
                      <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setEditingId(null)}>DONE</Button>
                    </div>
                  ) : (
                    <>
                      {/* Collapsed row - always visible */}
                      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-mono ${importanceColors[entry.importance || "medium"]}`}>
                              {importanceIcons[entry.importance || "medium"]}
                            </span>
                            <h3 className="font-display text-sm font-semibold text-foreground truncate">{entry.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${categoryColors[entry.category || "personal"] || "bg-muted text-muted-foreground border-border"}`}>
                              {(entry.category || "personal").toUpperCase()}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-neon-green">+{entry.xp_earned} XP</span>
                          {editMode && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setEditingId(entry.id); }} className="text-muted-foreground hover:text-primary"><Edit2 size={12} /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
                            </>
                          )}
                          {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-border">
                            <div className="p-4 space-y-3">
                              <p className="text-sm font-body text-muted-foreground whitespace-pre-wrap">{entry.content}</p>

                              {/* Attached media */}
                              {images.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {images.map((img) => (
                                    <MediaThumbnail key={img.id} file={img} onClick={() => setLightboxFile(img)} />
                                  ))}
                                </div>
                              )}
                              {videos.length > 0 && (
                                <div className="space-y-2">
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
                                <div className="flex flex-col gap-1">
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

                              {/* Tags */}
                              {entry.tags.length > 0 && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {entry.tags.map((tag) => (
                                    <span key={tag} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColors[tag] || "bg-muted text-muted-foreground"}`}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
