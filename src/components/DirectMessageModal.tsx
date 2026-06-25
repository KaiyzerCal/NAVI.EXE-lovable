import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  thread_id: string;
  sender_navi_name: string;
  sender_user_id: string | null;
  content: string;
  created_at: string;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
}

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
}

export default function DirectMessageModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
}: DirectMessageModalProps) {
  const { user } = useAuth();
  const { profile } = useAppData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThread = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // Find or create thread (either direction)
    const { data: existing } = await (supabase as any)
      .from("navi_message_threads")
      .select("id")
      .or(
        `and(sender_user_id.eq.${user.id},receiver_user_id.eq.${recipientId}),` +
        `and(sender_user_id.eq.${recipientId},receiver_user_id.eq.${user.id})`
      )
      .maybeSingle();

    let tid: string;
    if (existing) {
      tid = existing.id;
      // Reset soft-delete flags so both parties can see the conversation
      await (supabase as any)
        .from("navi_message_threads")
        .update({ deleted_by_sender: false, deleted_by_recipient: false })
        .eq("id", tid);
    } else {
      const { data: created, error: createErr } = await (supabase as any)
        .from("navi_message_threads")
        .insert({ sender_user_id: user.id, receiver_user_id: recipientId })
        .select("id")
        .single();
      if (createErr || !created) {
        setError("Could not open conversation.");
        setLoading(false);
        return;
      }
      tid = created.id;
    }

    setThreadId(tid);

    const { data, error: msgErr } = await (supabase as any)
      .from("navi_messages")
      .select("*")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (msgErr) { setError("Failed to load messages."); setLoading(false); return; }

    setMessages(
      (data ?? []).filter((m: Message) =>
        m.sender_user_id === user.id ? !m.deleted_by_sender : !m.deleted_by_recipient
      )
    );
    setLoading(false);
  }, [user, recipientId]);

  useEffect(() => {
    if (isOpen && user) loadThread();
  }, [isOpen, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime for this thread
  useEffect(() => {
    if (!isOpen || !user || !threadId) return;
    const channel = supabase
      .channel(`dm-modal-thread-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "navi_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => {
            if (prev.find((p) => p.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user, threadId]);

  const send = async () => {
    if (!input.trim() || !user || sending || !threadId) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    const tempId = `temp-${Date.now()}`;
    const temp: Message = {
      id: tempId,
      thread_id: threadId,
      sender_navi_name: profile.navi_name ?? "NAVI",
      sender_user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      deleted_by_sender: false,
      deleted_by_recipient: false,
    };
    setMessages((prev) => [...prev, temp]);

    const { data, error: err } = await (supabase as any)
      .from("navi_messages")
      .insert({
        thread_id: threadId,
        sender_navi_name: profile.navi_name ?? "NAVI",
        sender_user_id: user.id,
        content,
      })
      .select()
      .single();

    if (err) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));
      // Keep thread's last_message_at fresh so it sorts to top in inbox
      await (supabase as any)
        .from("navi_message_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-x-4 top-16 bottom-16 z-[60] max-w-lg mx-auto bg-card border border-primary/30 rounded-xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground">DIRECT MESSAGE</p>
                <p className="text-sm font-display font-bold text-foreground">{recipientName}</p>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <p className="text-muted-foreground font-mono text-xs mb-2">{error}</p>
                  <button onClick={loadThread} className="text-primary font-mono text-xs hover:underline">RETRY</button>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground font-mono text-xs py-10">
                  No messages yet. Say hello.
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm font-body ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted border border-border text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className={`text-[9px] font-mono mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                autoFocus
                className="flex-1 bg-muted border border-border rounded-full px-4 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:bg-primary/80 transition-colors shrink-0"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
