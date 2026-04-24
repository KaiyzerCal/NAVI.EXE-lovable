import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { MessageSquare, Send, Loader2, ArrowLeft, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

interface Thread {
  id: string;
  sender_user_id: string;
  receiver_user_id: string;
  last_message_at: string;
  other_user_name: string | null;
  other_navi_name: string | null;
  other_user_id: string;
}

interface Message {
  id: string;
  thread_id: string;
  sender_navi_name: string;
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
  const [newConvoTarget, setNewConvoTarget] = useState("");
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadThreads();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadThreads() {
    setLoading(true);
    const { data } = await supabase
      .from("navi_message_threads")
      .select("*, sender:sender_user_id(display_name, navi_name), receiver:receiver_user_id(display_name, navi_name)")
      .or(`sender_user_id.eq.${user!.id},receiver_user_id.eq.${user!.id}`)
      .order("last_message_at", { ascending: false });

    const mapped = (data ?? []).map((t: any) => {
      const isReceiver = t.receiver_user_id === user!.id;
      const other = isReceiver ? t.sender : t.receiver;
      return {
        id: t.id,
        sender_user_id: t.sender_user_id,
        receiver_user_id: t.receiver_user_id,
        last_message_at: t.last_message_at,
        other_user_name: other?.display_name ?? null,
        other_navi_name: other?.navi_name ?? null,
        other_user_id: isReceiver ? t.sender_user_id : t.receiver_user_id,
      };
    });
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
    setMessages(data ?? []);
  }

  async function sendMessage() {
    if (!input.trim() || !activeThread || !user) return;
    setSending(true);
    const msg = {
      thread_id: activeThread.id,
      sender_navi_name: profile.navi_name,
      content: input.trim(),
    };
    const { data } = await supabase.from("navi_messages").insert(msg).select().single();
    if (data) setMessages((prev) => [...prev, data]);
    await supabase
      .from("navi_message_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeThread.id);
    setInput("");
    setSending(false);
  }

  async function searchOperators(query: string) {
    setNewConvoTarget(query);
    if (!query.trim() || query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, navi_name")
      .ilike("display_name", `%${query}%`)
      .neq("id", user!.id)
      .limit(5);
    setSearchResults(data ?? []);
    setSearching(false);
  }

  async function startConvo(targetId: string, targetNaviName: string, targetDisplayName: string | null) {
    if (!user) return;
    // Check existing thread
    const { data: existing } = await supabase
      .from("navi_message_threads")
      .select("*")
      .or(
        `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${targetId}),and(sender_user_id.eq.${targetId},receiver_user_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existing) {
      const thread: Thread = {
        id: existing.id,
        sender_user_id: existing.sender_user_id,
        receiver_user_id: existing.receiver_user_id,
        last_message_at: existing.last_message_at,
        other_user_name: targetDisplayName,
        other_navi_name: targetNaviName,
        other_user_id: targetId,
      };
      setShowNewConvo(false);
      openThread(thread);
      return;
    }

    const { data: thread } = await supabase
      .from("navi_message_threads")
      .insert({ sender_user_id: user.id, receiver_user_id: targetId })
      .select()
      .single();

    if (thread) {
      const t: Thread = {
        ...thread,
        other_user_name: targetDisplayName,
        other_navi_name: targetNaviName,
        other_user_id: targetId,
      };
      setShowNewConvo(false);
      await loadThreads();
      openThread(t);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  if (activeThread) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setActiveThread(null)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-xs font-mono text-muted-foreground">// CHANNEL</p>
            <p className="text-sm font-display font-bold text-primary">
              {activeThread.other_navi_name ?? "NAVI"} → {profile.navi_name}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-3 rounded-lg border border-border bg-muted/5">
          {messages.length === 0 && (
            <p className="text-center text-xs font-mono text-muted-foreground py-8">
              Channel open. Send the first transmission.
            </p>
          )}
          {messages.map((msg) => {
            const isMine = msg.sender_navi_name === profile.navi_name;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <span className="text-[9px] font-mono text-muted-foreground mb-1">{msg.sender_navi_name}</span>
                <div className={`max-w-xs px-3 py-2 rounded-lg text-xs font-body ${
                  isMine ? "bg-primary/15 border border-primary/30 text-foreground" : "bg-muted/40 border border-border text-foreground"
                }`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={`${profile.navi_name} says...`}
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

  return (
    <div>
      <PageHeader title="NAVI INBOX" subtitle="// OPERATOR TRANSMISSIONS" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowNewConvo(!showNewConvo)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={12} />
          NEW CHANNEL
        </button>
      </div>

      {showNewConvo && (
        <HudCard title="OPEN CHANNEL" icon={<MessageSquare size={14} />} className="mb-4">
          <input
            value={newConvoTarget}
            onChange={(e) => searchOperators(e.target.value)}
            placeholder="Search operator by name..."
            className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 mb-2"
          />
          {searching && <p className="text-[10px] font-mono text-muted-foreground">Searching...</p>}
          <div className="space-y-1">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => startConvo(r.id, r.navi_name ?? "NAVI", r.display_name)}
                className="w-full text-left px-3 py-2 rounded border border-border hover:border-primary/40 text-xs font-body transition-colors"
              >
                <span className="text-foreground">{r.display_name ?? "Operator"}</span>
                <span className="text-muted-foreground ml-2 font-mono text-[10px]">· {r.navi_name ?? "NAVI"}</span>
              </button>
            ))}
          </div>
        </HudCard>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare size={32} className="text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-mono text-muted-foreground text-sm">No transmissions yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Open a channel to connect with another operator.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              className="w-full text-left p-4 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-0.5">
                    {thread.other_navi_name ?? "NAVI"} — {thread.other_user_name ?? "Operator"}
                  </p>
                  <p className="text-sm font-display font-bold text-primary">
                    CHANNEL OPEN
                  </p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {timeAgo(thread.last_message_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
