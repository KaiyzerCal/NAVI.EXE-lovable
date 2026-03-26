import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Brain, Shield, ChevronRight, Check } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: <Sparkles size={40} className="text-primary" />,
    title: "SYSTEM BOOT // NAVI.EXE",
    subtitle: "Neural link establishing...",
    body: "Welcome, Operator. I am your personal Navi — your digital representative, companion, and strategist. I grow stronger as you do. Let's get you initialized.",
    cta: "INITIALIZE",
  },
  {
    id: "name",
    icon: <Shield size={40} className="text-primary" />,
    title: "OPERATOR IDENTIFICATION",
    subtitle: "// STEP 1 OF 4",
    body: "What should I call you, Operator?",
    cta: "CONFIRM",
    input: "display_name" as const,
    placeholder: "Enter your name...",
  },
  {
    id: "navi_name",
    icon: <Zap size={40} className="text-primary" />,
    title: "NAVI DESIGNATION",
    subtitle: "// STEP 2 OF 4",
    body: "Every Navi has a name. What will you call me?",
    cta: "CONFIRM",
    input: "navi_name" as const,
    placeholder: "Name your Navi...",
  },
  {
    id: "description",
    icon: <Brain size={40} className="text-primary" />,
    title: "NAVI PERSONALITY SEED",
    subtitle: "// STEP 3 OF 4",
    body: "Describe the ideal version of me in one sentence. This shapes how I speak to you.",
    cta: "CONFIRM",
    input: "user_navi_description" as const,
    placeholder: "e.g. Direct, sharp, and always honest even when it's hard...",
    multiline: true,
  },
  {
    id: "personality",
    icon: <Shield size={40} className="text-primary" />,
    title: "SELECT PERSONALITY MODE",
    subtitle: "// STEP 4 OF 4",
    body: "Choose how I engage with you by default. You can change this anytime.",
    cta: "JACK IN",
    input: "navi_personality" as const,
    options: [
      { id: "GUARDIAN", label: "Guardian", desc: "Loyal, steady, always in your corner" },
      { id: "HYPE", label: "Hype", desc: "High-voltage energy, battle-ready" },
      { id: "COMPANION", label: "Companion", desc: "Warm, empathetic, heart-first" },
      { id: "ROGUE", label: "Rogue", desc: "Sharp wit, tells it like it is" },
    ],
  },
  {
    id: "tour",
    icon: <Sparkles size={40} className="text-primary" />,
    title: "SYSTEMS ONLINE",
    subtitle: "// INITIALIZATION COMPLETE",
    body: null,
    cta: "ENTER THE DIGITAL WORLD",
    tour: true,
  },
];

const TOUR_ITEMS = [
  { icon: "🗡️", label: "QUESTS", desc: "Your real-world missions. Main, Side, Daily, Weekly, Minor, Epic." },
  { icon: "🤖", label: "NAVI AI", desc: "Talk to me here. I have full access to your quests and memories." },
  { icon: "⚡", label: "CHARACTER", desc: "Take the MBTI quiz to unlock your class and sub-class." },
  { icon: "📖", label: "JOURNAL", desc: "Your vault of wins, insights, and reflections." },
  { icon: "📊", label: "STATS", desc: "Track your XP, streak, and operator progress." },
  { icon: "🐾", label: "NAVI", desc: "Equip skins, manage bond, and configure your Navi." },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({
    display_name: "",
    navi_name: "",
    user_navi_description: "",
    navi_personality: "GUARDIAN",
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = async () => {
    if (current.input && inputValues[current.input] !== undefined) {
      const val = inputValues[current.input].trim();
      if (val) {
        await updateProfile({ [current.input]: val } as any);
      }
    }

    if (isLast) {
      localStorage.setItem("navi_onboarding_done", "1");
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  const canProceed = () => {
    if (!current.input) return true;
    if (current.options) return true;
    const val = inputValues[current.input]?.trim() || "";
    if (current.id === "description") return true;
    return val.length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.03)_50%)] bg-[length:100%_4px] opacity-30" />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
            i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-muted"
          }`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.25 }} className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-card border border-primary/30 flex items-center justify-center">{current.icon}</div>
          </div>

          <div className="text-center mb-6">
            <p className="text-[10px] font-mono text-muted-foreground mb-1">{current.subtitle}</p>
            <h2 className="font-display text-xl text-primary font-bold mb-3">{current.title}</h2>
            {current.body && <p className="text-sm font-body text-foreground/80 leading-relaxed">{current.body}</p>}
          </div>

          {current.input && !current.options && (
            <div className="mb-6">
              {current.multiline ? (
                <textarea value={inputValues[current.input]} onChange={(e) => setInputValues((v) => ({ ...v, [current.input!]: e.target.value }))}
                  placeholder={current.placeholder} rows={3} autoFocus
                  className="w-full bg-card border border-primary/30 rounded px-4 py-3 text-sm font-body text-foreground outline-none focus:border-primary/60 transition-colors resize-none placeholder:text-muted-foreground" />
              ) : (
                <input type="text" value={inputValues[current.input]} onChange={(e) => setInputValues((v) => ({ ...v, [current.input!]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && canProceed() && handleNext()} placeholder={current.placeholder} autoFocus
                  className="w-full bg-card border border-primary/30 rounded px-4 py-3 text-sm font-body text-foreground outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground" />
              )}
            </div>
          )}

          {current.options && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {current.options.map((opt) => (
                <button key={opt.id} onClick={() => setInputValues((v) => ({ ...v, navi_personality: opt.id }))}
                  className={`rounded border p-3 text-left transition-all ${
                    inputValues.navi_personality === opt.id ? "border-primary/50 bg-primary/10" : "border-border bg-card hover:border-primary/30"
                  }`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    {inputValues.navi_personality === opt.id && <Check size={10} className="text-primary" />}
                    <p className="text-xs font-display font-bold text-foreground">{opt.label}</p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {current.tour && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {TOUR_ITEMS.map((item) => (
                <div key={item.label} className="bg-card border border-border rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{item.icon}</span>
                    <p className="text-[10px] font-mono font-bold text-primary">{item.label}</p>
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleNext} disabled={!canProceed()}
            className="w-full py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {current.cta}
            {!isLast && <ChevronRight size={16} />}
          </button>

          {(current.id === "description") && !isLast && (
            <button onClick={() => setStep((s) => s + 1)}
              className="w-full mt-2 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors py-1">
              SKIP
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
