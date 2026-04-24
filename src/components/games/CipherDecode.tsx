import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Check, X, Zap } from "lucide-react";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const CIPHERS = [
  { encoded: "BQQMF",   decoded: "APPLE",  shift: 1 },
  { encoded: "XPSME",   decoded: "WORLD",  shift: 1 },
  { encoded: "TIBEP",   decoded: "SHARP",  shift: 1 },
  { encoded: "ESJWF",   decoded: "DRIVE",  shift: 1 },
  { encoded: "CMBOL",   decoded: "BLANK",  shift: 1 },
  { encoded: "GPDVT",   decoded: "FOCUS",  shift: 1 },
  { encoded: "HSPXUI",  decoded: "GROWTH", shift: 1 },
  { encoded: "TUSFBL",  decoded: "STREAK", shift: 1 },
  { encoded: "RVFTU",   decoded: "QUEST",  shift: 1 },
  { encoded: "WJDUPZ",  decoded: "VICTOR", shift: 1 },
  { encoded: "QPXFS",   decoded: "POWER",  shift: 1 },
  { encoded: "DPEF",    decoded: "CODE",   shift: 1 },
  { encoded: "OFUXPSL", decoded: "NETWORK", shift: 1 },
  { encoded: "MBVODI",  decoded: "LAUNCH", shift: 1 },
  { encoded: "QSPUPPM", decoded: "PROTOCOL", shift: 1 },
];

const TIME_LIMIT = 30;

export default function CipherDecode() {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [shuffled, setShuffled] = useState<typeof CIPHERS>([]);

  const currentCipher = shuffled[round];

  useEffect(() => {
    if (!started || gameOver) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          endGame(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [started, gameOver]);

  function startGame() {
    const s = [...CIPHERS].sort(() => Math.random() - 0.5);
    setShuffled(s);
    setRound(0);
    setScore(0);
    setTimeLeft(TIME_LIMIT);
    setGameOver(false);
    setInput("");
    setFeedback(null);
    setStarted(true);
  }

  function submit() {
    if (!currentCipher) return;
    const correct = input.trim().toUpperCase() === currentCipher.decoded;
    setFeedback(correct ? "correct" : "wrong");
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      setFeedback(null);
      setInput("");
      if (round + 1 >= shuffled.length) {
        endGame(correct ? score + 1 : score);
      } else {
        setRound((r) => r + 1);
      }
    }, 700);
  }

  function endGame(finalScore: number) {
    setGameOver(true);
    const xp = finalScore * 3;
    if (user) {
      supabase.from("mini_game_scores").insert({
        user_id: user.id,
        game_id: "cipher",
        score: finalScore,
        metadata: { xp_earned: xp },
      });
    }
  }

  if (!started || gameOver) {
    return (
      <HudCard title="CIPHER DECODE" icon={<Zap size={14} />}>
        {gameOver ? (
          <div className="text-center py-6">
            <p className="text-4xl font-display font-bold text-primary mb-1">{score}</p>
            <p className="text-sm font-mono text-muted-foreground mb-1">/ {shuffled.length} CORRECT</p>
            <p className="text-xs font-mono text-neon-green mb-6">+{score * 3} XP EARNED</p>
            <p className="text-xs font-body text-muted-foreground mb-4">
              Each Caesar cipher shifts each letter by +1. Decode the word before time runs out.
            </p>
            <button onClick={startGame} className="px-6 py-2 rounded border border-primary/50 bg-primary/10 text-primary text-sm font-mono hover:bg-primary/20 transition-colors">
              PLAY AGAIN
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs font-body text-muted-foreground mb-3 max-w-xs mx-auto">
              Each word is Caesar-shifted by +1. Type the decoded word. You have {TIME_LIMIT} seconds to solve as many as possible.
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mb-1">EXAMPLE</p>
            <p className="text-sm font-mono text-primary mb-4">DPPE → CODE</p>
            <button onClick={startGame} className="px-6 py-2 rounded border border-primary/50 bg-primary/10 text-primary text-sm font-mono hover:bg-primary/20 transition-colors">
              START
            </button>
          </div>
        )}
      </HudCard>
    );
  }

  return (
    <HudCard title="CIPHER DECODE" icon={<Zap size={14} />}>
      <div className="flex justify-between items-center mb-5">
        <span className="text-xs font-mono text-muted-foreground">{round + 1} / {shuffled.length}</span>
        <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${timeLeft <= 10 ? "text-destructive" : "text-foreground"}`}>
          <Timer size={12} />
          {timeLeft}s
        </div>
        <span className="text-xs font-mono text-primary">SCORE: {score}</span>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
        <motion.div
          className={`h-full rounded-full transition-colors ${timeLeft <= 10 ? "bg-destructive" : "bg-primary"}`}
          animate={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="text-center mb-6">
        <p className="text-[10px] font-mono text-muted-foreground mb-2">DECODE THIS</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={round}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-4xl font-display font-bold tracking-widest text-foreground"
          >
            {currentCipher?.encoded}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="TYPE THE DECODED WORD..."
          autoFocus
          className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary/50 uppercase tracking-widest"
        />
        <button
          onClick={submit}
          disabled={!input.trim()}
          className="px-4 py-2 rounded border border-primary/50 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 disabled:opacity-30 transition-colors"
        >
          GO
        </button>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-3 flex items-center justify-center gap-2 py-2 rounded ${feedback === "correct" ? "bg-neon-green/10 text-neon-green" : "bg-destructive/10 text-destructive"}`}
          >
            {feedback === "correct" ? <Check size={14} /> : <X size={14} />}
            <span className="text-xs font-mono">{feedback === "correct" ? "CORRECT" : `WRONG — ${currentCipher?.decoded}`}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </HudCard>
  );
}
