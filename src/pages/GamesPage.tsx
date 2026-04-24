import { useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Gamepad2, Loader2, ChevronLeft, Zap, Grid3X3, Timer, Shield } from "lucide-react";

const CipherDecode  = lazy(() => import("@/components/games/CipherDecode"));
const MemoryMatrix  = lazy(() => import("@/components/games/MemoryMatrix"));
const ReflexStrike  = lazy(() => import("@/components/games/ReflexStrike"));
const StreakDefense = lazy(() => import("@/components/games/StreakDefense"));

interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  xpReward: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const GAMES: GameInfo[] = [
  {
    id: "cipher",
    name: "CIPHER DECODE",
    description: "Crack encrypted sequences before time expires. Pattern recognition + vocabulary under pressure.",
    icon: <Zap size={18} className="text-primary" />,
    xpReward: "10–30 XP",
    difficulty: "MEDIUM",
  },
  {
    id: "memory",
    name: "MEMORY MATRIX",
    description: "Memorize a grid pattern and recreate it. Each level adds complexity.",
    icon: <Grid3X3 size={18} className="text-secondary" />,
    xpReward: "10–25 XP",
    difficulty: "MEDIUM",
  },
  {
    id: "reflex",
    name: "REFLEX STRIKE",
    description: "Hit targets the moment they appear. Pure reaction speed. No second chances.",
    icon: <Timer size={18} className="text-neon-green" />,
    xpReward: "5–20 XP",
    difficulty: "HARD",
  },
  {
    id: "defense",
    name: "STREAK DEFENSE",
    description: "Protect your streak. Make correct decisions in a sequence of branching scenarios.",
    icon: <Shield size={18} className="text-accent" />,
    xpReward: "15–40 XP",
    difficulty: "EASY",
  },
];

const DIFFICULTY_COLORS = {
  EASY:   "text-neon-green",
  MEDIUM: "text-primary",
  HARD:   "text-destructive",
};

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const activeInfo = GAMES.find((g) => g.id === activeGame);

  return (
    <div>
      <PageHeader title="MINI GAMES" subtitle="// EARN XP · TRAIN YOUR MIND" />

      {activeGame && activeInfo ? (
        <div>
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ChevronLeft size={12} />
            BACK TO GAMES
          </button>

          <Suspense fallback={
            <div className="flex justify-center py-24">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          }>
            {activeGame === "cipher"  && <CipherDecode />}
            {activeGame === "memory"  && <MemoryMatrix />}
            {activeGame === "reflex"  && <ReflexStrike />}
            {activeGame === "defense" && <StreakDefense />}
          </Suspense>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {GAMES.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setActiveGame(game.id)}
              className="text-left p-5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg border border-border flex items-center justify-center bg-muted/20 group-hover:bg-muted/40 transition-colors">
                  {game.icon}
                </div>
                <span className={`text-[9px] font-mono ${DIFFICULTY_COLORS[game.difficulty]}`}>
                  {game.difficulty}
                </span>
              </div>
              <p className="text-sm font-display font-bold text-foreground tracking-wider mb-1">
                {game.name}
              </p>
              <p className="text-xs font-body text-muted-foreground leading-snug mb-3">
                {game.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground">REWARD</span>
                <span className="text-[10px] font-mono text-primary">{game.xpReward}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
