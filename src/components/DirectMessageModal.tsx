import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDirectMessages, type DirectMessage } from "@/hooks/useDirectMessages";
import { initials, timeAgo } from "@/lib/feedHelpers";
import { toast } from "@/hooks/use-toast";

interface Props {
  targetId: string;
  targetDisplayName: string | null;
  targetNaviName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DirectMessageModal({
  targetId,
  targetDisplayName,
  targetNaviName,
  isOpen,
  onClose,
}: Props) {
  const { user } = useAuth();
  const { sendDM, fetchDMThread, markDMRead, deleteDM } = useDirectMessages();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const loadMessages = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const msgs = await fetchDMThread(targetId);
    setMessages(msgs);
    setLoading(false);
    // Mark unread as read
    const unreadIds = msgs
      .filter(m => m.recipient_id === user?.id && !m.read_at)
      .map(m => m.id);
    if (unreadIds.length > 0) markDMRead(unreadIds);
  }, [targetId, fetchDMThread, markDMRead, user]);

  useEffect(() => {
    if (isOpen && targetId) loadMessages();
    if (!isOpen) { setMessages([]); setInput(""); }
  }, [isOpen, targetId, loadMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages]);

  // Real-time subscription for new DMs in this thread
  useEffect(() => {
    if (!isOpen || !user || !targetId) return;

    const channel = supabase
      .channel(`dm_thread_${user.id}_${targetId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      }, (payload) => {
        const msg = payload.new as DirectMessage;
        const inThread =
          (msg.sender_id === user.id && msg.recipient_id === targetId) ||
          (msg.sender_id === targetId && msg.recipient_id === user.id);
        if (!inThread) return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.recipient_id === user.id) {
          markDMRead([msg.id]);
          toast({
            title: `${targetDisplayName || "Operator"} sent you a message`,
            description: msg.content.slice(0, 80),
          });
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, user, targetId, markDMRead, targetDisplayName]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic
    const tempId = `temp_${Date.now()}`;
    const optimistic: DirectMessage = {
      id: tempId,
      sender_id: user!.id,
      recipient_id: targetId,
      content,
      read_at: null,
      deleted_by_sender: false,
      deleted_by_recipient: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const sent = await sendDM(targetId, content);
    if (!sent) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ title: "Failed to send message", variant: "destructive" });
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m));
    }
    setSending(false);
  };

  const handleDelete = async (msg: DirectMessage) => {
    const isSender = msg.sender_id === user?.id;
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    await deleteDM(msg.id, isSender);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (typeof document === "undefined") return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="dm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            key="dm-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-x-4 top-[10%] bottom-[10%] z-[91] max-w-xl mx-auto rounded-xl border border-primary/30 bg-background flex flex-col overflow-hidden"
            style={{ boxShadow: "0 0 40px hsl(var(--primary)/0.2)" }}
          >
            {/* Scanline */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{ background: "linear-gradient(transparent 50%,rgba(0,0,0,0.06) 50%)", backgroundSize: "100% 4px" }}
            />

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-display font-bold text-sm text-primary">
                {initials(targetDisplayName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-bold text-foreground truncate">
                  {targetDisplayName || "Unknown Operator"}
                </p>
                {targetNaviName && (
                  <p className="text-[10px] font-mono text-muted-foreground">NAVI: {targetNaviName}</p>
                )}
              </div>
              <span className="text-[9px] font-mono text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded">
                DIRECT
              </span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary" size={20} />
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
                  <p className="text-xs font-mono text-muted-foreground text-center">
                    No messages yet.<br />Start the conversation.
                  </p>
                </div>
              )}

              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 group ${isMine ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 relative ${
                        isMine
                          ? "bg-primary/15 border border-primary/30"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="text-sm font-body text-foreground leading-relaxed">
                        {msg.content}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                        {timeAgo(msg.created_at)}
                        {isMine && msg.read_at && (
                          <span className="ml-1.5 text-primary">· read</span>
                        )}
                      </p>
                    </div>
                    {/* Delete button — hover only */}
                    <button
                      onClick={() => handleDelete(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive self-center"
                      title="Delete message"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 shrink-0">
              <div className="flex items-end gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${targetDisplayName || "operator"}…`}
                  rows={1}
                  className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none resize-none min-h-[36px] max-h-[100px]"
                  style={{ fieldSizing: "content" } as any}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-8 h-8 rounded bg-primary/15 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground/40 mt-1">Enter to send · Shift+Enter for new line</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
