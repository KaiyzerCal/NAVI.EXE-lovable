import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import { Send, Loader2, ArrowLeft, Pencil, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

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
  content: string;
  created_at: string;
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

export default function InboxPage() {
  const { user } = useAuth();
  const { profile } = useAppData();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Compose / search state
  const [composing, setComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeThreadRef = useRef<Thread | null>(null);
  activeThreadRef.current = activeThread;

  // ── Load thread list ────────────────────────────────────────────────────
  const loadThreads = useCallback(async () => {
    if (!user) return;

    // Step 1: fetch raw thread rows (no nested join — avoids type issues)
    const { data: rows } = await supabase
      .from("navi_message_threads")
      .select("id, sender_user_id, receiver_user_id, last_message_at")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!rows?.length) { setThreads([]); setLoading(false); return; }

    // Step 2: batch-fetch the "other" user profiles
    const otherIds = rows.map((t) =>
      t.sender_user_id === user.id ? t.receiver_user_id : t.sender_user_id
    );
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, navi_name")
      .in("id", otherIds);
    const profileMap: Record<string, { display_name: string | null; navi_name: string | null }> =
      Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

    // Step 3: batch-fetch last message preview for each thread
    const previews = await Promise.all(
      rows.map((t) =>
        supabase
          .from("navi_messages")
          .select("content, sender_navi_name")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );

    const mapped: Thread[] = rows.map((t, i) => {
      const otherId = t.sender_user_id === user.id ? t.receiver_user_id : t.sender_user_id;
      const other = profileMap[otherId] ?? { display_name: null, navi_name: null };
      const lastMsg = previews[i].data;
      return {
        id: t.id,
        sender_user_id: t.sender_user_id,
        receiver_user_id: t.receiver_user_id,
        last_message_at: t.last_message_at,
        other_user_id: otherId,
        other_display_name: other.display_name,
        other_navi_name: other.navi_name,
        last_message_preview: lastMsg?.content ?? null,
        preview_is_mine: lastMsg?.sender_navi_name === profile.navi_name,
      };
    });

    setThreads(mapped);
    setLoading(false);
  }, [user, profile.navi_name]);

  useEffect(() => { if (user) loadThreads(); }, [user, loadThreads]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Realtime: new messages in the open thread ───────────────────────────
  useEffect(() => {
    if (!activeThread) return;
    const channel = supabase
      .channel(`inbox-msg-${activeThread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_messages", filter: `thread_id=eq.${activeThread.id}` },
        async (payload) => {
          const msg = payload.new as any;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg, sender_display_name: null }];
          });
          // Enrich with display name
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("navi_name", msg.sender_navi_name)
            .maybeSingle();
          setMessages((prev) =>
            prev.map((m) => m.id === msg.id ? { ...m, sender_display_name: prof?.display_name ?? null } : m)
          );
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread?.id]);

  // ── Realtime: thread list (new threads or last_message_at updates) ──────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("inbox-threads-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_message_threads" }, () => loadThreads())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_message_threads" }, () => loadThreads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadThreads]);

  // ── Open a thread ────────────────────────────────────────────────────────
  async function openThread(thread: Thread) {
    setActiveThread(thread);
    setComposing(false);
    const { data } = await supabase
      .from("navi_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []).map((m: any) => ({ ...m, sender_display_name: null })));
  }

  // ── Send a message ───────────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    const optimisticId = crypto.randomUUID();
    const optimistic: Message = {
      id: optimisticId,
      thread_id: activeThread.id,
      sender_navi_name: profile.navi_name,
      sender_display_name: profile.display_name,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    const body = input.trim();
    setInput("");

    const { data: inserted } = await supabase
      .from("navi_messages")
      .insert({ thread_id: activeThread.id, sender_navi_name: profile.navi_name, content: body })
      .select()
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimisticId ? { ...inserted, sender_display_name: profile.display_name } : m)
      );
    }

    // Update thread timestamp so both users' lists sort correctly
    await supabase
      .from("navi_message_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeThread.id);

    // Update local thread list preview immediately
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? { ...t, last_message_preview: body, last_message_at: new Date().toISOString(), preview_is_mine: true }
          : t
      ).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    );

    setSending(false);
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

  // ── Start or resume a thread ─────────────────────────────────────────────
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

    const thread: Thread = {
      id: row.id,
      sender_user_id: row.sender_user_id,
      receiver_user_id: row.receiver_user_id,
      last_message_at: row.last_message_at,
      other_user_id: target.id,
      other_display_name: target.display_name,
      other_navi_name: target.navi_name,
      last_message_preview: null,
      preview_is_mine: false,
    };

    setSearchQuery("");
    setSearchResults([]);
    openThread(thread);
  }

  // ────────────────────────────────────────────────────────────────────────
  // THREAD DETAIL VIEW
  // ────────────────────────────────────────────────────────────────────────
  if (activeThread) {
    const isMine = (msg: Message) => msg.sender_navi_name === profile.navi_name;

    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border shrink-0">
          <button onClick={() => setActiveThread(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-display font-bold text-primary">
              {initials(activeThread.other_display_name)}
            </span>
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-foreground leading-tight">
              {activeThread.other_display_name ?? "Operator"}
            </p>
            <p className="text-[9px] font-mono text-muted-foreground">
              {activeThread.other_navi_name ?? "NAVI"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 px-1 pb-2">
          {messages.length === 0 && (
            <p className="text-center text-xs font-mono text-muted-foreground py-8">No messages yet. Say something.</p>
          )}
          {messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="text-[9px] font-mono text-muted-foreground mb-0.5 px-1">
                  {msg.sender_display_name ?? msg.sender_navi_name}
                </span>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/60 border border-border text-foreground rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[8px] font-mono text-muted-foreground/50 mt-0.5 px-1">
                  {timeAgo(msg.created_at)}
                </span>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-border shrink-0">
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
  // THREAD LIST VIEW (Gmail-style)
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-lg font-bold tracking-wider text-foreground">MESSAGES</h1>
          <p className="text-[10px] font-mono text-muted-foreground">// DIRECT OPERATOR COMMS</p>
        </div>
        <button
          onClick={() => setComposing(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/40 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
        >
          <Pencil size={12} /> COMPOSE
        </button>
      </div>

      {/* Compose / search panel */}
      {composing && (
        <div className="mb-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono text-muted-foreground">NEW MESSAGE — search for an operator</p>
            <button onClick={() => { setComposing(false); setSearchQuery(""); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="relative mb-2">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => searchOperators(e.target.value)}
              placeholder="Search by name..."
              autoFocus
              className="w-full bg-muted border border-border rounded-lg pl-8 pr-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/50"
            />
          </div>
          {searching && <div className="flex justify-center py-3"><Loader2 size={14} className="animate-spin text-primary" /></div>}
          <div className="space-y-1">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => startThread(r)}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
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
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {threads.map((thread, i) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openThread(thread)}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 bg-card hover:bg-muted/30 transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-display font-bold text-primary">
                  {initials(thread.other_display_name)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-body font-semibold text-foreground truncate">
                    {thread.other_display_name ?? "Operator"}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0 ml-2">
                    {timeAgo(thread.last_message_at)}
                  </span>
                </div>
                {thread.last_message_preview ? (
                  <p className="text-xs font-body text-muted-foreground truncate">
                    {thread.preview_is_mine ? "You: " : ""}{thread.last_message_preview}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-muted-foreground/50">No messages yet</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
