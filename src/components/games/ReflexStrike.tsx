import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Target } from "lucide-react";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ROUNDS = 8;
const WINDOW_MS = 700; // how long target is visible
const MIN_DELAY = 800;
const MAX_DELAY = 2200;

type Phase = "idle" | "waiting" | "active" | "missed" | "result";

export default function ReflexStrike() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [missedRounds, setMissedRounds] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const appearTime = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  function randomPos() {
    return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 70 };
  }

  const scheduleTarget = useCallback(() => {
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timeoutRef.current = setTimeout(() => {
      setTargetPos(randomPos());
      appearTime.current = Date.now();
      setPhase("active");

      timeoutRef.current = setTimeout(() => {
        setPhase("missed");
        setMissedRounds((m) => m + 1);
        setTimeout(() => {
          setRound((r) => {
            const next = r + 1;
            if (next >= ROUNDS) {
              finishGame([]);
              return next;
            }
            setPhase("waiting");
            scheduleTarget();
            return next;
          });
        }, 600);
      }, WINDOW_MS);
    }, delay);
  }, []);

  function startGame() {
    setTimes([]);
    setMissedRounds(0);
    setRound(0);
    setPhase("waiting");
    scheduleTarget();
  }

  function hitTarget() {
    if (phase !== "active") return;
    clearTimeout(timeoutRef.current);
    const elapsed = Date.now() - appearTime.current;
    setTimes((prev) => {
      const next = [...prev, elapsed];
      const nextRound = round + 1;
      if (nextRound >= ROUNDS) {
        finishGame(next);
      } else {
        setRound(nextRound);
        setPhase("waiting");
        scheduleTarget();
      }
      return next;
    });
    setPhase("waiting");
  }

  function finishGame(finalTimes: number[]) {
    clearTimeout(timeoutRef.current);
    setPhase("result");
    const avg = finalTimes.length ? Math.round(finalTimes.reduce((a, b) => a + b, 0) / finalTimes.length) : 9999;
    const score = Math.max(0, Math.round((WINDOW_MS - avg) / 10));
    if (user) {
      supabase.from("mini_game_scores").insert({
        user_id: user.id,
        game_id: "reflex",
        score,
        metadata: { avg_ms: avg, missed: missedRounds, xp_earned: Math.max(5, score) },
      });
    }
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const avgMs = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
  const score = avgMs !== null ? Math.max(0, Math.round((WINDOW_MS - avgMs) / 10)) : 0;

  if (phase === "idle" || phase === "result") {
    return (
      <HudCard title="REFLEX STRIKE" icon={<Timer size={14} />}>
        <div className="text-center py-6">
          {phase === "result" && (
            <>
              <p className="text-4xl font-display font-bold text-neon-green mb-1">{score}</p>
              <p className="text-sm font-mono text-muted-foreground mb-1">SCORE</p>
              {avgMs !== null && (
                <p className="text-xs font-mono text-primary mb-1">AVG: {avgMs}ms</p>
              )}
              <p className="text-xs font-mono text-muted-foreground mb-1">
                HIT: {times.length}/{ROUNDS} · MISSED: {missedRounds}
              </p>
              <p className="text-xs font-mono text-neon-green mb-6">+{Math.max(5, score)} XP EARNED</p>
            </>
          )}
          <p className="text-xs font-body text-muted-foreground mb-4 max-w-xs mx-auto">
            A target appears at a random position. Tap it before it vanishes. {ROUNDS} rounds.
          </p>
          <button onClick={startGame} className="px-6 py-2 rounded border border-neon-green/50 bg-neon-green/10 text-neon-green text-sm font-mono hover:bg-neon-green/20 transition-colors">
            {phase === "result" ? "PLAY AGAIN" : "START"}
          </button>
        </div>
      </HudCard>
    );
  }

  return (
    <HudCard title="REFLEX STRIKE" icon={<Timer size={14} />}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-mono text-muted-foreground">ROUND {round + 1}/{ROUNDS}</span>
        <span className={`text-xs font-mono ${
          phase === "waiting" ? "text-muted-foreground animate-pulse" :
          phase === "active" ? "text-neon-green font-bold" :
          phase === "missed" ? "text-destructive" :
          "text-foreground"
        }`}>
          {phase === "waiting" ? "READY..." :
           phase === "active" ? "STRIKE!" :
           phase === "missed" ? "TOO SLOW" : ""}
        </span>
        <span className="text-xs font-mono text-primary">HITS: {times.length}</span>
      </div>

      <div
        className="relative rounded-lg border border-border bg-muted/10 overflow-hidden"
        style={{ height: "280px" }}
        onClick={hitTarget}
      >
        {phase === "waiting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-ping" />
          </div>
        )}

        <AnimatePresence>
          {phase === "active" && (
            <motion.div
              key="target"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
            >
              <div className="w-12 h-12 rounded-full border-2 border-neon-green bg-neon-green/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-neon-green/60" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "missed" && (
          <div className="absolute inset-0 bg-destructive/5 flex items-center justify-center">
            <p className="text-destructive font-mono text-sm font-bold">MISSED</p>
          </div>
        )}
      </div>

      {times.length > 0 && (
        <div className="flex gap-1 mt-3 flex-wrap">
          {times.map((t, i) => (
            <span key={i} className="text-[9px] font-mono text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded">
              {t}ms
            </span>
          ))}
        </div>
      )}
    </HudCard>
  );
}
