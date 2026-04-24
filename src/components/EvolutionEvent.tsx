import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TIER_COLORS,
  TIER_NAMES,
  evolutionTitleFromMbtiAndLevel,
  type Tier,
} from "@/lib/xpSystem";
import { useAppData } from "@/contexts/AppDataContext";

interface Props {
  oldTier: number;
  newTier: number;
  mbtiType: string;
  naviLevel: number;
  naviName: string;
  operatorName?: string;
  onDismiss: () => void;
}

export default function EvolutionEvent({
  oldTier,
  newTier,
  mbtiType,
  naviLevel,
  naviName,
  operatorName,
  onDismiss,
}: Props) {
  const { updateProfile } = useAppData();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [streamed, setStreamed] = useState("");

  const tierColor = TIER_COLORS[(newTier as Tier) ?? 1] ?? "#00E5FF";
  const oldTierColor = TIER_COLORS[(oldTier as Tier) ?? 1] ?? "#666";
  const newTierName = TIER_NAMES[(newTier as Tier) ?? 1] ?? "ASCENDING";

  // Compute representative levels for each tier (their threshold)
  const oldLevel = oldTier === 1 ? 1 : oldTier === 2 ? 11 : oldTier === 3 ? 26 : oldTier === 4 ? 51 : 76;
  const newLevel = newTier === 1 ? 1 : newTier === 2 ? 11 : newTier === 3 ? 26 : newTier === 4 ? 51 : 76;

  const oldTitle = useMemo(
    () => evolutionTitleFromMbtiAndLevel(mbtiType, oldLevel),
    [mbtiType, oldLevel]
  );
  const newTitle = useMemo(
    () => evolutionTitleFromMbtiAndLevel(mbtiType, newLevel),
    [mbtiType, newLevel]
  );

  const opName = operatorName || "Operator";

  const fullMessage = useMemo(
    () =>
      `${oldTitle}. That is who you were when this tier began. ${newTierName}. ${newTitle}. That is who you are now. I have been here for all of it, ${opName}. I will be here for what comes next.`,
    [oldTitle, newTierName, newTitle, opName]
  );

  // Phase orchestration
  useEffect(() => {
    setPhase(1);
    const t1 = setTimeout(() => setPhase(2), 1500);
    const t2 = setTimeout(() => setPhase(3), 3000);
    const t3 = setTimeout(() => setPhase(4), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Streamed-in chat bubble
  useEffect(() => {
    if (phase < 4) return;
    let i = 0;
    setStreamed("");
    const interval = setInterval(() => {
      i += 2;
      setStreamed(fullMessage.slice(0, i));
      if (i >= fullMessage.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [phase, fullMessage]);

  const handleDismiss = async () => {
    try {
      await updateProfile({ last_evolution_tier: newTier } as any);
    } catch (e) {
      console.error("[EvolutionEvent] failed to persist last_evolution_tier", e);
    }
    onDismiss();
  };

  if (typeof document === "undefined") return null;

  const overlay = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden"
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "linear-gradient(transparent 50%, rgba(0,0,0,0.04) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      {/* Radial color glow tied to tier */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${tierColor}22 0%, transparent 60%)`,
        }}
      />

      <div className="relative w-full max-w-2xl px-6 flex flex-col items-center text-center">
        {/* PHASE 1 — old title dissolves upward */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              key="old"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 0.6, y: 0 }}
              exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mb-8"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                {TIER_NAMES[(oldTier as Tier) ?? 1]}
              </p>
              <h2
                className="font-display text-3xl md:text-4xl font-bold tracking-wide"
                style={{ color: oldTierColor, opacity: 0.7 }}
              >
                {oldTitle}
              </h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 2 — tier name flash */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              key="tier-name"
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{
                opacity: 1,
                scale: phase === 2 ? [1.4, 1, 1.05, 1] : 1,
              }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="mb-4"
            >
              <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground mb-2">
                EVOLUTION
              </p>
              <h1
                className="font-display text-5xl md:text-7xl font-black tracking-widest"
                style={{
                  color: tierColor,
                  textShadow: `0 0 24px ${tierColor}, 0 0 48px ${tierColor}80`,
                }}
              >
                {newTierName}
              </h1>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 3 — new title glows in */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              key="new-title"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
              className="mb-8"
            >
              <h2
                className="font-display text-3xl md:text-5xl font-bold tracking-wide"
                style={{
                  color: tierColor,
                  textShadow: `0 0 16px ${tierColor}cc`,
                }}
              >
                {newTitle}
              </h2>
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest mt-2">
                TIER {newTier} // LEVEL {naviLevel}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PHASE 4 — NAVI message bubble + continue */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div
              key="bubble"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="w-full max-w-xl"
            >
              <div
                className="rounded-lg border p-5 text-left bg-card/80 backdrop-blur-sm"
                style={{
                  borderColor: `${tierColor}55`,
                  boxShadow: `0 0 32px ${tierColor}22`,
                }}
              >
                <p
                  className="text-[10px] font-mono mb-2 tracking-widest"
                  style={{ color: tierColor }}
                >
                  {naviName.toUpperCase()} //
                </p>
                <p className="text-sm md:text-base font-body text-foreground leading-relaxed">
                  {streamed}
                  {streamed.length < fullMessage.length && (
                    <span
                      className="inline-block w-1.5 h-4 ml-1 align-middle animate-pulse"
                      style={{ backgroundColor: tierColor }}
                    />
                  )}
                </p>
              </div>

              {streamed.length >= fullMessage.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-6 flex justify-center"
                >
                  <button
                    onClick={handleDismiss}
                    className="px-8 py-3 rounded border-2 font-display font-bold tracking-widest text-sm bg-card/60 hover:bg-card transition-all"
                    style={{
                      borderColor: tierColor,
                      color: tierColor,
                      textShadow: `0 0 8px ${tierColor}99`,
                      boxShadow: `0 0 16px ${tierColor}55`,
                    }}
                  >
                    CONTINUE →
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return createPortal(overlay, document.body);
}
