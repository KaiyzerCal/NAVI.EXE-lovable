import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft, Check, Lock } from "lucide-react";
import {
  classNameFromMbti,
  evolutionTitleFromMbtiAndLevel,
  MBTI_CLASS_MAP as EVO_MAP,
  TIER_COLORS,
  TIER_NAMES,
  tierThreshold,
} from "@/lib/xpSystem";

// ============================================================
// LEGACY EXPORTS — kept for compatibility with CharacterPage
// ============================================================
export const MBTI_CLASS_MAP: Record<string, { class: string; desc: string }> = Object.fromEntries(
  Object.entries(EVO_MAP).map(([k, v]) => [k, { class: v.className, desc: `${v.className} — ${v.desc}` }])
);

export const SUB_CLASSES: Record<string, { name: string; realWorld: string; bonus: string }[]> = {
  INTJ: [
    { name: "Software Engineer", realWorld: "Builds the systems that run the world", bonus: "+15% Coding XP" },
    { name: "Data Scientist", realWorld: "Finds signal in noise, patterns in chaos", bonus: "+15% Analysis XP" },
    { name: "Systems Architect", realWorld: "Designs blueprints others build from", bonus: "+10% Planning XP" },
  ],
  INTP: [
    { name: "Research Scientist", realWorld: "Transmutes questions into discovery", bonus: "+15% Research XP" },
    { name: "Engineer", realWorld: "Solves hard problems with elegant systems", bonus: "+10% Technical XP" },
    { name: "Philosopher", realWorld: "Distills the complex into pure insight", bonus: "+15% Wisdom XP" },
  ],
  ENTJ: [
    { name: "Entrepreneur", realWorld: "Builds businesses from vision and willpower", bonus: "+15% Leadership XP" },
    { name: "Product Manager", realWorld: "Turns strategy into shipped products", bonus: "+10% Strategy XP" },
    { name: "Military Officer", realWorld: "Leads under pressure with precision", bonus: "+15% Discipline XP" },
  ],
  ENTP: [
    { name: "Startup Founder", realWorld: "Disrupts industries others won't challenge", bonus: "+15% Innovation XP" },
    { name: "Lawyer", realWorld: "Finds the argument no one else sees", bonus: "+10% Persuasion XP" },
    { name: "Creative Director", realWorld: "Bends rules to make something unforgettable", bonus: "+15% Creative XP" },
  ],
  INFJ: [
    { name: "Therapist", realWorld: "Guides others through what they can't see", bonus: "+15% Empathy XP" },
    { name: "Writer", realWorld: "Translates the ineffable into words", bonus: "+15% Creative XP" },
    { name: "Researcher", realWorld: "Reveals hidden truths through systematic inquiry", bonus: "+10% Focus XP" },
  ],
  INFP: [
    { name: "Artist", realWorld: "Shapes the world through creative vision", bonus: "+15% Creative XP" },
    { name: "Counselor", realWorld: "Holds space for others to become themselves", bonus: "+15% Empathy XP" },
    { name: "Author", realWorld: "Builds worlds others live inside", bonus: "+10% Storytelling XP" },
  ],
  ENFJ: [
    { name: "Teacher", realWorld: "Shapes the next generation with intention", bonus: "+15% Influence XP" },
    { name: "Non-Profit Leader", realWorld: "Turns compassion into systemic impact", bonus: "+10% Community XP" },
    { name: "Coach", realWorld: "Unlocks potential others didn't know they had", bonus: "+15% Mentoring XP" },
  ],
  ENFP: [
    { name: "Content Creator", realWorld: "Turns enthusiasm into audience connection", bonus: "+15% Creative XP" },
    { name: "Marketing Strategist", realWorld: "Translates passion into reach", bonus: "+10% Outreach XP" },
    { name: "Event Producer", realWorld: "Creates experiences people remember", bonus: "+15% Social XP" },
  ],
  ISTJ: [
    { name: "Accountant", realWorld: "Brings precision and integrity to complex systems", bonus: "+15% Accuracy XP" },
    { name: "Project Manager", realWorld: "Keeps the train on the tracks", bonus: "+10% Discipline XP" },
    { name: "Compliance Officer", realWorld: "Ensures systems run clean", bonus: "+15% Order XP" },
  ],
  ISFJ: [
    { name: "Nurse", realWorld: "Cares with skill and unwavering dedication", bonus: "+15% Empathy XP" },
    { name: "Librarian", realWorld: "Curates knowledge for those who seek it", bonus: "+10% Knowledge XP" },
    { name: "Social Worker", realWorld: "Protects the vulnerable with steady resolve", bonus: "+15% Service XP" },
  ],
  ESTJ: [
    { name: "Operations Manager", realWorld: "Turns chaos into clockwork", bonus: "+15% Efficiency XP" },
    { name: "Military Leader", realWorld: "Commands with clarity and conviction", bonus: "+10% Authority XP" },
    { name: "Executive", realWorld: "Drives results through structure", bonus: "+15% Leadership XP" },
  ],
  ESFJ: [
    { name: "HR Director", realWorld: "Builds cultures where people thrive", bonus: "+15% Community XP" },
    { name: "Event Planner", realWorld: "Creates gatherings that bring people together", bonus: "+10% Social XP" },
    { name: "Customer Success", realWorld: "Ensures every person feels valued", bonus: "+15% Service XP" },
  ],
  ISTP: [
    { name: "Mechanic", realWorld: "Understands how things work at every level", bonus: "+15% Technical XP" },
    { name: "Forensic Analyst", realWorld: "Reads evidence others overlook", bonus: "+10% Analysis XP" },
    { name: "Pilot", realWorld: "Masters complex systems under pressure", bonus: "+15% Precision XP" },
  ],
  ISFP: [
    { name: "Graphic Designer", realWorld: "Turns feeling into visual language", bonus: "+15% Creative XP" },
    { name: "Musician", realWorld: "Communicates what words cannot", bonus: "+10% Expression XP" },
    { name: "Veterinarian", realWorld: "Heals with gentle intuition", bonus: "+15% Empathy XP" },
  ],
  ESTP: [
    { name: "Sales Director", realWorld: "Closes deals others can't even start", bonus: "+15% Persuasion XP" },
    { name: "Firefighter", realWorld: "Acts decisively when others freeze", bonus: "+10% Courage XP" },
    { name: "Athlete", realWorld: "Pushes limits through relentless action", bonus: "+15% Endurance XP" },
  ],
  ESFP: [
    { name: "Performer", realWorld: "Commands attention and lifts spirits", bonus: "+15% Charisma XP" },
    { name: "Tour Guide", realWorld: "Makes every experience unforgettable", bonus: "+10% Social XP" },
    { name: "Chef", realWorld: "Turns raw ingredients into moments of joy", bonus: "+15% Creative XP" },
  ],
};

