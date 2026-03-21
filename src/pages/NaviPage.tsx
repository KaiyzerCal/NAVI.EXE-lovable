import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Compass, Heart, Wifi, Shield } from "lucide-react";

export default function NaviPage() {
  return (
    <div>
      <PageHeader title="NAVI" subtitle="// COMPANION STATUS" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-32 h-32 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative">
          <Compass className="text-primary" size={48} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
            <Wifi size={10} className="text-background" />
          </div>
        </div>
        <h2 className="font-display text-lg text-primary font-bold text-glow-cyan">NAVI.EXE</h2>
        <p className="text-muted-foreground text-xs font-mono">STATUS: ONLINE // BOND: STRONG</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <HudCard title="BOND STATUS" icon={<Heart size={14} />} glow>
          <ProgressBar value={78} max={100} variant="purple" label="BOND LEVEL" size="md" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-muted rounded p-2 text-center">
              <p className="font-display text-lg text-neon-purple font-bold">78%</p>
              <p className="text-[10px] font-mono text-muted-foreground">SYNC RATE</p>
            </div>
            <div className="bg-muted rounded p-2 text-center">
              <p className="font-display text-lg text-neon-cyan font-bold">142</p>
              <p className="text-[10px] font-mono text-muted-foreground">INTERACTIONS</p>
            </div>
          </div>
        </HudCard>

        <HudCard title="PERSONALITY MATRIX" icon={<Shield size={14} />} glow>
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

      <HudCard title="MEMORY LOG" icon={<Wifi size={14} />}>
        <div className="space-y-2">
          {[
            { memory: "Operator prefers morning routines", confidence: "HIGH" },
            { memory: "Focus sessions work best at 25min", confidence: "MED" },
            { memory: "Coding is primary skill path", confidence: "HIGH" },
            { memory: "Operator responds well to challenges", confidence: "HIGH" },
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <p className="text-sm font-body">{m.memory}</p>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                m.confidence === "HIGH" ? "bg-neon-green/10 text-neon-green" : "bg-neon-amber/10 text-neon-amber"
              }`}>
                {m.confidence}
              </span>
            </div>
          ))}
        </div>
      </HudCard>
    </div>
  );
}
