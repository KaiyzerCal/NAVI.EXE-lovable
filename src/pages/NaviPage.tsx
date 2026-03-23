import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Heart, Wifi, Shield, Zap, Star } from "lucide-react";
import naviDefault from "@/assets/navi-default.png";
import naviEvolved from "@/assets/navi-evolved.png";
import naviMega from "@/assets/navi-mega.png";

const NAVI_FORMS = [
  { name: "ROOKIE", img: naviDefault, level: "1–10", unlocked: true },
  { name: "CHAMPION", img: naviEvolved, level: "11–25", unlocked: false },
  { name: "MEGA", img: naviMega, level: "26+", unlocked: false },
];

const naviSkills = [
  { name: "Data Scan", level: 5, max: 10, desc: "Analyze quest data" },
  { name: "Sync Pulse", level: 3, max: 8, desc: "Boost operator focus" },
  { name: "Firewall", level: 7, max: 10, desc: "Resist procrastination" },
  { name: "Cache Burst", level: 2, max: 6, desc: "Memory recall boost" },
  { name: "Overclock", level: 1, max: 10, desc: "Temporary stat buff" },
];

const currentNaviLevel = 8;

export default function NaviPage() {
  const currentForm = NAVI_FORMS[0]; // Rookie at level 8

  return (
    <div>
      <PageHeader title="NAVI" subtitle="// COMPANION STATUS" />

      {/* Navi Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-40 h-40 rounded-full bg-primary/5 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative overflow-hidden">
          <img src={currentForm.img} alt="NAVI companion" className="w-32 h-32 object-contain drop-shadow-[0_0_12px_hsl(185,100%,50%,0.4)]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
            <Wifi size={10} className="text-background" />
          </div>
        </div>
        <h2 className="font-display text-lg text-primary font-bold text-glow-cyan">NAVI.EXE</h2>
        <p className="text-muted-foreground text-xs font-mono">LVL {currentNaviLevel} // {currentForm.name} FORM</p>
        <ProgressBar value={currentNaviLevel} max={10} variant="cyan" label="NEXT EVOLUTION" size="sm" className="w-48 mt-2" />
      </motion.div>

      {/* Evolution Forms */}
      <HudCard title="EVOLUTION LINE" icon={<Star size={14} />} glow className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          {NAVI_FORMS.map((form) => (
            <div
              key={form.name}
              className={`rounded border p-3 flex flex-col items-center gap-2 transition-all ${
                form.unlocked
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-muted/30 opacity-50"
              }`}
            >
              <img
                src={form.img}
                alt={form.name}
                className={`w-20 h-20 object-contain ${!form.unlocked ? "grayscale" : "drop-shadow-[0_0_8px_hsl(185,100%,50%,0.3)]"}`}
              />
              <p className="font-display text-xs text-foreground">{form.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">LVL {form.level}</p>
            </div>
          ))}
        </div>
      </HudCard>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <HudCard title="BOND STATUS" icon={<Heart size={14} />} glow>
          <ProgressBar value={78} max={100} variant="purple" label="BOND LEVEL" size="md" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-muted rounded p-2 text-center">
              <p className="font-display text-lg text-secondary font-bold">78%</p>
              <p className="text-[10px] font-mono text-muted-foreground">SYNC RATE</p>
            </div>
            <div className="bg-muted rounded p-2 text-center">
              <p className="font-display text-lg text-primary font-bold">142</p>
              <p className="text-[10px] font-mono text-muted-foreground">INTERACTIONS</p>
            </div>
          </div>
        </HudCard>

        <HudCard title="NAVI SKILLS" icon={<Zap size={14} />} glow>
          <div className="space-y-2.5">
            {naviSkills.map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-sm font-body">{skill.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">LVL {skill.level}/{skill.max}</span>
                </div>
                <ProgressBar value={skill.level} max={skill.max} variant="cyan" showValue={false} />
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.desc}</p>
              </div>
            ))}
          </div>
        </HudCard>
      </div>

      <HudCard title="PERSONALITY MATRIX" icon={<Shield size={14} />}>
        <div className="space-y-2">
          {[
            { trait: "Encouragement", value: 85 },
            { trait: "Directness", value: 70 },
            { trait: "Humor", value: 60 },
            { trait: "Analytical", value: 90 },
          ].map((t) => (
            <ProgressBar key={t.trait} value={t.value} max={100} variant="cyan" label={t.trait} />
          ))}
        </div>
      </HudCard>
    </div>
  );
}