export const NAVI_COMBAT_CLASSES = [
  { name: "Sorcerer", desc: "Wields digital arcana and system-level spells", bonus: "+10% Magic XP" },
  { name: "Warrior", desc: "Frontline combatant with raw offensive power", bonus: "+10% Strength XP" },
  { name: "Alchemist", desc: "Transmutes data into potions and buffs", bonus: "+10% Crafting XP" },
  { name: "Healer", desc: "Restores HP and clears status debuffs", bonus: "+10% Recovery XP" },
  { name: "Ranger", desc: "Precision strikes and environmental awareness", bonus: "+10% Accuracy XP" },
  { name: "Assassin", desc: "Stealth operations and critical-hit specialist", bonus: "+10% Stealth XP" },
  { name: "Paladin", desc: "Balanced defense and holy-type offense", bonus: "+10% Defense XP" },
  { name: "Necromancer", desc: "Summons echoes of past data and memories", bonus: "+10% Summoning XP" },
  { name: "Bard", desc: "Buffs through rhythm, morale, and resonance", bonus: "+10% Support XP" },
  { name: "Berserker", desc: "Overwhelming power at the cost of control", bonus: "+10% Fury XP" },
];

// ============================================================
// QUESTIONS
// ============================================================
type Axis = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
interface Question {
  q: string;
  a: { text: string; axis: Axis }[];
}

