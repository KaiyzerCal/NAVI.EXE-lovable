import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, ArrowLeft, Pencil, Search, X, Paperclip, Download, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { toast } from "@/hooks/use-toast";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

interface Thread {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  last_message_at: string;
  other_user_id: string;
  other_display_name: string | null;
  other_navi_name: string | null;
  last_message_preview: string | null;
  preview_is_mine: boolean;
}

interface Message {
  id: string;
  thread_id: string;
  sender_navi_name: string;
  sender_display_name: string | null;
  sender_user_id: string | null;
  content: string;
  created_at: string;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function initials(name: string | null) {
  return (name ?? "?")[0].toUpperCase();
}

function AttachmentView({ url, type, name }: { url: string; type: string | null; name: string | null }) {
  const isImage = type?.startsWith("image/");
  const isVideo = type?.startsWith("video/");

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img src={url} alt={name ?? "attachment"} className="max-w-[220px] max-h-[220px] rounded-xl object-cover border border-white/10 hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  if (isVideo) {
    return (
      <video src={url} controls className="max-w-[260px] rounded-xl mt-1 border border-white/10" />
    );
  }
  return (
    <a
      href={url}
      download={name ?? "file"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 transition-colors max-w-[220px]"
    >
      <FileText size={14} className="shrink-0 text-primary" />
      <span className="text-xs font-mono truncate">{name ?? "Download file"}</span>
      <Download size={12} className="shrink-0 ml-auto" />
    </a>
  );
}

export default function InboxPage() {
  const { user } = useAuth();
  const { profile } = useAppData();
  const { totalUnread, unreadByThread, markThreadRead } = useUnreadMessages();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Delete state
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const [deletingThread, setDeletingThread] = useState(false);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);

  // Profile sheet
  const [profileSheetId, setProfileSheetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeThreadRef = useRef<Thread | null>(null);
  activeThreadRef.current = activeThread;

  // ── Load thread list ─────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    if (!user) return;
    const { data: rows } = await supabase
      .from("navi_message_threads")
      .select("id, sender_user_id, receiver_user_id, last_message_at, deleted_by_sender, deleted_by_recipient")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!rows?.length) { setThreads([]); setLoading(false); return; }

    // Filter out threads the current user has deleted
    const visibleRows = rows.filter((t) => {
      const isSender = t.sender_user_id === user.id;
      if (isSender && (t as any).deleted_by_sender) return false;
      if (!isSender && (t as any).deleted_by_recipient) return false;
      return true;
    });

    if (!visibleRows.length) { setThreads([]); setLoading(false); return; }

    const otherIds = visibleRows.map((t) =>
      t.sender_user_id === user.id ? t.receiver_user_id : t.sender_user_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, navi_name")
      .in("id", otherIds);
    const profileMap: Record<string, any> = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const previews = await Promise.all(
      visibleRows.map((t) =>
        supabase
          .from("navi_messages")
          .select("content, sender_navi_name, attachment_name, attachment_type")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );

    const mapped: Thread[] = visibleRows.map((t, i) => {
      const otherId = t.sender_user_id === user.id ? t.receiver_user_id : t.sender_user_id;
      const other = profileMap[otherId] ?? {};
      const lastMsg = previews[i].data;
      const preview = lastMsg?.content || (lastMsg?.attachment_name ? `📎 ${lastMsg.attachment_name}` : null);
      return {
        id: t.id,
        sender_user_id: t.sender_user_id,
        receiver_user_id: t.receiver_user_id,
        last_message_at: t.last_message_at,
        other_user_id: otherId,
        other_display_name: other.display_name ?? null,
        other_navi_name: other.navi_name ?? null,
        last_message_preview: preview,
        preview_is_mine: lastMsg?.sender_navi_name === profile.navi_name,
      };
    });

    setThreads(mapped);
    setLoading(false);
  }, [user, profile.navi_name]);

