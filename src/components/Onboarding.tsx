import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Check, Zap, Shield, Brain, Swords,
  BookOpen, MessageSquare, BarChart3, User, ArrowRight, Sparkles
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface OnboardingProps {
  onComplete: () => void;
}

type PersonalityId = "GUARDIAN" | "HYPE" | "COMPANION" | "ROGUE";

interface FormState {
  display_name: string;
  navi_name: string;
  user_navi_description: string;
  navi_personality: PersonalityId;
}

const PERSONALITIES: {
  id: PersonalityId;
  label: string;
  desc: string;
  flavor: string;
}[] = [
  {
    id: "GUARDIAN",
    label: "Guardian",
    desc: "Loyal, steady, always in your corner",
    flavor: "\"Operator, your 7-day streak is at risk. Shall I queue a quick win?\"",
  },
  {
    id: "HYPE",
    label: "Hype",
    desc: "High-voltage energy, battle-ready",
    flavor: "\"LET'S GO. You just hit Level 5. The next quest won't know what hit it.\"",
  },
  {
    id: "COMPANION",
    label: "Companion",
    desc: "Warm, empathetic, heart-first",
    flavor: "\"You've been working hard. How are you actually feeling right now?\"",
  },
  {
    id: "ROGUE",
    label: "Rogue",
    desc: "Sharp wit, tells it like it is",
    flavor: "\"Eleven open quests and zero completions today. Shall I be gentle or honest?\"",
  },
];

const TOUR_PAGES: {
  icon: React.ReactNode;
  route: string;
  label: string;
  title: string;
  what: string;
  how: string;
  tip: string;
}[] = [
  {
    icon: <Swords size={28} className="text-primary" />,
    route: "/quests",
    label: "Quests",
    title: "Your Mission Control",
    what: "Real-world goals, gamified. Main story arcs, Side missions, Daily habits, Epic long-hauls.",
    how: "Tap NEW QUEST → name it → pick a type → set milestones. NAVI tracks progress automatically.",
    tip: "Start with one Daily quest. Momentum compounds.",
  },
  {
    icon: <MessageSquare size={28} className="text-primary" />,
    route: "/mavis",
    label: "Navi.EXE",
    title: "Your AI Operator",
    what: "A live AI that knows your quests, skills, journal and memory. Not a chatbot — a co-pilot.",
    how: "Just talk. Say \"create a quest for learning Rust\" or \"how am I doing this week?\" NAVI acts.",
    tip: "Use OmniSync before clearing threads. It saves everything to long-term memory.",
  },
  {
    icon: <User size={28} className="text-primary" />,
    route: "/character",
    label: "Character",
    title: "Your Operator Profile",
    what: "Take the MBTI quiz to unlock your Class and Sub-class. Stats are computed from real activity.",
    how: "Character → take quiz → choose a Sub-class that fits your real-world path.",
    tip: "STR comes from quests. INT from journal entries. VIT from your streak. Play to your class.",
  },
  {
    icon: <BookOpen size={28} className="text-primary" />,
    route: "/journal",
    label: "Journal",
    title: "Your Memory Vault",
    what: "Log wins, reflections, and insights. Each entry earns XP and feeds NAVI's memory engine.",
    how: "Write anything. Tag it. NAVI will surface it in future conversations when relevant.",
    tip: "Entries over 200 words give bonus XP. Quality thinking is rewarded.",
  },
  {
    icon: <Sparkles size={28} className="text-primary" />,
    route: "/navi",
    label: "Navi",
    title: "Your Companion",
    what: "Unlock skins, manage Bond (Affection / Trust / Loyalty), and level your Navi to 100.",
    how: "Bond rises naturally through chat and quest completion. Equip skins to change your Navi's form.",
    tip: "Higher NAVI level unlocks powerful skills — Overclock at 12, Neural Link at 15.",
  },
  {
    icon: <BarChart3 size={28} className="text-primary" />,
    route: "/stats",
    label: "Stats",
    title: "Your Performance Layer",
    what: "Weekly XP chart, streak history, achievement wall, and operator-level progression.",
    how: "This page updates automatically as you complete quests and journal entries.",
    tip: "Achievements unlock hidden skins. Check the achievement wall to know what to chase.",
  },
];

const TOTAL_STEPS = 6;

