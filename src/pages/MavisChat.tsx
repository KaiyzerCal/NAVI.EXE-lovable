import PageHeader from "@/components/PageHeader";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateConversation, loadMessages, saveMessage, type ChatMessage } from "@/lib/chatService";
import { extractMemoriesFromMessage, compressMemories, buildMemoryContext } from "@/lib/memoryEngine";

interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const SUGGESTIONS = [
  { emoji: "📊", label: "Analyze my progress", prompt: "Analyze my progress and tell me where I stand" },
  { emoji: "🌬️", label: "I need support", prompt: "I'm feeling overwhelmed and could use some support" },
  { emoji: "⚡", label: "Motivate me", prompt: "Help me stay motivated today" },
  { emoji: "🎯", label: "Daily guidance", prompt: "What should I focus on today?" },
];

async function streamChat({
  messages,
  context,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  context?: Record<string, any>;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed (${resp.status})`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

export default function MavisChat() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [memoryBlocks, setMemoryBlocks] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation + memories on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        // Load conversation and memories in parallel
        const [convId, memResult] = await Promise.all([
          getOrCreateConversation(user.id),
          supabase
            .from("navi_core_memory")
            .select("memory_type, content, importance")
            .eq("user_id", user.id)
            .order("importance", { ascending: false })
            .limit(50),
        ]);

        if (cancelled) return;
        setConversationId(convId);

        // Build memory context
        if (memResult.data && memResult.data.length > 0) {
          const blocks = compressMemories(memResult.data as any);
          setMemoryBlocks(buildMemoryContext(blocks));
        }

        const dbMessages = await loadMessages(convId);
        if (cancelled) return;

        if (dbMessages.length > 0) {
          setMessages(
            dbMessages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        }
      } catch (err: any) {
        console.error("Failed to load chat history:", err);
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput || input).trim();
    if (!text || isLoading || !user || !conversationId) return;

    setInput("");
    setIsLoading(true);

    // Save user message to DB
    let userMsgId: string;
    try {
      userMsgId = await saveMessage(conversationId, user.id, "user", text);
    } catch {
      toast({ title: "Error", description: "Failed to save message", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const userMsg: DisplayMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    // Extract memories from user message (async, non-blocking)
    const extracted = extractMemoriesFromMessage(text);
    if (extracted.length > 0) {
      const inserts = extracted.map((m) => ({
        user_id: user.id,
        memory_type: m.category,
        content: m.detail,
        importance: m.importance,
      }));
      supabase.from("navi_core_memory").insert(inserts).then(() => {
        // Refresh memory context
        supabase
          .from("navi_core_memory")
          .select("memory_type, content, importance")
          .eq("user_id", user.id)
          .order("importance", { ascending: false })
          .limit(50)
          .then(({ data }) => {
            if (data) {
              const blocks = compressMemories(data as any);
              setMemoryBlocks(buildMemoryContext(blocks));
            }
          });
      });
    }

    // Build recent conversation context (last 15 messages)
    const recentContext = updatedMessages
      .filter((m) => m.id !== "initial")
      .slice(-15)
      .map((m, i) => `[${i + 1}] ${m.role === "user" ? "User" : profile.navi_name}: ${m.content.substring(0, 200)}${m.content.length > 200 ? "..." : ""}`)
      .join("\n");

    let assistantContent = "";
    const chatHistory = updatedMessages
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: chatHistory,
        context: {
          navi_name: profile.navi_name,
          display_name: profile.display_name,
          navi_level: profile.navi_level,
          navi_personality: profile.navi_personality,
          xp_total: profile.xp_total,
          current_streak: profile.current_streak,
          longest_streak: profile.longest_streak,
          user_navi_description: profile.user_navi_description,
          bond_affection: profile.bond_affection,
          bond_trust: profile.bond_trust,
          bond_loyalty: profile.bond_loyalty,
          recent_context: recentContext,
          memory_context: memoryBlocks,
        },
        onDelta: (chunk) => {
          assistantContent += chunk;
          const content = assistantContent;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content } : m
              );
            }
            return [
              ...prev,
              { id: "streaming", role: "assistant", content, timestamp: new Date() },
            ];
          });
        },
        onDone: async () => {
          // Save assistant message to DB
          try {
            const assistantId = await saveMessage(conversationId, user.id, "assistant", assistantContent);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === "streaming" ? { ...m, id: assistantId } : m
              )
            );
          } catch (err) {
            console.error("Failed to save assistant message:", err);
          }

          // Increment bond (non-blocking)
          const newAffection = Math.min(100, profile.bond_affection + 1);
          const newTrust = Math.min(100, profile.bond_trust + (messages.length > 10 ? 1 : 0));
          updateProfile({
            bond_affection: newAffection,
            bond_trust: newTrust,
          });

          setIsLoading(false);
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({
        title: "NAVI Error",
        description: e.message || "Failed to get response",
        variant: "destructive",
      });
    }
  }, [input, isLoading, user, conversationId, messages, profile, memoryBlocks, updateProfile]);

  if (dbLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="text-xs font-mono text-muted-foreground mt-2">Establishing neural link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-4">
        <PageHeader title={`${profile.navi_name || "NAVI"} AI`} subtitle="// NEURAL LINK ACTIVE" />
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([]);
              toast({ title: "Thread cleared", description: "Chat view cleared. Your conversation history is still saved." });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30 transition-colors"
            title="Clear visible thread (data stays saved)"
          >
            <Trash2 size={10} /> CLEAR VIEW
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
        {/* Empty state with suggestion chips */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-6">
              <Bot size={28} className="text-primary" />
            </div>
            <h3 className="font-display text-xl text-primary font-bold mb-2">
              Welcome back, {profile.display_name || "Operator"}.
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              I'm {profile.navi_name}. I have access to your progress, memories, and goals. What are we working on?
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.prompt}
                  onClick={() => sendMessage(s.prompt)}
                  className="bg-card hover:bg-primary/5 border border-border hover:border-primary/30 rounded-lg px-4 py-3 text-sm text-foreground font-medium transition-colors text-left"
                >
                  <span className="mr-1">{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded shrink-0 flex items-center justify-center ${
                msg.role === "assistant"
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/10 border border-secondary/30"
              }`}
            >
              {msg.role === "assistant" ? (
                <Bot size={14} className="text-primary" />
              ) : (
                <User size={14} className="text-secondary" />
              )}
            </div>
            <div
              className={`max-w-[75%] rounded px-3 py-2 ${
                msg.role === "assistant"
                  ? "bg-card border border-border"
                  : "bg-secondary/10 border border-secondary/20"
              }`}
            >
              <div className="text-sm font-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-2">
        {/* Glowing orb */}
        <div className="relative shrink-0">
          <motion.div
            className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center"
            animate={isLoading ? {
              boxShadow: [
                "0 0 8px 2px hsl(var(--primary) / 0.3)",
                "0 0 22px 8px hsl(var(--primary) / 0.6)",
                "0 0 8px 2px hsl(var(--primary) / 0.3)",
              ],
              scale: [1, 1.1, 1],
            } : {
              boxShadow: "0 0 5px 1px hsl(var(--primary) / 0.12)",
              scale: 1,
            }}
            transition={isLoading ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.4 }}
          >
            <Bot size={16} className="text-primary" />
          </motion.div>
          {isLoading && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/40"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </div>

        {/* Input */}
        <div className="flex-1 border border-border rounded bg-card flex items-center gap-2 p-2 border-glow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={`Talk to ${profile.navi_name}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm font-body text-foreground placeholder:text-muted-foreground outline-none px-2 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
