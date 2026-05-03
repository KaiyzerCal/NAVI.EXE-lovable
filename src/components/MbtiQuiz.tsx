import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import HudCard from "@/components/HudCard";
import { Brain, ChevronLeft } from "lucide-react";
import { MBTI_CLASS_MAP, TIER_NAMES, TIER_COLORS, TIER_THRESHOLDS, type EvolutionTier } from "@/lib/classEvolution";

export { MBTI_CLASS_MAP } from "@/lib/classEvolution";

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

interface Props {
  onComplete: (mbti: string, charClass: string) => void;
}

const QUESTIONS = [
  // E/I x 4
  { q: "At a social event, you tend to:", a: [{ text: "Engage with many different people energetically", axis: "E" }, { text: "Have deeper conversations with a select few", axis: "I" }] },
  { q: "After a long day, you recharge by:", a: [{ text: "Going out with friends or to an event", axis: "E" }, { text: "Spending quiet time alone with your thoughts", axis: "I" }] },
  { q: "In conversations, you prefer to:", a: [{ text: "Think out loud and brainstorm with others", axis: "E" }, { text: "Reflect internally before sharing your thoughts", axis: "I" }] },
  { q: "When working on a project, you prefer:", a: [{ text: "Collaborating with a team in real time", axis: "E" }, { text: "Working independently and sharing results later", axis: "I" }] },
  // S/N x 4
  { q: "You trust more in:", a: [{ text: "Concrete facts and proven experience", axis: "S" }, { text: "Patterns, possibilities, and intuition", axis: "N" }] },
  { q: "You are more drawn to:", a: [{ text: "What is real and present right now", axis: "S" }, { text: "What could be in the future", axis: "N" }] },
  { q: "When learning something new, you prefer:", a: [{ text: "Step-by-step practical instructions", axis: "S" }, { text: "Understanding the big picture and theory first", axis: "N" }] },
  { q: "You find more value in:", a: [{ text: "Practical, hands-on experience", axis: "S" }, { text: "Theoretical frameworks and abstract ideas", axis: "N" }] },
  // T/F x 4
  { q: "When faced with a complex problem, you prefer to:", a: [{ text: "Analyze it systematically, breaking it into parts", axis: "T" }, { text: "Consider how it affects the people involved first", axis: "F" }] },
  { q: "When making decisions, you value:", a: [{ text: "Logic and consistency above all", axis: "T" }, { text: "Harmony and personal values", axis: "F" }] },
  { q: "In a team conflict, you prioritize:", a: [{ text: "Finding the objectively correct solution", axis: "T" }, { text: "Making sure everyone feels heard", axis: "F" }] },
  { q: "Criticism is best when it is:", a: [{ text: "Direct and honest, even if uncomfortable", axis: "T" }, { text: "Delivered with empathy and tact", axis: "F" }] },
  // J/P x 4
  { q: "When planning a project, you prefer:", a: [{ text: "A detailed plan with clear milestones", axis: "J" }, { text: "A flexible approach that adapts as you go", axis: "P" }] },
  { q: "Your workspace is typically:", a: [{ text: "Organized and structured", axis: "J" }, { text: "Flexible with creative chaos", axis: "P" }] },
  { q: "You prefer your schedule to be:", a: [{ text: "Planned and predictable", axis: "J" }, { text: "Open-ended with room for spontaneity", axis: "P" }] },
  { q: "Deadlines make you:", a: [{ text: "More focused and productive", axis: "J" }, { text: "Feel constrained — you work best without them", axis: "P" }] },
];

export default function MbtiQuiz({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (axis: string) => {
    const newAnswers = [...answers, axis];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const count = (letter: string) => newAnswers.filter((a) => a === letter).length;
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
    if (step === 0) return;
    setAnswers(answers.slice(0, -1));
    setStep(step - 1);
  };

  if (result) {
    const classInfo = MBTI_CLASS_MAP[result];
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <HudCard title="CALIBRATION COMPLETE" icon={<Brain size={14} />} glow>
          <div className="text-center mb-6">
            <p className="text-xs font-mono text-muted-foreground mb-1">OPERATOR TYPE IDENTIFIED</p>
            <h2 className="font-display text-5xl font-black text-primary tracking-widest mb-1">{result}</h2>
            <p className="text-base font-bold text-foreground">{classInfo?.className ?? result}</p>
            <p className="text-xs font-body text-muted-foreground mt-1">{classInfo?.desc ?? ""}</p>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">
              Evolution Path — 20 Tiers
            </p>
            <div className="space-y-2">
              {classInfo?.tiers.map((title, i) => {
                const tier = (i + 1) as EvolutionTier;
                const color = TIER_COLORS[tier];
                const { min, max } = TIER_THRESHOLDS[tier];
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-3 px-3 py-2 rounded border"
                    style={{ borderColor: `${color}30`, background: `${color}08` }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
                      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
                    >
                      {tier}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color }}>{title}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">{TIER_NAMES[tier]} · Lv {min}–{max}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            className="w-full font-mono tracking-widest"
            onClick={() => onComplete(result, classInfo?.className || result)}
          >
            INITIALIZE OPERATOR →
          </Button>
        </HudCard>
      </motion.div>
    );
  }

  const current = QUESTIONS[step];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <HudCard title="OPERATOR CALIBRATION" icon={<Brain size={14} />} glow>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-mono text-muted-foreground">
              QUESTION {step + 1}/{QUESTIONS.length}
            </span>
            <span className="text-[10px] font-mono text-primary">
              {Math.round(((step + 1) / QUESTIONS.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-muted rounded overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <p className="text-sm font-body mb-4">{current.q}</p>

        <div className="space-y-2 mb-4">
          {current.a.map((answer, i) => (
            <Button
              key={i}
              variant="outline"
              className="w-full justify-start text-left text-sm font-body h-auto py-3 hover:border-primary/50 hover:bg-primary/5"
              onClick={() => handleAnswer(answer.axis)}
            >
              {answer.text}
            </Button>
          ))}
        </div>

        {step > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft size={12} /> BACK
          </button>
        )}
      </HudCard>
    </motion.div>
  );
}
