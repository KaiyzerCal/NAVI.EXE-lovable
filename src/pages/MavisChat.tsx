import PageHeader from "@/components/PageHeader";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2, Square, Copy, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, type DisplayMessage } from "@/contexts/AppDataContext";
import { getOrCreateConversation, loadMessages, saveMessage } from "@/lib/chatService";
import { parseActions, executeAction as executeClientAction, type NaviAction } from "@/lib/naviActions";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const NAVI_ACTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/navi-actions`;

const CLIENT_FALLBACK_ACTION_TYPES = new Set([
  "create_journal",
  "update_journal",
  "delete_journal",
  "create_quest",
  "update_quest",
  "update_quest_progress",
  "delete_quest",
  "create_skill",
  "update_skill",
  "delete_skill",
  "create_subskill",
  "update_subskill",
  "delete_subskill",
  "create_equipment",
  "update_equipment",
  "equip_item",
  "unequip_item",
  "delete_equipment",
  "create_buff",
  "update_buff",
  "remove_buff",
]);

function isJournalIntent(message: string): boolean {
  return /(journal|vault)/i.test(message) && /(create|write|save|log|record|add|make)/i.test(message);
}

function deriveJournalTitle(userMessage: string, cleanText: string): string {
  const quoted = `${userMessage} ${cleanText}`.match(/["“](.+?)["”]/);
  if (quoted?.[1]) return quoted[1].trim().slice(0, 80);

  const source = cleanText.trim() || userMessage.trim();
  const normalized = source.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 60) || "NAVI Entry";
}

function inferFallbackActions(userMessage: string, cleanText: string): NaviAction[] {
  if (!isJournalIntent(userMessage)) return [];

  const content = cleanText.trim().length >= 24
    ? cleanText.trim()
    : `Operator request: ${userMessage.trim()}`;

  return [{
    type: "create_journal",
    params: {
      title: deriveJournalTitle(userMessage, cleanText),
      content,
      tags: ["navi"],
      category: "personal",
      importance: "medium",
      xp_earned: 10,
    },
  }];
}

async function streamChat({
  messages,
  context,
  signal,
  accessToken,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  context?: Record<string, any>;
  signal: AbortSignal;
  accessToken: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ messages, context }),
    signal,
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

const INITIAL_MESSAGE: DisplayMessage = {
  id: "initial",
  role: "assistant",
  content: "Systems online, Operator. NAVI AI initialized. How can I assist you today?",
  timestamp: new Date(),
};

export default function MavisChat() {
  const { user, session } = useAuth();
  const {
    profile, updateProfile, refetchProfile,
    quests, questStats, refetchQuests,
    entries, refetchJournal,
    achievements,
    skills, refetchSkills,
    items: equipment, refetchEquipment,
    effects: buffs, refetchEffects,
    chatMessages: messages, setChatMessages: setMessages,
    conversationId, setConversationId,
    chatDbLoaded, setChatDbLoaded,
  } = useAppData();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dbLoading = !chatDbLoaded;
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load conversation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || chatDbLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const convId = await getOrCreateConversation(user.id);
        if (cancelled) return;
        setConversationId(convId);
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
      } catch (err) {
        console.error("Failed to load chat history:", err);
      } finally {
        if (!cancelled) setChatDbLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, chatDbLoaded]);

  // ── Auto-scroll & scroll button ───────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setShowScrollBtn(false);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }, []);

  // ── Auto-grow textarea ─────────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ── Stop generation ────────────────────────────────────────────────────────
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  // ── Clear thread ──────────────────────────────────────────────────────────
  const clearThread = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    toast({ title: "Thread cleared", description: "Neural link refreshed." });
  }, []);

  // ── Copy message ──────────────────────────────────────────────────────────
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied", description: "Message copied to clipboard." });
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !user || !session?.access_token || !conversationId) return;

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);

    // abort any previous stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let userMsgId: string;
    try {
      userMsgId = await saveMessage(conversationId, user.id, "user", userContent);
    } catch {
      toast({ title: "Error", description: "Failed to save message", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const userMsg: DisplayMessage = {
      id: userMsgId,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let assistantContent = "";
    const chatHistory = updatedMessages
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat({
        messages: chatHistory,
        signal: controller.signal,
        accessToken: session.access_token,
        context: {
          navi_name: profile.navi_name,
          display_name: profile.display_name,
          navi_level: profile.navi_level,
          navi_personality: profile.navi_personality,
          xp_total: profile.xp_total,
          current_streak: profile.current_streak,
          longest_streak: profile.longest_streak,
          user_navi_description: profile.user_navi_description,
          character_class: profile.character_class,
          mbti_type: profile.mbti_type,
          subclass: profile.subclass,
          bond_affection: profile.bond_affection,
          bond_trust: profile.bond_trust,
          bond_loyalty: profile.bond_loyalty,
          operator_level: profile.operator_level ?? 1,
          perception: (profile as any).perception ?? 10,
          luck: (profile as any).luck ?? 10,
          codex_points: (profile as any).codex_points ?? 0,
          cali_coins: (profile as any).cali_coins ?? 0,
          // Full objects with IDs so AI can reference them in actions
          quests: quests.map((q) => ({
            id: q.id, name: q.name, type: q.type, progress: q.progress,
            total: q.total, xp_reward: q.xp_reward, completed: q.completed,
            loot_description: (q as any).loot_description || "",
          })),
          skills: skills.map((s) => ({
            id: s.id, name: s.name, category: s.category,
            level: s.level, max_level: (s as any).max_level ?? 10, xp: s.xp,
          })),
          equipment: equipment.map((e) => ({
            id: e.id, name: e.name, slot: e.slot, rarity: e.rarity,
            is_equipped: e.equipped, stat_bonuses: (e as any).stat_bonuses || {},
          })),
          journal_entries: entries.slice(0, 10).map((j) => ({
            id: j.id, title: j.title, date: new Date(j.created_at).toLocaleDateString(),
          })),
          achievements: achievements.slice(0, 15).map((a) => ({
            name: a.name, unlocked: a.unlocked,
          })),
          buffs: buffs.map((b) => ({
            id: b.id, name: b.name, effect_type: (b as any).effect_type || "buff",
            stat_affected: (b as any).stat_affected || "", modifier_value: (b as any).modifier_value || 0,
            source: (b as any).source || "manual", expires_at: (b as any).expires_at || null,
          })),
        },
        onDelta: (chunk) => {
          assistantContent += chunk;
          // Strip action tags from display
          const { cleanText } = parseActions(assistantContent);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === "streaming") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: cleanText } : m));
            }
            return [...prev, { id: "streaming", role: "assistant", content: cleanText, timestamp: new Date() }];
          });
        },
        onDone: async () => {
          if (controller.signal.aborted) return;

          const { cleanText, actions: parsedActions } = parseActions(assistantContent);
          const actions = parsedActions.length > 0 ? parsedActions : inferFallbackActions(userContent, cleanText);

          console.log("[NAVI] Raw response length:", assistantContent.length);
          console.log("[NAVI] Parsed actions count:", parsedActions.length);
          console.log("[NAVI] Actions:", JSON.stringify(parsedActions, null, 2));

          if (actions.length > 0) {
            let failedActions: NaviAction[] = [];

            try {
              const actionResp = await fetch(NAVI_ACTIONS_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ actions }),
              });

              const actionJson = await actionResp.json().catch(() => ({ results: [] }));
              console.log("[NAVI] Action response status:", actionResp.status);
              console.log("[NAVI] Action response body:", JSON.stringify(actionJson));

              if (!actionResp.ok) {
                throw new Error(actionJson.error || `Action request failed (${actionResp.status})`);
              }

              const failures = Array.isArray(actionJson.results)
                ? actionJson.results
                    .map((result: { success: boolean }, index: number) => (!result.success ? actions[index] : null))
                    .filter((result): result is NaviAction => Boolean(result))
                : [];

              if (failures.length > 0) {
                console.error("[NAVI] Action failures:", failures);
                failedActions = failures;
              }
            } catch (err) {
              console.error("[NAVI] Backend action execution failed:", err);
              failedActions = actions;
            }

            if (failedActions.length > 0) {
              const fallbackActions = failedActions.filter((action) => CLIENT_FALLBACK_ACTION_TYPES.has(action.type));

              for (const action of fallbackActions) {
                try {
                  await executeClientAction(user.id, action);
                } catch (fallbackError) {
                  console.error("[NAVI] Client fallback failed:", action.type, fallbackError);
                }
              }
            }

            await Promise.all([
              refetchQuests(),
              refetchJournal(),
              refetchSkills(),
              refetchEquipment(),
              refetchEffects(),
              refetchProfile(),
            ]);
          }

          try {
            const assistantId = await saveMessage(conversationId, user.id, "assistant", cleanText);
            setMessages((prev) =>
              prev.map((m) => (m.id === "streaming" ? { ...m, id: assistantId, content: cleanText } : m))
            );
          } catch (err) {
            console.error("Failed to save assistant message:", err);
            setMessages((prev) =>
              prev.map((m) => (m.id === "streaming" ? { ...m, content: cleanText } : m))
            );
          }

          setIsLoading(false);
        },
      });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setIsLoading(false);
      toast({ title: "NAVI Error", description: e.message || "Failed to get response", variant: "destructive" });
    }
  }, [input, isLoading, user, session, conversationId, messages, profile, quests, skills, equipment, entries, achievements, buffs, refetchQuests, refetchJournal, refetchSkills, refetchEquipment, refetchEffects, refetchProfile, updateProfile]);

  // ── Key handler: Shift+Enter = newline, Enter alone = send ────────────────
  // isComposing guard prevents firing during IME composition (mobile autocomplete,
  // emoji picker, CJK input) which was causing the "sends before I'm done" bug.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        sendMessage();
      }
      // Shift+Enter or isComposing → fall through, textarea inserts character naturally
    },
    [sendMessage]
  );

  if (dbLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-2rem)] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
        <p className="text-xs font-mono text-muted-foreground mt-2">Loading neural link...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)]">
      <PageHeader title="NAVI AI" subtitle="// NEURAL LINK ACTIVE">
        <button
          onClick={clearThread}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Trash2 size={12} />
          CLEAR THREAD
        </button>
      </PageHeader>

      {/* Message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 relative"
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
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

            {/* Bubble */}
            <div
              className={`max-w-[75%] rounded px-3 py-2 relative ${
                msg.role === "assistant"
                  ? "bg-card border border-border"
                  : "bg-secondary/10 border border-secondary/20"
              }`}
            >
              <div
                className={`text-sm prose prose-invert prose-sm max-w-none ${
                  msg.role === "assistant" ? "font-mono" : "font-body"
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
              <div className="flex items-center justify-between mt-1 gap-3">
                <p className="text-[10px] font-mono text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {/* Copy button — visible on hover */}
                <button
                  onClick={() => copyMessage(msg.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  title="Copy message"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-8 w-8 h-8 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors shadow-lg z-10"
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input box */}
      <div className="border border-primary/20 rounded-lg bg-card flex items-end gap-2 p-3 border-glow">
        {/* Glowing NAVI orb */}
        <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20 border border-primary/40"
            animate={isLoading ? {
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
            } : { scale: 1, opacity: 0.4 }}
            transition={isLoading ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          />
          <motion.div
            className="absolute inset-1 rounded-full bg-primary/30"
            animate={isLoading ? {
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            } : { scale: 1, opacity: 0.5 }}
            transition={isLoading ? { duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 } : {}}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)),0_0_16px_hsl(var(--primary)/0.5)]"
            animate={isLoading ? {
              scale: [0.8, 1.1, 0.8],
              boxShadow: [
                "0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary)/0.5)",
                "0 0 16px hsl(var(--primary)), 0 0 32px hsl(var(--primary)/0.7)",
                "0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--primary)/0.5)",
              ],
            } : {}}
            transition={isLoading ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}}
          />
        </div>
        {/* Textarea — clearly visible, grows with content */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NAVI... (Enter to send, Shift+Enter for new line)"
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-muted/60 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/40 transition-colors resize-none disabled:opacity-50 min-h-[40px] max-h-[160px] leading-relaxed"
        />

        {/* Send / Stop button */}
        {isLoading ? (
          <button
            onClick={stopGeneration}
            className="w-9 h-9 rounded bg-destructive/20 border border-destructive/40 flex items-center justify-center text-destructive hover:bg-destructive/30 transition-colors shrink-0"
            title="Stop generation"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-9 h-9 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            title="Send message"
          >
            <Send size={14} />
          </button>
        )}
      </div>

      <p className="text-[10px] font-mono text-muted-foreground/50 text-center mt-1.5">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

