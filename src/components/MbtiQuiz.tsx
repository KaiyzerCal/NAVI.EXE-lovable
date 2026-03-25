import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import HudCard from "@/components/HudCard";
import { Brain } from "lucide-react";

export const MBTI_CLASS_MAP: Record<string, { class: string; desc: string }> = {
  INTJ: { class: "Technomancer",  desc: "Strategic mastermind who bends systems to their will" },
  INTP: { class: "Alchemist",     desc: "Curious thinker who transmutes knowledge into power" },
  ENTJ: { class: "Commander",     desc: "Born leader who conquers through sheer force of will" },
  ENTP: { class: "Trickster",     desc: "Inventive disruptor who thrives on creative chaos" },
  INFJ: { class: "Oracle",        desc: "Visionary who perceives hidden truths and guides others" },
  INFP: { class: "Dreamweaver",   desc: "Idealist who shapes reality through imagination" },
  ENFJ: { class: "Paladin",       desc: "Charismatic champion who inspires and protects" },
  ENFP: { class: "Bard",          desc: "Enthusiastic storyteller who energizes all around them" },
  ISTJ: { class: "Sentinel",      desc: "Disciplined guardian of order and tradition" },
  ISFJ: { class: "Guardian",      desc: "Devoted protector who shields with quiet strength" },
  ESTJ: { class: "Warlord",       desc: "Decisive organizer who leads with authority" },
  ESFJ: { class: "Diplomat",      desc: "Harmonizer who unites allies through empathy" },
  ISTP: { class: "Rogue",         desc: "Cool-headed operative who masters tools and tactics" },
  ISFP: { class: "Ranger",        desc: "Free spirit attuned to the world's subtle beauty" },
  ESTP: { class: "Berserker",     desc: "Bold risk-taker who charges into action" },
  ESFP: { class: "Dancer",        desc: "Vibrant performer who lives in the moment" },
};