const QUESTIONS: Question[] = [
  // E vs I
  { q: "At a party you tend to:", a: [{ text: "Work the room and meet new people", axis: "E" }, { text: "Stay close to people you already know", axis: "I" }] },
  { q: "After a long social event you feel:", a: [{ text: "Energized and wanting more", axis: "E" }, { text: "Drained and needing quiet time", axis: "I" }] },
  { q: "You prefer to:", a: [{ text: "Think out loud with others", axis: "E" }, { text: "Process internally before sharing", axis: "I" }] },
  { q: "Your ideal weekend involves:", a: [{ text: "Plans with groups and events", axis: "E" }, { text: "Time alone or with one close person", axis: "I" }] },
  // S vs N
  { q: "You trust more:", a: [{ text: "Concrete facts and details", axis: "S" }, { text: "Patterns and possibilities", axis: "N" }] },
  { q: "When solving problems you focus on:", a: [{ text: "What has worked before", axis: "S" }, { text: "New and untested approaches", axis: "N" }] },
  { q: "You are more drawn to:", a: [{ text: "Practical and realistic ideas", axis: "S" }, { text: "Theoretical and abstract concepts", axis: "N" }] },
  { q: "You describe things by:", a: [{ text: "Specific literal details", axis: "S" }, { text: "Metaphors and big picture", axis: "N" }] },
  // T vs F
  { q: "When making decisions you prioritize:", a: [{ text: "Logic and objective analysis", axis: "T" }, { text: "How it affects the people involved", axis: "F" }] },
  { q: "You find it easier to:", a: [{ text: "Point out flaws directly", axis: "T" }, { text: "Find something positive first", axis: "F" }] },
  { q: "In a conflict you focus on:", a: [{ text: "Who is right", axis: "T" }, { text: "How everyone feels", axis: "F" }] },
  { q: "You respect people more for:", a: [{ text: "Being competent and effective", axis: "T" }, { text: "Being kind and considerate", axis: "F" }] },
  // J vs P
  { q: "You prefer your life to be:", a: [{ text: "Structured with clear plans", axis: "J" }, { text: "Flexible and open to change", axis: "P" }] },
  { q: "You feel better when:", a: [{ text: "Decisions are made and settled", axis: "J" }, { text: "Options are still open", axis: "P" }] },
  { q: "Your workspace is usually:", a: [{ text: "Organized and systematic", axis: "J" }, { text: "Creative and adaptable", axis: "P" }] },
  { q: "Deadlines feel:", a: [{ text: "Necessary and motivating", axis: "J" }, { text: "Like suggestions", axis: "P" }] },
];

// ============================================================
// COMPONENT
// ============================================================
interface Props {
  // Backwards-compatible: parent may pass either signature.
  onComplete: ((mbti: string, charClass: string) => void) | ((mbti: string) => void);
}

