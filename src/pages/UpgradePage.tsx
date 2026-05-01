import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Zap, Check, Lock, Loader2, Crown, Coins } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionBadge from "@/components/SubscriptionBadge";

const FREE_FEATURES  = ["3 active quests", "15 AI messages/day", "2 starter skins", "Basic NAVI personality"];
const CORE_FEATURES  = ["Unlimited quests", "Unlimited AI messages (GPT-4o-mini)", "All 64 skins", "All personality modes", "Push notifications", "Party system", "Full stats dashboard", "Guild access"];
const ELITE_FEATURES = [
  "Everything in Core",
  "GPT-4o model upgrade for NAVI",
  "Voice NAVI (real speech synthesis)",
  "Agent automation & scheduling",
  "Advanced semantic memory (25 results)",
  "Memory consolidation & learning",
  "Priority AI response speed",
  "Forge tokens 2× earn rate",
  "Exclusive Elite skins",
];

export default function UpgradePage() {
  const [params] = useSearchParams();
  const { tier, startCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const success = params.get("success") === "1";
  const cancelled = params.get("cancelled") === "1";

  async function handleUpgrade() {
    setLoading(true);
    try { await startCheckout(); } finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="UPGRADE" subtitle="// UNLOCK FULL OPERATOR ACCESS" />

      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded border border-neon-green/40 bg-neon-green/5 text-center">
          <p className="font-display text-neon-green font-bold tracking-wider">// OPERATOR ONLINE</p>
          <p className="text-xs font-mono text-muted-foreground mt-1">Core Operator access activated. Welcome.</p>
        </motion.div>
      )}

      {cancelled && (
        <div className="mb-6 p-3 rounded border border-border bg-muted/20 text-center">
          <p className="text-xs font-mono text-muted-foreground">Upgrade cancelled. You remain on the FREE tier.</p>
        </div>
      )}

      {/* Current tier */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded border border-border bg-muted/20">
        <span className="text-xs font-mono text-muted-foreground">YOUR CURRENT TIER:</span>
        <SubscriptionBadge tier={tier} />
      </div>

      {/* Tier comparison */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* FREE */}
        <HudCard title="FREE" icon={<Lock size={14} />}>
          <div className="space-y-2 mb-4">
            {FREE_FEATURES.map((f) => (
              <p key={f} className="text-xs font-body text-muted-foreground flex gap-2">
                <span className="text-muted-foreground/40">·</span>{f}
              </p>
            ))}
          </div>
          <p className="text-lg font-display font-bold text-muted-foreground">$0</p>
          <p className="text-[10px] font-mono text-muted-foreground">forever</p>
        </HudCard>

        {/* CORE — highlighted */}
        <motion.div
          className="rounded-lg border-2 border-primary/60 bg-primary/5 p-4 relative"
          style={{ boxShadow: "0 0 32px rgba(56,189,248,0.1)" }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-black text-[10px] font-mono font-bold px-3 py-0.5 rounded-full">RECOMMENDED</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={14} className="text-primary" />
            <span className="text-xs font-display font-bold text-primary tracking-wider">CORE OPERATOR</span>
          </div>
          <div className="space-y-2 mb-4">
            {CORE_FEATURES.map((f) => (
              <p key={f} className="text-xs font-body text-foreground flex gap-2">
                <Check size={10} className="text-neon-green mt-0.5 shrink-0" />{f}
              </p>
            ))}
          </div>
          <p className="text-2xl font-display font-bold text-primary mb-0.5">$7.99</p>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">per month</p>
          {tier === "core" ? (
            <div className="py-2 text-center text-xs font-mono text-neon-green">// ACTIVE</div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-2.5 rounded font-display font-bold tracking-wider text-sm bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              UPGRADE NOW
            </button>
          )}
        </motion.div>

        {/* ELITE OPERATOR */}
        <HudCard title="ELITE OPERATOR" icon={<Crown size={14} />}>
          <div className="space-y-2 mb-4">
            {ELITE_FEATURES.map((f) => (
              <p key={f} className="text-xs font-body text-muted-foreground flex gap-2">
                <span className="text-secondary">·</span>{f}
              </p>
            ))}
          </div>
          <p className="text-lg font-display font-bold text-secondary">$19.99/mo</p>
          <p className="text-[10px] font-mono text-muted-foreground mb-3">per month — Phase 3</p>
          {waitlistSubmitted ? (
            <div className="py-1.5 text-center rounded border border-amber-500/40 bg-amber-500/10">
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest">YOU'RE ON THE LIST</span>
            </div>
          ) : (
            <button
              onClick={() => setWaitlistSubmitted(true)}
              className="w-full py-1.5 text-center rounded border border-secondary/40 bg-secondary/10 text-[10px] font-mono text-secondary hover:bg-secondary/20 transition-colors"
            >
              JOIN WAITLIST
            </button>
          )}
        </HudCard>
      </div>

      {/* Forge Economy */}
      <HudCard title="FORGE ECONOMY" icon={<Coins size={14} />}>
        <p className="text-xs font-body text-muted-foreground mb-3">
          Earn Forge tokens by completing quests. Spend them on exclusive skins, equipment, and profile upgrades.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded border border-border bg-muted/20">
            <p className="text-muted-foreground">Daily Quest</p>
            <p className="text-primary font-bold">+10 Forge</p>
          </div>
          <div className="p-2 rounded border border-border bg-muted/20">
            <p className="text-muted-foreground">Weekly Quest</p>
            <p className="text-primary font-bold">+30 Forge</p>
          </div>
          <div className="p-2 rounded border border-border bg-muted/20">
            <p className="text-muted-foreground">Epic Quest</p>
            <p className="text-primary font-bold">+100 Forge</p>
          </div>
          <div className="p-2 rounded border border-border bg-muted/20">
            <p className="text-muted-foreground">Elite Bonus</p>
            <p className="text-secondary font-bold">2× ALL</p>
          </div>
        </div>
      </HudCard>
    </div>
  );
}