// Sub-classes map real-world careers/paths onto each character class.
// Each sub-class reflects something the operator actually does or aspires to.
export const SUB_CLASSES: Record<string, { name: string; realWorld: string; bonus: string }[]> = {
  Technomancer: [
    { name: "Software Engineer",   realWorld: "Builds the systems that run the world",             bonus: "+15% Coding XP" },
    { name: "Data Scientist",      realWorld: "Finds signal in noise, patterns in chaos",          bonus: "+15% Analysis XP" },
    { name: "Systems Architect",   realWorld: "Designs blueprints others build from",             bonus: "+10% Planning XP" },
  ],
  Alchemist: [
    { name: "Research Scientist",  realWorld: "Transmutes questions into discovery",               bonus: "+15% Research XP" },
    { name: "Engineer",            realWorld: "Solves hard problems with elegant systems",         bonus: "+10% Technical XP" },
    { name: "Philosopher",         realWorld: "Distills the complex into pure insight",            bonus: "+15% Wisdom XP" },
  ],
  Commander: [
    { name: "Entrepreneur",        realWorld: "Builds businesses from vision and willpower",      bonus: "+15% Leadership XP" },
    { name: "Product Manager",     realWorld: "Turns strategy into shipped products",             bonus: "+10% Strategy XP" },
    { name: "Military Officer",    realWorld: "Leads under pressure with precision",              bonus: "+15% Discipline XP" },
  ],
  Trickster: [
    { name: "Startup Founder",     realWorld: "Disrupts industries others won't challenge",       bonus: "+15% Innovation XP" },
    { name: "Lawyer",              realWorld: "Finds the argument no one else sees",              bonus: "+10% Persuasion XP" },
    { name: "Creative Director",   realWorld: "Bends rules to make something unforgettable",      bonus: "+15% Creative XP" },
  ],
  Oracle: [
    { name: "Therapist",           realWorld: "Guides others through what they can't see",        bonus: "+15% Empathy XP" },
    { name: "Writer",              realWorld: "Translates the ineffable into words",              bonus: "+15% Creative XP" },
    { name: "Researcher",          realWorld: "Reveals hidden truths through systematic inquiry", bonus: "+10% Focus XP" },
  ],
  Dreamweaver: [
    { name: "Artist",              realWorld: "Shapes the world through creative vision",         bonus: "+15% Creative XP" },
    { name: "Counselor",           realWorld: "Holds space for others to become themselves",      bonus: "+15% Empathy XP" },
    { name: "Author",              realWorld: "Builds worlds others live inside",                 bonus: "+10% Storytelling XP" },
  ],
  Paladin: [
    { name: "Teacher",             realWorld: "Shapes the next generation with intention",        bonus: "+15% Influence XP" },
    { name: "Non-profit Director", realWorld: "Fights for causes larger than the self",           bonus: "+15% Leadership XP" },
    { name: "Coach",               realWorld: "Unlocks potential in others daily",                bonus: "+10% Encouragement XP" },
  ],
  Bard: [
    { name: "Content Creator",     realWorld: "Builds audiences through authentic storytelling",  bonus: "+15% Creative XP" },
    { name: "Marketing Director",  realWorld: "Moves people with narrative and vision",           bonus: "+10% Influence XP" },
    { name: "Musician",            realWorld: "Channels emotion into universal language",         bonus: "+15% Expression XP" },
  ],
  Sentinel: [
    { name: "Accountant",          realWorld: "Keeps the truth in numbers, order in chaos",       bonus: "+15% Discipline XP" },
    { name: "Operations Manager",  realWorld: "Ensures the system runs without failure",          bonus: "+10% Efficiency XP" },
    { name: "Law Enforcement",     realWorld: "Upholds structure so others can thrive",           bonus: "+15% Consistency XP" },
  ],
  Guardian: [
    { name: "Nurse / Doctor",      realWorld: "Protects life with quiet, steadfast dedication",   bonus: "+15% Care XP" },
    { name: "Social Worker",       realWorld: "Shields the vulnerable with relentless support",   bonus: "+15% Empathy XP" },
    { name: "Project Coordinator", realWorld: "Keeps teams stable when everything is uncertain",  bonus: "+10% Organization XP" },
  ],
  Warlord: [
    { name: "Executive",           realWorld: "Makes decisive calls that move entire organizations", bonus: "+15% Authority XP" },
    { name: "General Contractor",  realWorld: "Commands complex builds from blueprint to done",   bonus: "+10% Execution XP" },
    { name: "Sports Coach",        realWorld: "Turns a group of individuals into a winning team", bonus: "+15% Strategy XP" },
  ],
  Diplomat: [
    { name: "HR Director",         realWorld: "Holds the culture and people together",            bonus: "+15% Harmony XP" },
    { name: "Event Planner",       realWorld: "Creates experiences that unite people",            bonus: "+10% Coordination XP" },
    { name: "Public Relations",    realWorld: "Shapes how the world sees the story",              bonus: "+15% Communication XP" },
  ],
  Rogue: [
    { name: "Mechanic / Technician", realWorld: "Masters tools others can't even touch",         bonus: "+15% Hands-on XP" },
    { name: "Special Ops",         realWorld: "Precise execution under extreme pressure",         bonus: "+15% Discipline XP" },
    { name: "Security Researcher", realWorld: "Finds the exploit no one else notices",            bonus: "+10% Problem-solving XP" },
  ],
  Ranger: [
    { name: "Photographer",        realWorld: "Captures beauty others walk past",                bonus: "+15% Observation XP" },
    { name: "Naturalist",          realWorld: "Lives in harmony with the world's hidden rhythms", bonus: "+10% Awareness XP" },
    { name: "Physical Therapist",  realWorld: "Restores bodies through patient, precise care",    bonus: "+15% Care XP" },
  ],
  Berserker: [
    { name: "Athlete",             realWorld: "Pushes the body and mind past every limit",        bonus: "+15% Fitness XP" },
    { name: "Sales Director",      realWorld: "Charges into every room and wins",                bonus: "+10% Drive XP" },
    { name: "First Responder",     realWorld: "Runs toward the crisis everyone else flees",       bonus: "+15% Courage XP" },
  ],
  Dancer: [
    { name: "Performer",           realWorld: "Lives fully in every moment on stage",             bonus: "+15% Expression XP" },
    { name: "Hospitality Manager", realWorld: "Makes every guest feel like the only one",         bonus: "+10% Presence XP" },
    { name: "Brand Ambassador",    realWorld: "Embodies the energy that attracts others",         bonus: "+15% Charisma XP" },
  ],
};

