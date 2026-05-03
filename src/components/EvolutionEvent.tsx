import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  tierFromLevel,
  TIER_NAMES,
  evolutionTitleFromMbtiAndLevel,
  MBTI_CLASS_MAP,
  TIER_THRESHOLDS,
  TIER_COLORS,
  type EvolutionTier,
} from "@/lib/classEvolution";

interface Props {
  operatorLevel: number;
  lastEvolutionTier: number;
  mbtiType: string | null;
  naviName: string;
  displayName: string | null;
  chatContext: Record<string, unknown>;
  onDismiss: (newTier: number) => void;
}

type Phase = "old-title" | "tier-flash" | "new-title" | "navi-speaks" | "done";

export default function EvolutionEvent({
  operatorLevel,
  lastEvolutionTier,
  mbtiType,
  naviName,
  displayName,
  chatContext,
  onDismiss,
}: Props) {
  const newTier = tierFromLevel(operatorLevel);
  const oldTier = lastEvolutionTier as EvolutionTier;

  const oldTitle = mbtiType
    ? evolutionTitleFromMbtiAndLevel(mbtiType, TIER_THRESHOLDS[oldTier].max)
    : TIER_NAMES[oldTier];
  const newTitle = mbtiType
    ? evolutionTitleFromMbtiAndLevel(mbtiType, operatorLevel)
    : TIER_NAMES[newTier];
  const classInfo = mbtiType ? MBTI_CLASS_MAP[mbtiType.toUpperCase()] : null;

  const [phase, setPhase] = useState<Phase>("old-title");
  const [naviMessage, setNaviMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const naviMessageRef = useRef("");

  // Auto-advance phases
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase("tier-flash"), 1800));
    timers.push(setTimeout(() => setPhase("new-title"), 3800));
    timers.push(setTimeout(() => { setPhase("navi-speaks"); fetchNaviMessage(); }, 5600));
    return () => timers.forEach(clearTimeout);
  }, []);

  async function fetchNaviMessage() {
    setIsStreaming(true);
    naviMessageRef.current = "";
    try {
      const evolutionPrompt = `[SYSTEM — EVOLUTION EVENT]
${displayName || "Operator"} just crossed into Tier ${newTier}: ${TIER_NAMES[newTier]}.
Their new title is "${newTitle}". Their old title was "${oldTitle}".
${classInfo ? `They are ${classInfo.className}.` : ""}
Write one powerful message — 2-3 sentences — acknowledging this evolution. Reference who they were at the start of Tier ${oldTier} versus who they are now entering Tier ${newTier}. No greetings. Speak from the bond.`;

      const res = await supabase.functions.invoke("navi-chat", {
        body: {
          messages: [{ role: "user", content: evolutionPrompt }],
          context: { ...chatContext, _evolutionEvent: true },
        },
      });

      if (res.error) throw res.error;

      // supabase.functions.invoke returns the full response data (not streaming)
      // Parse text from the streamed body manually
      const reader = res.data?.getReader ? res.data.getReader() : null;
      if (!reader) {
        // Fallback: static message if streaming not available
        const staticMsg = `Tier ${newTier}. You earned it. "${oldTitle}" was the foundation — "${newTitle}" is what you've become. Keep moving.`;
        setNaviMessage(staticMsg);
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.replace("data: ", "").trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed?.choices?.[0]?.delta?.content ?? "";
            naviMessageRef.current += delta;
            setNaviMessage(naviMessageRef.current);
          } catch {}
        }
      }
    } catch {
      setNaviMessage(
        `Tier ${newTier}. "${oldTitle}" was the foundation — "${newTitle}" is what you've become.`
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const color = TIER_COLORS[newTier] ?? "#00E5FF";

  const content = (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
        }}
      />

      <AnimatePresence mode="wait">
        {/* Phase: old title fades out */}
        {phase === "old-title" && (
          <motion.div
            key="old-title"
            className="text-center"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-mono tracking-widest text-white/30 mb-4 uppercase">
              {TIER_NAMES[oldTier]}
            </p>
            <h2 className="font-display text-4xl font-bold text-white/60">{oldTitle}</h2>
          </motion.div>
        )}

        {/* Phase: tier name flash */}
        {phase === "tier-flash" && (
          <motion.div
            key="tier-flash"
            className="text-center"
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h1
              className="font-display text-6xl font-black tracking-widest"
              style={{ color }}
              animate={{ textShadow: [`0 0 20px ${color}80`, `0 0 60px ${color}`, `0 0 20px ${color}80`] }}
              transition={{ duration: 1, repeat: 1 }}
            >
              {TIER_NAMES[newTier]}
            </motion.h1>
            <p className="text-xs font-mono tracking-widest text-white/40 mt-3">
              TIER {newTier} UNLOCKED — LEVEL {operatorLevel}
            </p>
          </motion.div>
        )}

        {/* Phase: new title revealed */}
        {phase === "new-title" && (
          <motion.div
            key="new-title"
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-mono tracking-widest mb-3 uppercase" style={{ color, opacity: 0.7 }}>
              {TIER_NAMES[newTier]}
            </p>
            <motion.h2
              className="font-display text-5xl font-bold"
              style={{ color }}
              animate={{ textShadow: [`0 0 10px ${color}40`, `0 0 40px ${color}99`, `0 0 10px ${color}40`] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {newTitle}
            </motion.h2>
            {classInfo && (
              <p className="text-xs font-mono text-white/30 mt-4">{classInfo.className}</p>
            )}
          </motion.div>
        )}

        {/* Phase: NAVI speaks */}
        {(phase === "navi-speaks" || phase === "done") && (
          <motion.div
            key="navi-speaks"
            className="text-center max-w-md px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-mono tracking-widest mb-6 uppercase" style={{ color, opacity: 0.7 }}>
              {TIER_NAMES[newTier]} — {newTitle}
            </p>
            <div
              className="border rounded-lg p-5 mb-6 text-left"
              style={{ borderColor: `${color}30`, background: `${color}08` }}
            >
              <p className="text-[10px] font-mono mb-2 uppercase" style={{ color, opacity: 0.6 }}>
                {naviName}
              </p>
              <p className="text-sm font-body text-white/80 leading-relaxed min-h-[3em]">
                {naviMessage}
                {isStreaming && (
                  <motion.span
                    className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                    style={{ background: color }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                )}
              </p>
            </div>
            {!isStreaming && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => onDismiss(newTier)}
                className="px-8 py-2.5 rounded font-mono text-xs tracking-widest transition-all"
                style={{
                  border: `1px solid ${color}60`,
                  color,
                  background: `${color}10`,
                }}
              >
                CONTINUE →
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return createPortal(content, document.body);
}