export default function MbtiQuiz({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Axis[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (axis: Axis) => {
    const newAnswers = [...answers.slice(0, step), axis];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const count = (letter: Axis) => newAnswers.filter((a) => a === letter).length;
      const mbti = [
        count("E") >= count("I") ? "E" : "I",
        count("S") >= count("N") ? "S" : "N",
        count("T") >= count("F") ? "T" : "F",
        count("J") >= count("P") ? "J" : "P",
      ].join("");
      setResult(mbti);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, step - 1));
    }
  };

  const handleInitialize = () => {
    if (!result) return;
    const charClass = classNameFromMbti(result);
    // Support both single- and dual-arg consumer signatures.
    (onComplete as (m: string, c: string) => void)(result, charClass);
  };

  const current = QUESTIONS[step];
  const progressPct = ((step + (result ? 1 : 0)) / QUESTIONS.length) * 100;

  // ============================================================
  // RESULT SCREEN
  // ============================================================
  if (result) {
    const entry = EVO_MAP[result];
    const tierColor = TIER_COLORS[1];
    return (
      <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background overflow-y-auto">
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: "linear-gradient(transparent 50%, rgba(0,0,0,0.04) 50%)",
            backgroundSize: "100% 4px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${tierColor}15 0%, transparent 60%)`,
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-2xl px-6 py-12 text-center"
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground mb-4">
            CALIBRATION COMPLETE
          </p>
          <motion.h1
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.2 }}
            className="font-display text-7xl md:text-8xl font-black mb-4"
            style={{
              color: tierColor,
              textShadow: `0 0 32px ${tierColor}, 0 0 64px ${tierColor}80`,
            }}
          >
            {result}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-display text-2xl md:text-3xl text-foreground mb-1"
          >
            {entry?.className}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm font-body text-muted-foreground mb-8 italic"
          >
            {entry?.desc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="rounded-lg border border-primary/30 bg-card/60 p-5 mb-8 text-left"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4 text-center">
              EVOLUTION PATH
            </p>
            <div className="space-y-2.5">
              {entry?.tiers.map((title, i) => {
                const tier = (i + 1) as 1 | 2 | 3 | 4 | 5;
                const color = TIER_COLORS[tier];
                const isCurrent = tier === 1;
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-3 px-3 py-2 rounded border transition-all"
                    style={{
                      borderColor: isCurrent ? color : "hsl(var(--border))",
                      backgroundColor: isCurrent ? `${color}10` : "transparent",
                    }}
                  >
                    <span
                      className="font-display text-xs font-bold w-8 shrink-0"
                      style={{ color }}
                    >
                      T{tier}
                    </span>
                    <span
                      className="text-[9px] font-mono tracking-widest w-24 shrink-0"
                      style={{ color, opacity: isCurrent ? 1 : 0.7 }}
                    >
                      {TIER_NAMES[tier]}
                    </span>
                    <span
                      className="text-sm font-body flex-1"
                      style={{ color: isCurrent ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    >
                      {title}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      LV{tierThreshold(tier)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={handleInitialize}
            className="px-10 py-3.5 rounded border-2 font-display font-bold tracking-widest text-sm bg-card/60 hover:bg-card transition-all"
            style={{
              borderColor: tierColor,
              color: tierColor,
              textShadow: `0 0 8px ${tierColor}99`,
              boxShadow: `0 0 24px ${tierColor}55`,
            }}
          >
            INITIALIZE OPERATOR →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ============================================================
  // QUIZ SCREEN
  // ============================================================
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background overflow-y-auto">
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: "linear-gradient(transparent 50%, rgba(0,0,0,0.04) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      <div className="relative w-full max-w-xl px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Brain size={16} className="text-primary" />
          <h2 className="font-display text-sm tracking-widest text-primary">
            OPERATOR CALIBRATION
          </h2>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              QUESTION {step + 1} / {QUESTIONS.length}
            </span>
            <span className="text-[10px] font-mono text-primary">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
              style={{ boxShadow: "0 0 12px hsl(var(--primary))" }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <p className="text-base md:text-lg font-body text-foreground mb-6 leading-relaxed">
              {current.q}
            </p>

            <div className="space-y-3">
              {current.a.map((answer, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(answer.axis)}
                  className="w-full text-left px-4 py-4 rounded border-2 border-border bg-card/60 hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-3 group"
                >
                  <span className="font-display text-sm text-primary/60 group-hover:text-primary transition-colors w-6 shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-body text-foreground">
                    {answer.text}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Back */}
        {step > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-[10px] font-mono tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={12} className="mr-1" /> BACK
          </Button>
        )}
      </div>
    </div>
  );
}