// 8 questions — 2 per MBTI dimension — for more accurate typing
const questions = [
  // E/I
  {
    dimension: "EI",
    question: "After a long, demanding mission — how do you recover?",
    options: [
      { label: "Alone. I need quiet time to process and recharge.", value: "I" },
      { label: "With others. People and conversation restore me.", value: "E" },
    ],
  },
  {
    dimension: "EI",
    question: "In a group strategy session, you tend to...",
    options: [
      { label: "Think it through internally before speaking.", value: "I" },
      { label: "Think out loud — talking helps me figure it out.", value: "E" },
    ],
  },
  // S/N
  {
    dimension: "SN",
    question: "When analyzing a new quest, you focus on...",
    options: [
      { label: "Concrete facts, proven methods, and what's worked before.", value: "S" },
      { label: "Patterns, possibilities, and what could be discovered.", value: "N" },
    ],
  },
  {
    dimension: "SN",
    question: "You trust information more when it is...",
    options: [
      { label: "Grounded in real, observable evidence.", value: "S" },
      { label: "Part of a bigger pattern or theory.", value: "N" },
    ],
  },
  // T/F
  {
    dimension: "TF",
    question: "When making a hard call, you default to...",
    options: [
      { label: "Logic and objective analysis, even if it's uncomfortable.", value: "T" },
      { label: "Values and impact on people, even if the math is messier.", value: "F" },
    ],
  },
  {
    dimension: "TF",
    question: "A teammate underperforms. Your first response is...",
    options: [
      { label: "Identify the root cause and fix the system.", value: "T" },
      { label: "Check in — find out what they're going through.", value: "F" },
    ],
  },
  // J/P
  {
    dimension: "JP",
    question: "Your ideal approach to a long-term quest is...",
    options: [
      { label: "Structured plan with clear milestones and deadlines.", value: "J" },
      { label: "Flexible — adapt as I learn more, stay open to pivots.", value: "P" },
    ],
  },
  {
    dimension: "JP",
    question: "How do you feel when plans change at the last minute?",
    options: [
      { label: "Disrupted — I prefer knowing what to expect.", value: "J" },
      { label: "Fine, even energized — new variables are interesting.", value: "P" },
    ],
  },
];

// Tally answers: pick the dominant letter per dimension
function tallyMBTI(answers: string[]): string {
  const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  for (const a of answers) counts[a] = (counts[a] || 0) + 1;
  const ei = (counts["E"] || 0) >= (counts["I"] || 0) ? "E" : "I";
  const sn = (counts["S"] || 0) >= (counts["N"] || 0) ? "S" : "N";
  const tf = (counts["T"] || 0) >= (counts["F"] || 0) ? "T" : "F";
  const jp = (counts["J"] || 0) >= (counts["P"] || 0) ? "J" : "P";
  return `${ei}${sn}${tf}${jp}`;
}

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
      const mbti = tallyMBTI(newAnswers);
      const result = MBTI_CLASS_MAP[mbti] || MBTI_CLASS_MAP["INTJ"];
      onComplete(mbti, result.class);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers((prev) => prev.slice(0, -1));
    }
  };

  const q = questions[step];
  const progress = Math.round((step / questions.length) * 100);

  return (
    <HudCard title="PERSONALITY CALIBRATION" icon={<Brain size={14} />} glow>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[10px] font-mono text-muted-foreground">
            QUESTION {step + 1} OF {questions.length} // DIMENSION: {q.dimension}
          </p>
          <p className="text-[10px] font-mono text-primary">{progress}%</p>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
        <p className="text-sm font-body mb-5 leading-relaxed">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt) => (
            <Button
              key={opt.value}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4 text-sm font-body border-border hover:border-primary/40 hover:bg-primary/5"
              onClick={() => handleAnswer(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {step > 0 && (
        <button
          onClick={goBack}
          className="mt-4 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          ← BACK
        </button>
      )}
    </HudCard>
  );
}