function StepDots({ current }: { current: number }) {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i === current ? "w-6 bg-primary" : i < current ? "w-3 bg-primary/50" : "w-3 bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function IconRing({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-20 h-20 mx-auto mb-4">
      <div className="absolute inset-0 rounded-full border border-primary/20" />
      <div className="absolute inset-1 rounded-full border border-primary/30" />
      <div className="absolute inset-0 rounded-full bg-card flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function StepBoot({ onNext }: { onNext: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const lines = [
    "NEURAL LINK — ESTABLISHING...",
    "MEMORY ENGINE — ONLINE",
    "QUEST SYSTEM — READY",
    "OPERATOR PROFILE — AWAITING INPUT",
  ];

  return (
    <div className="text-center">
      <IconRing>
        <Zap size={32} className="text-primary" />
      </IconRing>

      <h2 className="font-display text-xl text-primary font-bold mb-1">SYSTEM BOOT // NAVI.EXE</h2>
      <p className="text-[10px] font-mono text-muted-foreground mb-6">INITIALIZING</p>

      <div className="space-y-1.5 mb-4 text-left max-w-xs mx-auto">
        {lines.map((line, i) => {
          const visible = progress > i * 25;
          return (
            <div key={i} className={`flex items-center gap-2 text-[10px] font-mono transition-opacity ${visible ? "opacity-100" : "opacity-30"}`}>
              {visible ? <Check size={10} className="text-primary" /> : <span className="w-2.5" />}
              <span className="text-foreground/70">{line}</span>
            </div>
          );
        })}
      </div>

      <div className="w-full max-w-xs mx-auto h-1 bg-muted rounded-full overflow-hidden mb-6">
        <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>

      {progress === 100 && (
        <button
          onClick={onNext}
          className="w-full max-w-xs mx-auto py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
        >
          BEGIN INITIALIZATION <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function TextStep({
  step,
  icon,
  label,
  title,
  body,
  placeholder,
  value,
  onChange,
  onNext,
  cta,
}: {
  step: string;
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  cta: string;
}) {
  const canProceed = value.trim().length > 0;
  return (
    <div className="text-center">
      <IconRing>{icon}</IconRing>
      <p className="text-[10px] font-mono text-muted-foreground mb-1">STEP {step} // {label}</p>
      <h2 className="font-display text-xl text-primary font-bold mb-3">{title}</h2>
      <p className="text-sm text-foreground/80 mb-6 max-w-xs mx-auto">{body}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && canProceed && onNext()}
        placeholder={placeholder}
        autoFocus
        className="w-full max-w-xs mx-auto block bg-card border border-primary/30 rounded px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-6"
      />
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full max-w-xs mx-auto py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {cta} <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepPersonality({
  naviName,
  value,
  onChange,
  onNext,
}: {
  naviName: string;
  value: PersonalityId;
  onChange: (v: PersonalityId) => void;
  onNext: () => void;
}) {
  const selected = PERSONALITIES.find((p) => p.id === value);

  return (
    <div className="text-center">
      <IconRing><Brain size={28} className="text-primary" /></IconRing>
      <p className="text-[10px] font-mono text-muted-foreground mb-1">STEP 03 // PERSONALITY</p>
      <h2 className="font-display text-xl text-primary font-bold mb-3">
        {naviName ? `HOW DOES ${naviName.toUpperCase()} SPEAK?` : "CHOOSE A VOICE MODE"}
      </h2>
      <p className="text-sm text-foreground/80 mb-4 max-w-xs mx-auto">
        Pick the personality that fits how you want to be coached.
      </p>

      <div className="space-y-2 mb-4">
        {PERSONALITIES.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`w-full text-left px-4 py-3 rounded border transition-all ${
              value === p.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <p className={`font-display text-sm font-bold ${value === p.id ? "text-primary" : "text-foreground"}`}>
              {p.label}
            </p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.desc}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="bg-card/50 border border-primary/20 rounded p-3 mb-6 text-left">
          <p className="text-[9px] font-mono text-primary mb-1">PREVIEW</p>
          <p className="text-xs italic text-foreground/80">{selected.flavor}</p>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
      >
        LOCK IN <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepTour({ onNext }: { onNext: () => void }) {
  const [activePage, setActivePage] = useState(0);
  const page = TOUR_PAGES[activePage];

  return (
    <div className="text-center">
      <p className="text-[10px] font-mono text-muted-foreground mb-1">STEP 04 // SYSTEM TOUR</p>
      <h2 className="font-display text-xl text-primary font-bold mb-4">YOUR ARSENAL</h2>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded p-4 mb-4 text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              {page.icon}
            </div>
            <div>
              <p className="text-[10px] font-mono text-primary">{page.label.toUpperCase()}</p>
              <p className="font-display text-sm font-bold text-foreground">{page.title}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-mono text-muted-foreground mb-0.5">WHAT IT IS</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{page.what}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-muted-foreground mb-0.5">HOW TO USE IT</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{page.how}</p>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-[9px] font-mono text-primary mb-0.5">TIP</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{page.tip}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setActivePage((p) => Math.max(0, p - 1))}
          disabled={activePage === 0}
          className="px-3 py-2 rounded border border-border text-muted-foreground text-[10px] font-mono hover:text-foreground transition-colors disabled:opacity-30"
        >
          ← PREV
        </button>
        <div className="flex gap-1.5 items-center">
          {TOUR_PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActivePage(i)}
              className={`rounded-full h-1.5 transition-all ${
                i === activePage ? "w-4 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        {activePage < TOUR_PAGES.length - 1 ? (
          <button
            onClick={() => setActivePage((p) => p + 1)}
            className="px-3 py-2 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors"
          >
            NEXT →
          </button>
        ) : (
          <button
            onClick={onNext}
            className="px-3 py-2 rounded border border-primary/40 bg-primary/10 text-primary text-[10px] font-display font-bold hover:bg-primary/20 transition-colors"
          >
            DONE
          </button>
        )}
      </div>
    </div>
  );
}

function StepLaunch({
  operatorName,
  naviName,
  personality,
  onComplete,
}: {
  operatorName: string;
  naviName: string;
  personality: PersonalityId;
  onComplete: () => void;
}) {
  const personalityLabel = PERSONALITIES.find((p) => p.id === personality)?.label ?? "Guardian";

  const summary = [
    { label: "OPERATOR", value: operatorName || "Unknown" },
    { label: "NAVI NAME", value: naviName || "NAVI" },
    { label: "VOICE MODE", value: personalityLabel },
  ];

  return (
    <div className="text-center">
      <IconRing>
        <Shield size={32} className="text-primary" />
      </IconRing>

      <p className="text-[10px] font-mono text-muted-foreground mb-1">// INITIALIZATION COMPLETE</p>
      <h2 className="font-display text-xl text-primary font-bold mb-3">SYSTEMS ONLINE</h2>
      <p className="text-sm text-foreground/80 mb-6 max-w-xs mx-auto">
        {naviName || "NAVI"} is ready. Your first quest awaits, Operator.
      </p>

      <div className="bg-card border border-border rounded p-3 mb-4 text-left">
        <p className="text-[9px] font-mono text-primary mb-2">OPERATOR PROFILE</p>
        {summary.map((row) => (
          <div key={row.label} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
            <span className="text-[10px] font-mono text-muted-foreground">{row.label}</span>
            <span className="text-xs font-display font-bold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded p-3 mb-6 text-left">
        <p className="text-[9px] font-mono text-primary mb-1">RECOMMENDED FIRST MOVE</p>
        <p className="text-xs text-foreground/80 leading-relaxed">
          Head to Quests and create one Main quest that matters to you right now. One goal. That's all it takes to start the engine.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
      >
        ENTER THE SYSTEM <ArrowRight size={16} />
      </button>
    </div>
  );
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    display_name: "",
    navi_name: "",
    user_navi_description: "",
    navi_personality: "GUARDIAN",
  });

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const saveAndNext = async (fields: Partial<FormState> = {}) => {
    const merged = { ...form, ...fields };
    setForm(merged);
    if (Object.keys(fields).length > 0) {
      await updateProfile(fields as any);
    }
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    await updateProfile({
      display_name: form.display_name || null,
      navi_name: form.navi_name || "NAVI",
      navi_personality: form.navi_personality,
      onboarding_done: true,
    } as any);
    localStorage.setItem("navi_onboarding_done", "1");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px] opacity-30" />
      </div>

      <StepDots current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md relative z-10 my-12"
        >
          {step === 0 && <StepBoot onNext={() => setStep(1)} />}
          {step === 1 && (
            <TextStep
              step="01"
              icon={<User size={28} className="text-primary" />}
              label="IDENTITY"
              title="WHO ARE YOU?"
              body="Every operator needs a callsign. What do you go by?"
              placeholder="Enter your name..."
              value={form.display_name}
              onChange={(v) => update("display_name", v)}
              onNext={() => saveAndNext({ display_name: form.display_name })}
              cta="CONFIRM IDENTITY"
            />
          )}
          {step === 2 && (
            <TextStep
              step="02"
              icon={<Sparkles size={28} className="text-primary" />}
              label="COMPANION"
              title="NAME YOUR NAVI"
              body={`${form.display_name ? `Good to meet you, ${form.display_name}.` : "Good to meet you."} Your AI companion needs a name. What will you call them?`}
              placeholder="e.g. NAVI, ARIA, ECHO..."
              value={form.navi_name}
              onChange={(v) => update("navi_name", v)}
              onNext={() => saveAndNext({ navi_name: form.navi_name })}
              cta="CONFIRM NAME"
            />
          )}
          {step === 3 && (
            <StepPersonality
              naviName={form.navi_name}
              value={form.navi_personality}
              onChange={(v) => update("navi_personality", v)}
              onNext={() => saveAndNext({ navi_personality: form.navi_personality })}
            />
          )}
          {step === 4 && <StepTour onNext={() => setStep(5)} />}
          {step === 5 && (
            <StepLaunch
              operatorName={form.display_name}
              naviName={form.navi_name}
              personality={form.navi_personality}
              onComplete={handleComplete}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