  useEffect(() => { if (user) loadThreads(); }, [user, loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Realtime: live messages in open thread ───────────────────────────────
  useEffect(() => {
    if (!activeThread) return;
    const channel = supabase
      .channel(`inbox-msg-${activeThread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_messages", filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          const msg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, sender_display_name: null }];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread?.id]);

  // ── Realtime: thread list refresh ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("inbox-threads-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_message_threads" }, loadThreads)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_message_threads" }, loadThreads)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadThreads]);

  // ── Open thread + mark read ──────────────────────────────────────────────
  async function openThread(thread: Thread) {
    setActiveThread(thread);
    setComposing(false);
    const { data } = await supabase
      .from("navi_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []).map((m: any) => ({ ...m, sender_display_name: null })));
    // Mark as read
    const isSender = thread.sender_user_id === user?.id;
    await markThreadRead(thread.id, isSender);
  }

  // ── Send text message ────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    const optimisticId = crypto.randomUUID();
    const body = input.trim();
    setInput("");
    const optimistic: Message = {
      id: optimisticId,
      thread_id: activeThread.id,
      sender_navi_name: profile.navi_name,
      sender_display_name: profile.display_name,
      sender_user_id: user.id,
      content: body,
      created_at: new Date().toISOString(),
      attachment_url: null, attachment_type: null, attachment_name: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted } = await supabase
      .from("navi_messages")
      .insert({ thread_id: activeThread.id, sender_navi_name: profile.navi_name, sender_user_id: user.id, content: body } as any)
      .select()
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticId ? { ...inserted, sender_display_name: profile.display_name } : m)
      );
    }

    await supabase
      .from("navi_message_threads")
      .update({ last_message_at: new Date().toISOString() } as any)
      .eq("id", activeThread.id);

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, last_message_preview: body, last_message_at: new Date().toISOString(), preview_is_mine: true }
          : t
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    );
    setSending(false);
  }

  // ── Upload file + send as attachment ────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeThread || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${activeThread.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("message-attachments")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      console.error("Upload failed:", uploadErr);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(path);
    const url = urlData.publicUrl;
    const attachType = file.type || "file";

    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      thread_id: activeThread.id,
      sender_navi_name: profile.navi_name,
      sender_display_name: profile.display_name,
      sender_user_id: user.id,
      content: "",
      created_at: new Date().toISOString(),
      attachment_url: url,
      attachment_type: attachType,
      attachment_name: file.name,
    };
    setMessages((prev) => [...prev, optimistic]);

    const { data: inserted } = await supabase
      .from("navi_messages")
      .insert({
        thread_id: activeThread.id,
        sender_navi_name: profile.navi_name,
        sender_user_id: user.id,
        content: "",
        attachment_url: url,
        attachment_type: attachType,
        attachment_name: file.name,
      } as any)
      .select()
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticId ? { ...inserted, sender_display_name: profile.display_name } : m)
      );
    }

    await supabase
      .from("navi_message_threads")
      .update({ last_message_at: new Date().toISOString() } as any)
      .eq("id", activeThread.id);

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, last_message_preview: `📎 ${file.name}`, last_message_at: new Date().toISOString(), preview_is_mine: true }
          : t
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    );

    e.target.value = "";
    setUploading(false);
  }

  // ── Operator search ──────────────────────────────────────────────────────
  async function searchOperators(query: string) {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, navi_name, operator_level")
      .ilike("display_name", `%${query}%`)
      .neq("id", user!.id)
      .limit(8);
    setSearchResults(data ?? []);
    setSearching(false);
  }

  async function startThread(target: { id: string; display_name: string | null; navi_name: string | null }) {
    if (!user) return;
    const { data: existing } = await supabase
      .from("navi_message_threads")
      .select("*")
      .or(
        `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${target.id}),` +
        `and(sender_user_id.eq.${target.id},receiver_user_id.eq.${user.id})`
      )
      .maybeSingle();

    const row = existing ?? (await supabase
      .from("navi_message_threads")
      .insert({ sender_user_id: user.id, receiver_user_id: target.id })
      .select()
      .single()
    ).data;

    if (!row) return;
    setSearchQuery(""); setSearchResults([]);
    openThread({
      id: row.id,
      sender_user_id: row.sender_user_id,
      receiver_user_id: row.receiver_user_id,
      last_message_at: row.last_message_at,
      other_user_id: target.id,
      other_display_name: target.display_name,
      other_navi_name: target.navi_name,
      last_message_preview: null,
      preview_is_mine: false,
    });
  }

  // ── Delete thread (soft delete) ──────────────────────────────────────────
  async function deleteThread(thread: Thread) {
    if (!user) return;
    setDeletingThread(true);
    const isSender = thread.sender_user_id === user.id;
    const col = isSender ? "deleted_by_sender" : "deleted_by_recipient";
    await supabase
      .from("navi_message_threads")
      .update({ [col]: true } as any)
      .eq("id", thread.id);
    setThreads((prev) => prev.filter((t) => t.id !== thread.id));
    setDeleteThreadId(null);
    setDeletingThread(false);
    toast({ title: "Conversation removed from your inbox." });
  }

  // ── Delete individual message (soft delete) ──────────────────────────────
  async function deleteMessage(msg: Message) {
    if (!user) return;
    const isSender = msg.sender_user_id === user.id;
    const col = isSender ? "deleted_by_sender" : "deleted_by_recipient";
    await supabase
      .from("navi_messages")
      .update({ [col]: true } as any)
      .eq("id", msg.id);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id
          ? { ...m, deleted_by_sender: isSender ? true : m.deleted_by_sender, deleted_by_recipient: !isSender ? true : m.deleted_by_recipient }
          : m
      )
    );
    setDeleteMsgId(null);
  }

  // ── Is message visibly deleted for current user ──────────────────────────
  function isDeleted(msg: Message): boolean {
    if (!user) return false;
    const isSender = msg.sender_user_id === user.id;
    return isSender ? msg.deleted_by_sender : msg.deleted_by_recipient;
  }

  // ────────────────────────────────────────────────────────────────────────
  // THREAD DETAIL
  // ────────────────────────────────────────────────────────────────────────
  if (activeThread) {
    const isMine = (msg: Message) => msg.sender_user_id === user?.id || msg.sender_navi_name === profile.navi_name;

    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border shrink-0">
          <button onClick={() => setActiveThread(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={() => setProfileSheetId(activeThread.other_user_id)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-display font-bold text-primary">{initials(activeThread.other_display_name)}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-body font-semibold text-foreground leading-tight">{activeThread.other_display_name ?? "Operator"}</p>
              <p className="text-[9px] font-mono text-muted-foreground">{activeThread.other_navi_name ?? "NAVI"}</p>
            </div>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
          {messages.length === 0 && (
            <p className="text-center text-xs font-mono text-muted-foreground py-8">No messages yet. Say something.</p>
          )}
          {messages.map((msg) => {
            const mine = isMine(msg);
            const deleted = isDeleted(msg);
            const showDeleteBtn = deleteMsgId === msg.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${mine ? "items-end" : "items-start"} group`}
              >
                <span className="text-[9px] font-mono text-muted-foreground mb-0.5 px-1">
                  {msg.sender_display_name ?? msg.sender_navi_name}
                </span>
                <div className="relative flex items-end gap-1.5">
                  {/* Delete button — appears on hover/tap (desktop: left side for mine, right side for theirs) */}
                  {!deleted && (
                    <button
                      onClick={() => setDeleteMsgId(deleteMsgId === msg.id ? null : msg.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 p-0.5 ${mine ? "order-first" : "order-last"}`}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                  {deleted ? (
                    <div className={`px-3 py-2 rounded-2xl text-sm italic text-muted-foreground/50 border border-border/30 ${mine ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                      [Message deleted]
                    </div>
                  ) : (
                    <div className={`max-w-[75%] ${msg.content || msg.attachment_url ? `px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
                      mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 border border-border text-foreground rounded-bl-sm"
                    }` : ""}`}>
                      {msg.content || null}
                      {msg.attachment_url && (
                        <AttachmentView url={msg.attachment_url} type={msg.attachment_type} name={msg.attachment_name} />
                      )}
                    </div>
                  )}
                </div>

                {/* Delete confirm popover */}
                <AnimatePresence>
                  {showDeleteBtn && !deleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`mt-1 px-1 flex items-center gap-1.5 ${mine ? "self-end" : "self-start"}`}
                    >
                      <span className="text-[9px] font-mono text-muted-foreground">Delete for you?</span>
                      <button
                        onClick={() => deleteMessage(msg)}
                        className="text-[9px] font-mono text-destructive border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 rounded hover:bg-destructive/20 transition-colors"
                      >
                        DELETE
                      </button>
                      <button
                        onClick={() => setDeleteMsgId(null)}
                        className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded hover:text-foreground transition-colors"
                      >
                        CANCEL
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <span className="text-[8px] font-mono text-muted-foreground/50 mt-0.5 px-1">{timeAgo(msg.created_at)}</span>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-2 pt-2 border-t border-border shrink-0 items-end">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors shrink-0 disabled:opacity-40"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${activeThread.other_display_name ?? "Operator"}...`}
            autoFocus
            className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm font-body text-foreground outline-none focus:border-primary/50"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:bg-primary/80 transition-colors shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // THREAD LIST
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
            MESSAGES
            {totalUnread > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-destructive text-[10px] font-bold text-white px-1.5">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground">// DIRECT OPERATOR COMMS</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
        >
          <Pencil size={12} /> COMPOSE
        </button>
      </div>

      {/* Compose panel */}
      {composing && (
        <div className="mb-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground">NEW MESSAGE</p>
            <button onClick={() => { setComposing(false); setSearchQuery(""); setSearchResults([]); }}>
              <X size={14} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => searchOperators(e.target.value)}
              placeholder="Search operators by name..."
              autoFocus
              className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/50"
            />
          </div>
          {searching && <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-primary" /></div>}
          <div className="space-y-1">
            {searchResults.map((r) => (
              <button key={r.id} onClick={() => startThread(r)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-bold text-primary">{initials(r.display_name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body text-foreground truncate">{r.display_name ?? "Operator"}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">LV.{r.operator_level} · {r.navi_name ?? "NAVI"}</p>
                </div>
                <span className="text-[10px] font-mono text-primary shrink-0">→</span>
              </button>
            ))}
            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground py-2 text-center">No operators found.</p>
            )}
          </div>
        </div>
      )}

      {/* Thread list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="animate-spin text-primary" size={20} />
          <p className="text-xs font-mono text-muted-foreground">Loading messages...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-mono text-muted-foreground text-sm mb-1">No conversations yet.</p>
          <p className="text-xs text-muted-foreground/60">Tap COMPOSE to message an operator.</p>
        </div>
      ) : (
        <AnimatePresence>
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {threads.map((thread, i) => {
            const unread = unreadByThread[thread.id] ?? 0;
            const showDeleteConfirm = deleteThreadId === thread.id;
            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ delay: i * 0.03 }}
                className={`relative flex items-center gap-3 px-4 py-3.5 transition-colors group ${
                  unread > 0 ? "bg-primary/5 hover:bg-primary/10" : "bg-card hover:bg-muted/30"
                }`}
              >
                {/* Main click area */}
                <button
                  onClick={() => openThread(thread)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-sm font-display font-bold text-primary">{initials(thread.other_display_name)}</span>
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-body truncate ${unread > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {thread.other_display_name ?? "Operator"}
                      </p>
                      <span className={`text-[9px] font-mono shrink-0 ml-2 ${unread > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {timeAgo(thread.last_message_at)}
                      </span>
                    </div>
                    {thread.last_message_preview ? (
                      <p className={`text-xs font-body truncate ${unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {thread.preview_is_mine ? "You: " : ""}{thread.last_message_preview}
                      </p>
                    ) : (
                      <p className="text-xs font-mono text-muted-foreground/50">No messages yet</p>
                    )}
                  </div>
                </button>

                {/* Hover trash icon */}
                {!showDeleteConfirm && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteThreadId(thread.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Delete confirm inline */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1.5 shadow-lg z-10"
                    >
                      <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">Remove from inbox?</span>
                      <button
                        onClick={() => deleteThread(thread)}
                        disabled={deletingThread}
                        className="text-[9px] font-mono text-destructive border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 rounded hover:bg-destructive/20 transition-colors disabled:opacity-50"
                      >
                        {deletingThread ? <Loader2 size={9} className="animate-spin" /> : "DELETE"}
                      </button>
                      <button
                        onClick={() => setDeleteThreadId(null)}
                        className="text-[9px] font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded hover:text-foreground transition-colors"
                      >
                        CANCEL
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
      )}

      {/* Operator profile sheet from thread header tap */}
      {profileSheetId && (
        <OperatorProfileSheet
          operatorId={profileSheetId}
          isOpen
          onClose={() => setProfileSheetId(null)}
        />
      )}
    </div>
  );
}
