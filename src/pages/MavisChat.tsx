import PageHeader from "@/components/PageHeader";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Trash2, Square, Copy, ChevronDown, Volume2, VolumeX, RefreshCw } from "lucide-react";
import VoiceInput from "@/components/VoiceInput";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, type DisplayMessage } from "@/contexts/AppDataContext";
import { getOrCreateConversation, loadMessages, saveMessage } from "@/lib/chatService";
import { parseActions, executeAction as executeClientAction, type NaviAction } from "@/lib/naviActions";
import { extractMemoriesFromMessage, compressMemories, buildMemoryContext } from "@/lib/memoryEngine";
import { supabase } from "@/integrations/supabase/client";
import { usePaywall } from "@/hooks/usePaywall";
import { UnlockWithCoreCard } from "@/components/UnlockWithCoreCard";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/navi-chat`;
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
  return /(journal|vault|log|entry|note|record|diary)/i.test(message) && /(create|write|save|log|record|add|make|new)\s/i.test(message);
}

function isQuestIntent(message: string): boolean {
  // Require explicit action words — casual mentions of goals/tasks should NOT trigger quest creation
  const hasActionWord = /(create|make|add|new|start|set up|give me|track)\s/i.test(message);
  const hasQuestWord = /(quest|mission)/i.test(message);
  return hasActionWord && hasQuestWord;
}

function isSkillIntent(message: string): boolean {
  return /(skill|ability|talent|proficiency)/i.test(message) && /(create|add|new|make|start|track)/i.test(message);
}

function deriveJournalTitle(userMessage: string, cleanText: string): string {
  const quoted = `${userMessage} ${cleanText}`.match(/[""](.+?)[""]/);
  if (quoted?.[1]) return quoted[1].trim().slice(0, 80);

  const source = cleanText.trim() || userMessage.trim();
  const normalized = source.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 60) || "NAVI Entry";
}

function extractNameFromMessage(message: string): string {
  // Try to extract a name from patterns like "called X", "named X", "make X", "create X"
  const patterns = [
    /called\s+[""]?([^"".,!?]+)[""]?/i,
    /named\s+[""]?([^"".,!?]+)[""]?/i,
    /(?:create|make|add|new|start)\s+(?:a\s+)?(?:quest|task|skill|mission|entry|note)?\s*(?:called|named|:)?\s*[""]?([^"".,!?]{3,})[""]?/i,
  ];
  for (const p of patterns) {
    const match = message.match(p);
    if (match?.[1]) return match[1].trim().slice(0, 80);
  }
  // Fallback: use the message itself (trimmed)
  return message.replace(/^(create|make|add|new|start|give me)\s+(a\s+)?(quest|task|skill|mission)\s*/i, "").trim().slice(0, 60) || "New Item";
}

function inferQuestType(msg: string): string {
  const m = msg.toLowerCase();
  if (/\bepic\b/i.test(m)) return "Epic";
  if (/\bmain\b/i.test(m)) return "Main";
  if (/\bweekly\b/i.test(m)) return "Weekly";
  if (/\bside\b/i.test(m)) return "Side";
  if (/\bminor\b/i.test(m)) return "Minor";
  return "Daily";
}

function inferXpReward(type: string): number {
  const map: Record<string, number> = { Daily: 50, Weekly: 150, Main: 300, Side: 100, Minor: 25, Epic: 500 };
  return map[type] || 50;
}

function inferTotalSteps(msg: string): number {
  const match = msg.match(/(\d+)\s*(?:steps?|parts?|phases?|stages?|tasks?)/i);
  if (match) return parseInt(match[1], 10);
  return 1;
}

function inferFallbackActions(userMessage: string, cleanText: string, appData?: any): NaviAction[] {
  const msg = userMessage.toLowerCase();

  // Delete quest/skill/journal intent
  if (/(delete|remove|destroy|trash|get rid of)\s/i.test(msg)) {
    if (/(quest|task|mission)/i.test(msg) && appData?.quests) {
      const quest = appData.quests.find((q: any) => msg.includes(q.name?.toLowerCase()));
      if (quest) return [{ type: "delete_quest", params: { quest_id: quest.id } }];
    }
    if (/(skill|ability)/i.test(msg) && appData?.skills) {
      const skill = appData.skills.find((s: any) => msg.includes(s.name?.toLowerCase()));
      if (skill) return [{ type: "delete_skill", params: { skill_id: skill.id } }];
    }
    if (/(journal|entry|vault|note|log)/i.test(msg) && appData?.entries) {
      const entry = appData.entries.find((e: any) => msg.includes(e.title?.toLowerCase()));
      if (entry) return [{ type: "delete_journal", params: { entry_id: entry.id } }];
    }
  }

  // Complete/finish quest intent
  if (/(finish|complete|done|did it|finished|completed|mark.*done|close)/i.test(msg)) {
    if (appData?.quests) {
      // Try to find the quest by name
      const activeQuests = appData.quests.filter((q: any) => !q.completed);
      let quest = activeQuests.find((q: any) => msg.includes(q.name?.toLowerCase()));
      // If no name match, complete the most recent active quest
      if (!quest && activeQuests.length > 0) quest = activeQuests[0];
      if (quest) return [{ type: "complete_quest", params: { quest_id: quest.id } }];
    }
  }

  // Update quest type intent (e.g., "make X an epic quest", "change X to weekly")
  if (/(make|change|set|convert|switch)\s.*(daily|weekly|main|side|minor|epic)/i.test(msg)) {
    if (appData?.quests) {
      const newType = inferQuestType(msg);
      const quest = appData.quests.find((q: any) => msg.includes(q.name?.toLowerCase()));
      if (quest) return [{ type: "update_quest", params: { quest_id: quest.id, type: newType } }];
    }
  }

  // Quest create intent
  if (isQuestIntent(userMessage)) {
    const name = extractNameFromMessage(userMessage);
    const type = inferQuestType(userMessage);
    const total = inferTotalSteps(userMessage);
    return [{
      type: "create_quest",
      params: {
        name,
        description: cleanText.trim().slice(0, 200) || "",
        type,
        total,
        xp_reward: inferXpReward(type),
      },
    }];
  }

  // Skill intent
  if (isSkillIntent(userMessage)) {
    const name = extractNameFromMessage(userMessage);
    return [{
      type: "create_skill",
      params: {
        name,
        description: cleanText.trim().slice(0, 200) || "",
        category: "General",
        max_level: 10,
      },
    }];
  }

  // Journal/vault intent
  if (isJournalIntent(userMessage)) {
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

  // Equipment create intent
  if (/(create|make|add|give|craft|forge)\s.*(equipment|item|weapon|armor|gear|sword|shield)/i.test(msg)) {
    const name = extractNameFromMessage(userMessage);
    return [{
      type: "create_equipment",
      params: {
        name,
        description: cleanText.trim().slice(0, 200) || "",
        slot: "accessory",
        rarity: "common",
        stat_bonuses: {},
        obtained_from: "navi",
      },
    }];
  }

  // XP award intent
  if (/(give|award|add|grant)\s.*(\d+)\s*xp/i.test(msg)) {
    const match = msg.match(/(\d+)\s*xp/i);
    if (match) return [{ type: "award_xp", params: { amount: parseInt(match[1], 10) } }];
  }

  return [];
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
    if (resp.status === 429) {
      // Retry once after a short delay
      await new Promise((r) => setTimeout(r, 3000));
      const retry = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages, context }),
        signal,
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: "Rate limited" }));
        throw new Error(err.error || "Rate limit exceeded. Please wait a moment.");
      }
      // Use retry response going forward
      const retryBody = retry.body;
      if (!retryBody) throw new Error("No response body");
      const retryReader = retryBody.getReader();
      const retryDecoder = new TextDecoder();
      let retryBuffer = "";
      while (true) {
        const { done, value } = await retryReader.read();
        if (done) break;
        retryBuffer += retryDecoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = retryBuffer.indexOf("\n")) !== -1) {
          let line = retryBuffer.slice(0, idx);
          retryBuffer = retryBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { onDone(); return; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch { /* partial chunk */ }
        }
      }
      onDone();
      return;
    }
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
  const paywall = usePaywall();
  const {
    profile, updateProfile, refetchProfile,
    quests, questStats, refetchQuests,
    entries, refetchJournal,
    achievements, refetchAchievements,
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

  // ── TTS state ──────────────────────────────────────────────────────────────
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentlySpokenId, setCurrentlySpokenId] = useState<string | null>(null);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setCurrentlySpokenId(null);
  }, []);

  const speakMessage = useCallback((msgId: string, content: string) => {
    if (currentlySpokenId === msgId) { stopSpeaking(); return; }
    stopSpeaking();
    const cleaned = content.replace(/[#*_`~>|[\](){}]/g, "").slice(0, 1000);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /female|samantha|karen|victoria/i.test(v.name));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setCurrentlySpokenId(null);
    utterance.onerror = () => setCurrentlySpokenId(null);
    setCurrentlySpokenId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [currentlySpokenId, stopSpeaking]);

  // Auto-speak new assistant messages when voice is enabled
  const lastMessageRef = useRef<string | null>(null);
  useEffect(() => {
    if (!voiceEnabled) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.id !== "streaming" && lastMsg.id !== "initial" && lastMsg.id !== lastMessageRef.current) {
      lastMessageRef.current = lastMsg.id;
      speakMessage(lastMsg.id, lastMsg.content);
    }
  }, [messages, voiceEnabled, speakMessage]);

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

  // ── Load long-term memory context ──────────────────────────────────────────
  const [memoryContext, setMemoryContext] = useState("");
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("navi_core_memory")
        .select("memory_type, content, importance")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        const blocks = compressMemories(data as any);
        setMemoryContext(buildMemoryContext(blocks));
      }
    })();
  }, [user]);

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

  // ── Clear thread (auto-triggers OmniSync) ───────────────────────────────
  const clearThread = useCallback(async () => {
    if (!user || !conversationId) {
      setMessages([INITIAL_MESSAGE]);
      toast({ title: "Thread cleared", description: "Neural link refreshed." });
      return;
    }

    setIsSyncing(true);
    try {
      // ─── Full OmniSync before clearing ───
      const realMessages = messages.filter(m => m.id !== "initial" && m.id !== "streaming");
      const userMsgs = realMessages.filter(m => m.role === "user");
      const assistantMsgs = realMessages.filter(m => m.role === "assistant");

      // 1. Extract pattern-based memories from ALL user messages
      const allMemories = userMsgs.flatMap(m => extractMemoriesFromMessage(m.content));

      // 2. Build detailed thread summary — capture full conversation pairs
      const threadParts: string[] = [];
      for (let i = 0; i < userMsgs.length; i++) {
        const uMsg = userMsgs[i];
        threadParts.push(`U: ${uMsg.content.substring(0, 200)}`);
        const uIdx = realMessages.indexOf(uMsg);
        const reply = realMessages.slice(uIdx + 1).find(m => m.role === "assistant");
        if (reply) {
          // Keep more detail — actions taken, key info shared
          threadParts.push(`N: ${reply.content.substring(0, 300)}`);
        }
      }
      const condensedThread = threadParts.join("\n").substring(0, 5000);

      // 3. Also save raw assistant insights — things NAVI told the user
      const naviInsights = assistantMsgs
        .filter(m => m.content.length > 80)
        .slice(-15)
        .map(m => m.content.substring(0, 250))
        .join(" | ")
        .substring(0, 2000);

      // 4. Build app state snapshot
      const stateSnapshot = [
        `Level: ${profile.navi_level} | XP: ${profile.xp_total} | Streak: ${profile.current_streak}d`,
        `Bond: A${profile.bond_affection}/T${profile.bond_trust}/L${profile.bond_loyalty}`,
        `Class: ${profile.character_class || "None"} | MBTI: ${profile.mbti_type || "None"} | Subclass: ${profile.subclass || "None"}`,
        `Active Quests: ${quests.filter(q => !q.completed).map(q => q.name).join(", ") || "None"}`,
        `Completed Quests: ${quests.filter(q => q.completed).length}`,
        `Skills: ${skills.map(s => `${s.name} L${s.level}`).join(", ") || "None"}`,
        `Recent Journal: ${entries.slice(0, 5).map(j => j.title).join(", ") || "None"}`,
        `Equipment: ${equipment.filter(e => e.equipped).map(e => e.name).join(", ") || "None"}`,
      ].join(" | ");

      // 5. Save all memory rows
      const memoryRows: Array<{ user_id: string; memory_type: string; content: string; importance: number }> = [];

      for (const item of allMemories) {
        memoryRows.push({ user_id: user.id, memory_type: item.category, content: item.detail, importance: item.importance });
      }

      if (condensedThread.length > 50) {
        memoryRows.push({ user_id: user.id, memory_type: "thread_summary", content: condensedThread, importance: 4 });
      }

      if (naviInsights.length > 50) {
        memoryRows.push({ user_id: user.id, memory_type: "navi_insights", content: naviInsights, importance: 3 });
      }

      memoryRows.push({
        user_id: user.id,
        memory_type: "app_snapshot",
        content: `[${new Date().toISOString().split("T")[0]}] ${stateSnapshot}`,
        importance: 2,
      });

      if (memoryRows.length > 0) {
        const { error: insErr } = await supabase
          .from("navi_core_memory")
          .insert(memoryRows as any);
        if (insErr) {
          console.error("[CLEAR_THREAD] memory insert failed:", insErr);
          toast({
            title: "Memory save failed",
            description: `OmniSync could not write to long-term memory: ${insErr.message}. Thread NOT cleared.`,
            variant: "destructive",
          });
          return; // Do NOT clear the thread when memory save fails
        }
      }

      // 6. Refresh memory context for next conversation
      const { data } = await supabase
        .from("navi_core_memory")
        .select("memory_type, content, importance")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        const blocks = compressMemories(data as any);
        setMemoryContext(buildMemoryContext(blocks));
      }

      // 7. Delete chat messages from DB (keep conversation shell)
      await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);

      // 8. Clear UI
      setMessages([INITIAL_MESSAGE]);
      toast({ title: "⚡ Thread Cleared + OmniSync", description: `Saved ${memoryRows.length} memories. NAVI will remember everything.` });
    } catch (err) {
      console.error("[CLEAR_THREAD] OmniSync error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "OmniSync failed",
        description: `Memory not saved: ${msg}. Thread preserved — try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, conversationId, messages, profile, quests, skills, entries, equipment]);

  // ── OmniSync — snapshot app state + condense full thread into memory ───────
  const [isSyncing, setIsSyncing] = useState(false);
  const omniSync = useCallback(async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Extract memories from ALL user messages in the thread
      const userMsgs = messages.filter(m => m.role === "user" && m.id !== "initial");
      const allMemories = userMsgs.flatMap(m => extractMemoriesFromMessage(m.content));

      // 2. Condense the full conversation into a summary block
      const assistantMsgs = messages.filter(m => m.role === "assistant" && m.id !== "initial" && m.id !== "streaming");
      const threadSummaryParts: string[] = [];
      
      // Take key exchanges (user question + navi response pairs)
      const pairs = Math.min(userMsgs.length, 25);
      for (let i = 0; i < pairs; i++) {
        const uMsg = userMsgs[i];
        threadSummaryParts.push(`User: ${uMsg.content.substring(0, 120)}`);
        // Find the assistant reply that came after this user message
        const uIdx = messages.indexOf(uMsg);
        const nextAssistant = messages.slice(uIdx + 1).find(m => m.role === "assistant");
        if (nextAssistant) {
          threadSummaryParts.push(`Navi: ${nextAssistant.content.substring(0, 120)}`);
        }
      }

      const condensedThread = threadSummaryParts.join("\n").substring(0, 3000);

      // 3. Build app state snapshot
      const stateSnapshot = [
        `Level: ${profile.navi_level} | XP: ${profile.xp_total} | Streak: ${profile.current_streak}d`,
        `Bond: A${profile.bond_affection}/T${profile.bond_trust}/L${profile.bond_loyalty}`,
        `Class: ${profile.character_class || "None"} | MBTI: ${profile.mbti_type || "None"} | Subclass: ${profile.subclass || "None"}`,
        `Active Quests: ${quests.filter(q => !q.completed).map(q => q.name).join(", ") || "None"}`,
        `Skills: ${skills.map(s => `${s.name} L${s.level}`).join(", ") || "None"}`,
        `Recent Journal: ${entries.slice(0, 5).map(j => j.title).join(", ") || "None"}`,
      ].join(" | ");

      // 4. Save to navi_core_memory as condensed entries
      const memoryRows: Array<{ user_id: string; memory_type: string; content: string; importance: number }> = [];

      // Add extracted pattern memories
      for (const item of allMemories) {
        memoryRows.push({
          user_id: user.id,
          memory_type: item.category,
          content: item.detail,
          importance: item.importance,
        });
      }

      // Add condensed thread summary
      if (condensedThread.length > 50) {
        memoryRows.push({
          user_id: user.id,
          memory_type: "thread_summary",
          content: condensedThread,
          importance: 3,
        });
      }

      // Add app state snapshot
      memoryRows.push({
        user_id: user.id,
        memory_type: "app_snapshot",
        content: `[${new Date().toISOString().split("T")[0]}] ${stateSnapshot}`,
        importance: 2,
      });

      if (memoryRows.length > 0) {
        const { error: insErr } = await supabase
          .from("navi_core_memory")
          .insert(memoryRows as any);
        if (insErr) {
          console.error("[OMNISYNC] memory insert failed:", insErr);
          toast({
            title: "OmniSync failed",
            description: `Could not save to long-term memory: ${insErr.message}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Refresh memory context
      const { data } = await supabase
        .from("navi_core_memory")
        .select("memory_type, content, importance")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (data && data.length > 0) {
        const blocks = compressMemories(data as any);
        setMemoryContext(buildMemoryContext(blocks));
      }

      toast({ title: "⚡ OmniSync Complete", description: `Saved ${memoryRows.length} memory entries. NAVI's long-term memory updated.` });
    } catch (err) {
      console.error("[OMNISYNC] Error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "OmniSync failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, messages, profile, quests, skills, entries]);

  // ── Copy message ──────────────────────────────────────────────────────────
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied", description: "Message copied to clipboard." });
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || !user || !session?.access_token || !conversationId) return;

    // Paywall: free tier daily AI message cap (owners/Core users bypass).
    if (!paywall.hasFullAccess) {
      const { data: newCount, error: rpcErr } = await supabase.rpc("consume_message_credit");
      if (rpcErr) {
        console.error("[MavisChat] consume_message_credit failed:", rpcErr);
        toast({ title: "Error", description: "Could not verify message credits.", variant: "destructive" });
        return;
      }
      if ((newCount as number) > paywall.limits.DAILY_AI_MESSAGES) {
        toast({
          title: "Daily limit reached",
          description: `Free tier: ${paywall.limits.DAILY_AI_MESSAGES} messages/day. Upgrade to Core for unlimited.`,
          variant: "destructive",
        });
        return;
      }
    }

    const userContent = input.trim();
    setInput("");
    setIsLoading(true);
    stopSpeaking();

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
    const allHistory = updatedMessages
      .filter((m) => m.id !== "initial")
      .map((m) => ({ role: m.role, content: m.content }));
    // Keep last 20 messages to avoid token overload / rate limits
    const chatHistory = allHistory.length > 20 ? allHistory.slice(-20) : allHistory;

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
          memory_context: memoryContext || undefined,
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
          const actions = parsedActions.length > 0 ? parsedActions : inferFallbackActions(userContent, cleanText, { quests, entries, skills });

          console.log("[NAVI] Raw response length:", assistantContent.length);
          console.log("[NAVI] Raw response preview:", assistantContent.slice(0, 500));
          console.log("[NAVI] Contains :::ACTION:", assistantContent.includes(":::ACTION"));
          console.log("[NAVI] Parsed actions count:", parsedActions.length);
          console.log("[NAVI] Fallback actions used:", parsedActions.length === 0 && actions.length > 0);
          console.log("[NAVI] Actions:", JSON.stringify(actions, null, 2));

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
              refetchAchievements(),
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
  }, [input, isLoading, user, session, conversationId, messages, profile, quests, skills, equipment, entries, achievements, buffs, refetchQuests, refetchJournal, refetchSkills, refetchEquipment, refetchEffects, refetchProfile, refetchAchievements, updateProfile, paywall]);

  // ── Key handler: Shift+Enter = newline, Enter alone = send ────────────────
  // isComposing guard prevents firing during IME composition (mobile autocomplete,
  // emoji picker, CJK input) which was causing the "sends before I'm done" bug.
  const composingRef = useRef(false);
  const handleCompositionStart = useCallback(() => { composingRef.current = true; }, []);
  const handleCompositionEnd = useCallback(() => {
    // Small delay to let the compositionend event settle before allowing Enter
    setTimeout(() => { composingRef.current = false; }, 100);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !composingRef.current) {
        e.preventDefault();
        sendMessage();
      }
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
      <PageHeader title="NAVI.EXE" subtitle="// NEURAL LINK ACTIVE">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-primary/30 transition-colors"
          >
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            {voiceEnabled ? "VOICE ON" : "VOICE OFF"}
          </button>
          <button
            onClick={omniSync}
            disabled={isSyncing || messages.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-30"
            title="Save full thread + app state to NAVI long-term memory"
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            OMNISYNC
          </button>
          <button
            onClick={clearThread}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted border border-border text-muted-foreground text-xs font-mono hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Trash2 size={12} />
            CLEAR THREAD
          </button>
        </div>
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
                <div className="flex items-center gap-1.5">
                  {/* Speak button — assistant messages only */}
                  {msg.role === "assistant" && msg.id !== "streaming" && (
                    <button
                      onClick={() => speakMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      title={currentlySpokenId === msg.id ? "Stop speaking" : "Speak message"}
                    >
                      {currentlySpokenId === msg.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                    </button>
                  )}
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

      {/* Free-tier daily message limit banner */}
      {!paywall.hasFullAccess &&
        profile.daily_message_count >= paywall.limits.DAILY_AI_MESSAGES && (
          <div className="mb-2">
            <UnlockWithCoreCard
              title="DAILY MESSAGE LIMIT REACHED"
              description={`Free tier: ${paywall.limits.DAILY_AI_MESSAGES} AI messages/day. Resets at midnight. Upgrade to Core for unlimited.`}
            />
          </div>
        )}

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
        {/* Voice input */}
        <VoiceInput
          onTranscript={(text) => setInput(prev => prev ? prev + ' ' + text : text)}
          disabled={isLoading}
        />
        {/* Textarea — clearly visible, grows with content */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
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

