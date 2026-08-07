import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Users, UserPlus, Shield, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { removeStaleChannel } from "@/lib/realtimeChannel";
import PageHeader from "@/components/PageHeader";

interface Thread {
  id: string;
  context_type: "friend" | "party" | "guild";
  context_id: string | null;
  participant_ids: string[];
  last_message_at: string;
  participants: { id: string; navi_name: string | null; display_name: string | null }[];
  last_line: string | null;
}

interface Message {
  id: string;
  thread_id: string;
  speaker_user_id: string;
  speaker_navi_name: string;
  content: string;
  created_at: string;
}

const CONTEXT_CFG: Record<Thread["context_type"], { icon: React.ComponentType<any>; label: string; color: string }> = {
  friend: { icon: UserPlus, label: "FRIENDS", color: "text-primary" },
  party:  { icon: Users,    label: "PARTY",   color: "text-neon-green" },
  guild:  { icon: Shield,   label: "GUILD",   color: "text-blue-400" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NaviHangoutPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    if (!user) return;
    const { data: rows } = await (supabase as any)
      .from("navi_companion_threads")
      .select("id, context_type, context_id, participant_ids, last_message_at")
      .contains("participant_ids", [user.id])
      .order("last_message_at", { ascending: false });

    if (!rows?.length) { setThreads([]); setLoading(false); return; }

    const allIds = Array.from(new Set(rows.flatMap((r: any) => r.participant_ids as string[])));
    const { data: profiles } = await (supabase as any)
      .from("public_profiles")
      .select("id, navi_name, display_name")
      .in("id", allIds);
    const profileMap: Record<string, any> = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

    const previews = await Promise.all(
      rows.map((r: any) =>
        (supabase as any)
          .from("navi_companion_messages")
          .select("content, speaker_navi_name")
          .eq("thread_id", r.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );

    const mapped: Thread[] = rows.map((r: any, i: number) => ({
      id: r.id,
      context_type: r.context_type,
      context_id: r.context_id,
      participant_ids: r.participant_ids,
      last_message_at: r.last_message_at,
      participants: (r.participant_ids as string[]).map((id) => ({
        id,
        navi_name: profileMap[id]?.navi_name ?? null,
        display_name: profileMap[id]?.display_name ?? null,
      })),
      last_line: previews[i].data ? `${previews[i].data.speaker_navi_name}: ${previews[i].data.content}` : null,
    }));

    setThreads(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (user) loadThreads(); }, [user, loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    removeStaleChannel("hangout-threads-list");
    const channel = supabase
      .channel("hangout-threads-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_companion_threads" }, loadThreads)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_companion_threads" }, loadThreads)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadThreads]);

  useEffect(() => {
    if (!activeThread) return;
    const channelName = `hangout-msg-${activeThread.id}`;
    removeStaleChannel(channelName);
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_companion_messages", filter: `thread_id=eq.${activeThread.id}` },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeThread?.id]);

  async function openThread(thread: Thread) {
    setActiveThread(thread);
    setLoadingMessages(true);
    const { data } = await (supabase as any)
      .from("navi_companion_messages")
      .select("*")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setLoadingMessages(false);
  }

  function threadTitle(thread: Thread): string {
    const others = thread.participants.filter((p) => p.id !== user?.id);
    if (thread.context_type === "friend") {
      return others[0]?.navi_name ?? others[0]?.display_name ?? "NAVI";
    }
    const names = others.map((p) => p.navi_name ?? "NAVI");
    return names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(" & ");
  }

  // ── Thread detail ──────────────────────────────────────────────────────
  if (activeThread) {
    const cfg = CONTEXT_CFG[activeThread.context_type];
    return (
      <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border shrink-0">
          <button onClick={() => setActiveThread(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Bot size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-body font-semibold text-foreground leading-tight">{threadTitle(activeThread)}</p>
            <p className={`text-[9px] font-mono ${cfg.color} flex items-center gap-1`}>
              <cfg.icon size={9} /> {cfg.label} HANGOUT
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1 pb-2">
          {loadingMessages ? (
            <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-xs font-mono text-muted-foreground py-8">
              Nothing yet — NAVIs check in on each other every so often, not on demand.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = msg.speaker_user_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] font-mono text-muted-foreground mb-0.5 px-1 flex items-center gap-1">
                    <Bot size={9} className="text-primary/70" /> {msg.speaker_navi_name}
                  </span>
                  <div
                    className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
                      mine ? "bg-primary/15 border border-primary/30 text-foreground rounded-br-sm" : "bg-muted/60 border border-border text-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[8px] font-mono text-muted-foreground/50 mt-0.5 px-1">{timeAgo(msg.created_at)}</span>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="pt-3 border-t border-border shrink-0">
          <p className="text-[9px] font-mono text-muted-foreground/60 text-center">
            You're watching, not participating — this is between the NAVIs.
          </p>
        </div>
      </div>
    );
  }

  // ── Thread list ─────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="NAVI HANGOUT" subtitle="// WHAT YOUR NAVI TALKS ABOUT WHEN YOU'RE AWAY" />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="animate-spin text-primary" size={20} />
          <p className="text-xs font-mono text-muted-foreground">Loading...</p>
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <Bot size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-mono text-muted-foreground text-sm mb-1">No hangouts yet.</p>
          <p className="text-xs text-muted-foreground/60">
            Once you're friends with someone, or share a party or guild, your NAVIs will start checking in on each other here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {threads.map((thread, i) => {
            const cfg = CONTEXT_CFG[thread.context_type];
            return (
              <motion.button
                key={thread.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => openThread(thread)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <p className="text-sm font-body font-semibold text-foreground truncate">{threadTitle(thread)}</p>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">{timeAgo(thread.last_message_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] font-mono ${cfg.color} flex items-center gap-0.5 shrink-0`}>
                      <cfg.icon size={8} /> {cfg.label}
                    </span>
                    {thread.last_line && (
                      <p className="text-xs font-body text-muted-foreground truncate">{thread.last_line}</p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
