import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, ChevronRight } from "lucide-react";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Scenario {
  situation: string;
  choices: { text: string; isCorrect: boolean; rationale: string }[];
}

const SCENARIOS: Scenario[] = [
  {
    situation: "You're 3 days into a perfect quest streak. It's 11pm and you're exhausted — one tiny task remains.",
    choices: [
      { text: "Do the task. Protect the streak no matter what.", isCorrect: true, rationale: "Small actions compound. The streak is worth 5 minutes." },
      { text: "Skip it. Sleep matters more than streaks.", isCorrect: false, rationale: "Rationalization. You had 5 minutes. You'll regret this tomorrow." },
    ],
  },
  {
    situation: "You have 4 quests active. A new opportunity arrives. Do you add it?",
    choices: [
      { text: "Yes — momentum is up, strike while hot.", isCorrect: false, rationale: "Spreading thin kills execution. Finish before adding." },
      { text: "No — complete one existing quest first.", isCorrect: true, rationale: "Focused completion beats excited addition. Systems > feelings." },
    ],
  },
  {
    situation: "You failed to complete yesterday's quest. What's the first move today?",
    choices: [
      { text: "Restart fresh. Yesterday doesn't count.", isCorrect: false, rationale: "Avoidance. Understand the failure before repeating the pattern." },
      { text: "Diagnose why it failed, then adapt the quest.", isCorrect: true, rationale: "Iteration is the core skill. Failure is data, not identity." },
    ],
  },
  {
    situation: "NAVI suggests a quest that feels uncomfortable but aligns with your goals.",
    choices: [
      { text: "Accept it. Discomfort is the signal.", isCorrect: true, rationale: "Growth lives outside comfort. NAVI sees the arc." },
      { text: "Decline. I'll find a more comfortable version.", isCorrect: false, rationale: "Comfort-optimization is how years disappear with nothing to show." },
    ],
  },
  {
    situation: "You're in a slump. 3 quests sit untouched for a week.",
    choices: [
      { text: "Delete all 3 and start smaller.", isCorrect: false, rationale: "Don't delete context. Rescope and push completion." },
      { text: "Pick the easiest one. Do just that. Today.", isCorrect: true, rationale: "Re-engagement comes from action, not planning. One win unlocks momentum." },
    ],
  },
  {
    situation: "Your streak is at 30 days. Someone invites you out during your daily habit window.",
    choices: [
      { text: "Go out. Streaks shouldn't control your life.", isCorrect: false, rationale: "You could do both. This is an excuse, not a boundary." },
      { text: "Do your habit first. 10 minutes. Then go.", isCorrect: true, rationale: "Non-negotiable windows protect identity. You come first." },
    ],
  },
  {
    situation: "You completed a big quest. NAVI awards XP. What do you do next?",
    choices: [
      { text: "Rest. You earned it.", isCorrect: false, rationale: "Celebration is fine — but rest ≠ stopping. Momentum is fragile." },
      { text: "Log it, reflect for 2 minutes, then pick the next target.", isCorrect: true, rationale: "Winners don't stop at wins. They note the feeling and move." },
    ],
  },
  {
    situation: "You're stuck on a quest and haven't made progress in 3 days.",
    choices: [
      { text: "Ask NAVI to break it down into smaller steps.", isCorrect: true, rationale: "Decomposition defeats paralysis. Ask for help — that's what NAVI is for." },
      { text: "Power through alone. Asking for help is weakness.", isCorrect: false, rationale: "Tools exist to be used. Stubbornness dressed as discipline is just ego." },
    ],
  },
];

export default function StreakDefense() {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [shuffled, setShuffled] = useState<Scenario[]>([]);
  const [done, setDone] = useState(false);

  const current = shuffled[round];

  function startGame() {
    const s = [...SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 6);
    setShuffled(s);
    setRound(0);
    setScore(0);
    setChosen(null);
    setDone(false);
    setStarted(true);
  }

  function choose(index: number) {
    if (chosen !== null) return;
    setChosen(index);
    const correct = current.choices[index].isCorrect;
    if (correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (round + 1 >= shuffled.length) {
        setDone(true);
        if (user) {
          supabase.from("mini_game_scores").insert({
            user_id: user.id,
            game_id: "defense",
            score: correct ? score + 1 : score,
            metadata: { total: shuffled.length, xp_earned: (correct ? score + 1 : score) * 7 },
          });
        }
      } else {
        setRound((r) => r + 1);
        setChosen(null);
      }
    }, 2200);
  }

  if (!started || done) {
    return (
      <HudCard title="STREAK DEFENSE" icon={<Shield size={14} />}>
        <div className="text-center py-6">
          {done && (
            <>
              <p className="text-4xl font-display font-bold text-accent mb-1">{score}</p>
              <p className="text-sm font-mono text-muted-foreground mb-1">/ {shuffled.length} CORRECT</p>
              <p className="text-xs font-mono text-neon-green mb-6">+{score * 7} XP EARNED</p>
            </>
          )}
          <p className="text-xs font-body text-muted-foreground mb-4 max-w-xs mx-auto">
            Each scenario tests your decision-making discipline. Choose the option that protects long-term growth.
          </p>
          <button onClick={startGame} className="px-6 py-2 rounded border border-accent/50 bg-accent/10 text-accent text-sm font-mono hover:bg-accent/20 transition-colors">
            {done ? "PLAY AGAIN" : "START"}
          </button>
        </div>
      </HudCard>
    );
  }

  return (
    <HudCard title="STREAK DEFENSE" icon={<Shield size={14} />}>
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-mono text-muted-foreground">SCENARIO {round + 1} / {shuffled.length}</span>
        <span className="text-xs font-mono text-accent">SCORE: {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <div className="p-4 rounded border border-border bg-muted/10 mb-4">
            <p className="text-sm font-body text-foreground leading-relaxed">{current.situation}</p>
          </div>

          <div className="space-y-3">
            {current.choices.map((choice, i) => {
              const isChosen = chosen === i;
              const revealed = chosen !== null;
              const isCorrect = choice.isCorrect;

              return (
                <motion.button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={chosen !== null}
                  className={`w-full text-left p-3 rounded border transition-all ${
                    revealed
                      ? isCorrect
                        ? "border-neon-green/60 bg-neon-green/10"
                        : isChosen
                        ? "border-destructive/60 bg-destructive/10"
                        : "border-border/30 opacity-50"
                      : "border-border hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                      revealed && isCorrect ? "border-neon-green bg-neon-green/20" :
                      revealed && isChosen ? "border-destructive bg-destructive/20" :
                      "border-border"
                    }`}>
                      {revealed && isCorrect && <Check size={8} className="text-neon-green" />}
                      {revealed && isChosen && !isCorrect && <X size={8} className="text-destructive" />}
                    </div>
                    <div>
                      <p className="text-xs font-body text-foreground">{choice.text}</p>
                      {revealed && (isCorrect || isChosen) && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-[10px] font-mono text-muted-foreground mt-1.5"
                        >
                          {choice.rationale}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </HudCard>
  );
}
