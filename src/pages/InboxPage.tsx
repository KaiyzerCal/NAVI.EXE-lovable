import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { MessageSquare, Send, Loader2, ArrowLeft, Plus, Search } from "lucide-react";
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
}

interface Message {
  id: string;
  thread_id: string;
  sender_navi_name: string;
  sender_display_name: string | null;
  content: string;
  created_at: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeThreadRef = useRef<Thread | null>(null);
  activeThreadRef.current = activeThread;

  useEffect(() => {
    if (user) loadThreads();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime: new messages in active thread
  useEffect(() => {
    if (!activeThread) return;

    const channel = supabase
      .channel(`inbox-thread-${activeThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "navi_messages",
          filter: `thread_id=eq.${activeThread.id}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          // Avoid duplicates from optimistic inserts
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // Fetch sender display_name
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

  // Realtime: thread list updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("inbox-threads-watch")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "navi_message_threads" },
        () => loadThreads()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_message_threads" },
        () => loadThreads()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadThreads() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("navi_message_threads")
      .select("*, sender:sender_user_id(display_name, navi_name), receiver:receiver_user_id(display_name, navi_name)")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    const mapped: Thread[] = await Promise.all(
      (data ?? []).map(async (t: any) => {
        const isSender = t.sender_user_id === user.id;
        const other = isSender ? t.receiver : t.sender;
        const otherId = isSender ? t.receiver_user_id : t.sender_user_id;

        // Fetch last message for preview
        const { data: lastMsg } = await supabase
          .from("navi_messages")
          .select("content")
          .eq("thread_id", t.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          id: t.id,
          sender_user_id: t.sender_user_id,
          receiver_user_id: t.receiver_user_id,
          last_message_at: t.last_message_at,
          other_user_id: otherId,
          other_display_name: other?.display_name ?? null,
          other_navi_name: other?.navi_name ?? null,
          last_message_preview: lastMsg?.content ?? null,
        };
      })
    );
    setThreads(mapped);
    setLoading(false);
  }

  async function openThread(thread: Thread) {
    setActiveThread(thread);
    const { data } = await supabase
      .from("navi_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    setMessages((data ?? []).map((m: any) => ({ ...m, sender_display_name: null })));
  }

  async function sendMessage() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    const optimistic: Message = {
      id: crypto.randomUUID(),
      thread_id: activeThread.id,
      sender_navi_name: profile.navi_name,
      sender_display_name: profile.display_name,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    const { data } = await supabase
      .from("navi_messages")
      .insert({
        thread_id: activeThread.id,
        sender_navi_name: profile.navi_name,
        content: optimistic.content,
      })
      .select()
      .single();

    // Replace optimistic with real row
    if (data) {
      setMessages((prev) =>
        prev.map((m) => m.id === optimistic.id ? { ...data, sender_display_name: profile.display_name } : m)
      );
    }

    await supabase
      .from("navi_message_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeThread.id);

    setSending(false);
  }

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

    // Check for existing thread in either direction
    const { data: existing } = await supabase
      .from("navi_message_threads")
      .select("*")
      .or(
        `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${target.id}),` +
        `and(sender_user_id.eq.${target.id},receiver_user_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existing) {
      const t: Thread = {
        id: existing.id,
        sender_user_id: existing.sender_user_id,
        receiver_user_id: existing.receiver_user_id,
        last_message_at: existing.last_message_at,
        other_user_id: target.id,
        other_display_name: target.display_name,
        other_navi_name: target.navi_name,
        last_message_preview: null,
      };
      setShowSearch(false);
      openThread(t);
      return;
    }

    const { data: thread } = await supabase
      .from("navi_message_threads")
      .insert({ sender_user_id: user.id, receiver_user_id: target.id })
      .select()
      .single();

    if (thread) {
      const t: Thread = {
        id: thread.id,
        sender_user_id: thread.sender_user_id,
        receiver_user_id: thread.receiver_user_id,
        last_message_at: thread.last_message_at,
        other_user_id: target.id,
        other_display_name: target.display_name,
        other_navi_name: target.navi_name,
        last_message_preview: null,
      };
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      openThread(t);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  // ── Thread view ───────────────────────────────────────────────────────────

  if (activeThread) {
    const isMine = (msg: Message) =>
      msg.sender_navi_name === profile.navi_name;

    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <button
            onClick={() => setActiveThread(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-sm font-display font-bold text-foreground">
              {activeThread.other_display_name ?? "Operator"}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground">
              {activeThread.other_navi_name ?? "NAVI"} · Direct message
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 px-1">
          {messages.length === 0 && (
            <p className="text-center text-xs font-mono text-muted-foreground py-8">
              No messages yet. Say something.
            </p>
          )}
          {messages.map((msg) => {
            const mine = isMine(msg);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <span className="text-[9px] font-mono text-muted-foreground mb-1">
                  {msg.sender_display_name ?? msg.sender_navi_name}
                </span>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-xs font-body leading-relaxed ${
                    mine
                      ? "bg-primary/15 border border-primary/30 text-foreground"
                      : "bg-muted/40 border border-border text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[8px] font-mono text-muted-foreground/50 mt-0.5">
                  {timeAgo(msg.created_at)}
                </span>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`Message ${activeThread.other_display_name ?? "Operator"}...`}
            autoFocus
            className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-2 rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    );
  }

  // ── Thread list ───────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader title="MESSAGES" subtitle="// DIRECT OPERATOR COMMS" />

      {/* Search / new DM */}
      <div className="mb-5">
        {showSearch ? (
          <HudCard title="NEW MESSAGE" icon={<Search size={14} />}>
            <input
              value={searchQuery}
              onChange={(e) => searchOperators(e.target.value)}
              placeholder="Search operators by name..."
              autoFocus
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 mb-2"
            />
            {searching && (
              <div className="flex justify-center py-2">
                <Loader2 size={14} className="animate-spin text-primary" />
              </div>
            )}
            <div className="space-y-1">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => startThread(r)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 rounded border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="flex-1">
                    <p className="text-xs font-body text-foreground">{r.display_name ?? "Operator"}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">
                      LV.{r.operator_level} · NAVI: {r.navi_name ?? "NAVI"}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-primary">MESSAGE →</span>
                </button>
              ))}
              {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground py-2 text-center">No operators found.</p>
              )}
            </div>
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
              className="mt-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              CANCEL
            </button>
          </HudCard>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-full py-3 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-mono hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={12} />
            NEW MESSAGE
          </button>
        )}
      </div>

      {/* Thread list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-muted-foreground text-sm">No messages yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Search for an operator above to start a conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread, i) => (
            <motion.button
              key={thread.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openThread(thread)}
              className="w-full text-left flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              {/* Avatar placeholder */}
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-display font-bold text-primary">
                  {(thread.other_display_name ?? "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-body font-medium text-foreground">
                    {thread.other_display_name ?? "Operator"}
                  </p>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0 ml-2">
                    {timeAgo(thread.last_message_at)}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mb-0.5">
                  NAVI: {thread.other_navi_name ?? "NAVI"}
                </p>
                {thread.last_message_preview && (
                  <p className="text-xs font-body text-muted-foreground truncate">
                    {thread.last_message_preview}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
