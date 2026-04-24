import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Check, X } from "lucide-react";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Phase = "idle" | "showing" | "input" | "result" | "gameover";

function generatePattern(size: number, count: number): number[] {
  const indices: number[] = [];
  const total = size * size;
  while (indices.length < count) {
    const n = Math.floor(Math.random() * total);
    if (!indices.includes(n)) indices.push(n);
  }
  return indices;
}

export default function MemoryMatrix() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [pattern, setPattern] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [showingIndex, setShowingIndex] = useState(-1);

  const gridSize = Math.min(3 + Math.floor((level - 1) / 3), 5);
  const patternCount = Math.min(2 + level, gridSize * gridSize - 1);
  const showDelay = Math.max(400, 800 - level * 30);

  function startRound() {
    const p = generatePattern(gridSize, patternCount);
    setPattern(p);
    setSelected([]);
    setPhase("showing");
    setShowingIndex(-1);
    // Flash cells one by one
    let idx = 0;
    const timer = setInterval(() => {
      setShowingIndex(idx);
      idx++;
      if (idx >= p.length) {
        clearInterval(timer);
        setTimeout(() => {
          setShowingIndex(-1);
          setPhase("input");
        }, showDelay);
      }
    }, showDelay);
  }

  function startGame() {
    setLevel(1);
    setScore(0);
    setLastCorrect(null);
    startRound();
  }

  function toggleCell(index: number) {
    if (phase !== "input") return;
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function submitAnswer() {
    const correct =
      selected.length === pattern.length &&
      pattern.every((i) => selected.includes(i));
    setLastCorrect(correct);
    setPhase("result");

    if (correct) {
      setScore((s) => s + level);
      setTimeout(() => {
        setLevel((l) => l + 1);
        startRound();
      }, 1000);
    } else {
      const finalScore = score;
      setTimeout(() => {
        setPhase("gameover");
        if (user) {
          supabase.from("mini_game_scores").insert({
            user_id: user.id,
            game_id: "memory",
            score: finalScore,
            metadata: { level_reached: level, xp_earned: finalScore },
          });
        }
      }, 1200);
    }
  }

  const total = gridSize * gridSize;

  if (phase === "idle" || phase === "gameover") {
    return (
      <HudCard title="MEMORY MATRIX" icon={<Grid3X3 size={14} />}>
        <div className="text-center py-6">
          {phase === "gameover" && (
            <>
              <p className="text-4xl font-display font-bold text-secondary mb-1">{score}</p>
              <p className="text-sm font-mono text-muted-foreground mb-1">POINTS · LEVEL {level}</p>
              <p className="text-xs font-mono text-neon-green mb-6">+{score} XP EARNED</p>
            </>
          )}
          <p className="text-xs font-body text-muted-foreground mb-4 max-w-xs mx-auto">
            Watch the pattern — then reproduce it. Each level adds more cells and less time.
          </p>
          <button onClick={startGame} className="px-6 py-2 rounded border border-secondary/50 bg-secondary/10 text-secondary text-sm font-mono hover:bg-secondary/20 transition-colors">
            {phase === "gameover" ? "PLAY AGAIN" : "START"}
          </button>
        </div>
      </HudCard>
    );
  }

  return (
    <HudCard title="MEMORY MATRIX" icon={<Grid3X3 size={14} />}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-mono text-muted-foreground">LEVEL {level}</span>
        <span className={`text-xs font-mono ${
          phase === "showing" ? "text-primary animate-pulse" :
          phase === "input" ? "text-neon-green" :
          phase === "result" ? (lastCorrect ? "text-neon-green" : "text-destructive") :
          "text-muted-foreground"
        }`}>
          {phase === "showing" ? "MEMORIZE..." :
           phase === "input" ? "YOUR TURN" :
           phase === "result" ? (lastCorrect ? "CORRECT!" : "WRONG") :
           ""}
        </span>
        <span className="text-xs font-mono text-secondary">SCORE: {score}</span>
      </div>

      <div
        className="mx-auto mb-4"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "6px",
          maxWidth: `${gridSize * 52}px`,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isPattern = pattern.includes(i);
          const isSelected = selected.includes(i);
          const isShowing = showingIndex !== -1 && pattern[showingIndex] === i;

          return (
            <motion.button
              key={i}
              onClick={() => toggleCell(i)}
              animate={{
                scale: isShowing ? 1.1 : 1,
                backgroundColor:
                  phase === "result" && isPattern
                    ? lastCorrect ? "#4ade80" : "#ef4444"
                    : isShowing || (phase === "showing" && pattern.slice(0, showingIndex + 1).includes(i))
                    ? "#38bdf8"
                    : isSelected
                    ? "#a78bfa"
                    : "transparent",
              }}
              transition={{ duration: 0.15 }}
              disabled={phase !== "input"}
              className="aspect-square rounded border border-border"
              style={{ minHeight: "44px" }}
            />
          );
        })}
      </div>

      {phase === "input" && (
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setSelected([])}
            className="px-4 py-1.5 text-xs font-mono rounded border border-border text-muted-foreground hover:border-primary/30 transition-colors"
          >
            CLEAR
          </button>
          <button
            onClick={submitAnswer}
            className="px-6 py-1.5 text-xs font-mono rounded border border-secondary/50 bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
          >
            SUBMIT ({selected.length}/{pattern.length})
          </button>
        </div>
      )}
    </HudCard>
  );
}
