import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Check, Zap, ArrowRight,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface OnboardingProps {
  onComplete: () => void;
}

type PersonalityId = "GUARDIAN" | "HYPE" | "COMPANION" | "ROGUE";

interface FormState {
  display_name: string;
  navi_name: string;
  navi_personality: PersonalityId;
}

const PERSONALITIES: { id: PersonalityId; label: string; desc: string }[] = [
  { id: "GUARDIAN", label: "GUARDIAN", desc: "Loyal, steady, always in your corner" },
  { id: "HYPE",     label: "HYPE",     desc: "High-voltage energy, battle-ready" },
  { id: "COMPANION",label: "COMPANION",desc: "Warm, empathetic, heart-first" },
  { id: "ROGUE",    label: "ROGUE",    desc: "Sharp wit, tells it like it is" },
];

const TOTAL_STEPS = 3;

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

  // Auto-advance after progress bar completes (2.5 s total, 100 * 40ms = 4 s for the bar
  // then a short pause before advancing)
  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => onNext(), 500);
      return () => clearTimeout(timer);
    }
  }, [progress, onNext]);

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

      <div className="w-full max-w-xs mx-auto h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function StepSetup({
  form,
  onChange,
  onNext,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  onNext: () => void;
}) {
  const canProceed = form.display_name.trim().length > 0 && form.navi_name.trim().length > 0;

  return (
    <div>
      <p className="text-[10px] font-mono text-muted-foreground mb-1 text-center">STEP 02 // SETUP</p>
      <h2 className="font-display text-xl text-primary font-bold mb-5 text-center">INITIALIZE OPERATOR</h2>

      {/* Name fields */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground mb-1">OPERATOR NAME</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => onChange("display_name", e.target.value)}
            placeholder="What do you go by?"
            autoFocus
            className="w-full bg-card border border-primary/30 rounded px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground mb-1">NAVI NAME</label>
          <input
            type="text"
            value={form.navi_name}
            onChange={(e) => onChange("navi_name", e.target.value)}
            placeholder="What will you call your NAVI?"
            className="w-full bg-card border border-primary/30 rounded px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Personality selector — 2×2 grid */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground mb-2">NAVI PERSONALITY</label>
        <div className="grid grid-cols-2 gap-2 mb-5">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange("navi_personality", p.id)}
              className={`text-left px-3 py-3 rounded border transition-all ${
                form.navi_personality === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <p className={`font-display text-xs font-bold mb-0.5 ${form.navi_personality === p.id ? "text-primary" : "text-foreground"}`}>
                {p.label}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground leading-snug">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full py-3 rounded bg-primary/10 border border-primary/40 text-primary font-display text-sm font-bold hover:bg-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        CONTINUE <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepLaunch({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="text-center">
      {/* Glowing icon */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
        <div className="absolute inset-0 rounded-full border border-primary/30" />
        <div className="absolute inset-2 rounded-full border border-primary/50" />
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <Zap size={40} className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>
      </div>

      <h2 className="font-display text-2xl text-primary font-bold mb-2 tracking-wide">
        NAVI.EXE INITIALIZED
      </h2>
      <p className="text-[10px] font-mono text-muted-foreground mb-2">// YOU'RE ONLINE</p>
      <p className="text-sm text-foreground/80 mb-8 max-w-xs mx-auto">
        Your first quest: Tell NAVI what you want to achieve.
      </p>

      {/* Primary CTA */}
      <button
        onClick={onComplete}
        className="w-full py-4 rounded bg-primary/15 border border-primary/60 text-primary font-display text-base font-bold hover:bg-primary/25 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,200,0.15)] mb-3"
      >
        TALK TO NAVI <ArrowRight size={18} />
      </button>

      {/* Secondary skip link */}
      <button
        onClick={onComplete}
        className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
      >
        Skip — explore on my own
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
    navi_personality: "GUARDIAN",
  });

  const update = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSetupContinue = async () => {
    await updateProfile({
      display_name: form.display_name,
      navi_name: form.navi_name,
      navi_personality: form.navi_personality,
    } as any);
    setStep(2);
  };

  const handleComplete = async () => {
    await updateProfile({
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
            <StepSetup
              form={form}
              onChange={update}
              onNext={handleSetupContinue}
            />
          )}
          {step === 2 && <StepLaunch onComplete={handleComplete} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
