import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import HudCard from "@/components/HudCard";
import { Brain } from "lucide-react";

const MBTI_CLASS_MAP: Record<string, { class: string; desc: string }> = {
  INTJ: { class: "Technomancer", desc: "Strategic mastermind who bends systems to their will" },
  INTP: { class: "Alchemist", desc: "Curious thinker who transmutes knowledge into power" },
  ENTJ: { class: "Commander", desc: "Born leader who conquers through sheer force of will" },
  ENTP: { class: "Trickster", desc: "Inventive disruptor who thrives on creative chaos" },
  INFJ: { class: "Oracle", desc: "Visionary who perceives hidden truths and guides others" },
  INFP: { class: "Dreamweaver", desc: "Idealist who shapes reality through imagination" },
  ENFJ: { class: "Paladin", desc: "Charismatic champion who inspires and protects" },
  ENFP: { class: "Bard", desc: "Enthusiastic storyteller who energizes all around them" },
  ISTJ: { class: "Sentinel", desc: "Disciplined guardian of order and tradition" },
  ISFJ: { class: "Guardian", desc: "Devoted protector who shields with quiet strength" },
  ESTJ: { class: "Warlord", desc: "Decisive organizer who leads with authority" },
  ESFJ: { class: "Diplomat", desc: "Harmonizer who unites allies through empathy" },
  ISTP: { class: "Rogue", desc: "Cool-headed operative who masters tools and tactics" },
  ISFP: { class: "Ranger", desc: "Free spirit attuned to the world's subtle beauty" },
  ESTP: { class: "Berserker", desc: "Bold risk-taker who charges into action" },
  ESFP: { class: "Dancer", desc: "Vibrant performer who lives in the moment" },
};

const questions = [
  {
    dimension: "EI",
    question: "After a long mission, how do you recharge?",
    options: [
      { label: "Solo downtime — quiet reflection", value: "I" },
      { label: "Social gathering — connecting with allies", value: "E" },
    ],
  },
  {
    dimension: "SN",
    question: "When analyzing a quest, what do you focus on?",
    options: [
      { label: "Concrete facts and proven methods", value: "S" },
      { label: "Patterns, possibilities, and hidden connections", value: "N" },
    ],
  },
  {
    dimension: "TF",
    question: "When making a difficult decision, you rely on...",
    options: [
      { label: "Logic and objective analysis", value: "T" },
      { label: "Values and how it affects people", value: "F" },
    ],
  },
  {
    dimension: "JP",
    question: "Your ideal approach to quests is...",
    options: [
      { label: "Structured plan with clear milestones", value: "J" },
      { label: "Flexible and adaptive, go with the flow", value: "P" },
    ],
  },
];

interface MbtiQuizProps {
  onComplete: (mbtiType: string, characterClass: string) => void;
}

export default function MbtiQuiz({ onComplete }: MbtiQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const mbti = newAnswers.join("");
      const result = MBTI_CLASS_MAP[mbti] || MBTI_CLASS_MAP["INTJ"];
      onComplete(mbti, result.class);
    }
  };

  const q = questions[step];

  return (
    <HudCard title="PERSONALITY CALIBRATION" icon={<Brain size={14} />} glow>
      <p className="text-[10px] font-mono text-muted-foreground mb-4">
        STEP {step + 1}/{questions.length} // DETERMINING OPERATOR CLASS
      </p>
      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <p className="text-sm font-body mb-4">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 text-sm font-body border-border hover:border-primary/40 hover:bg-primary/5"
              onClick={() => handleAnswer(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </motion.div>
    </HudCard>
  );
}

export { MBTI_CLASS_MAP };
