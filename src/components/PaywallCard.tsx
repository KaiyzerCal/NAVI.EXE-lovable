import { motion } from "framer-motion";
import { Lock, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  feature: string;
  limit?: string;
  compact?: boolean;
}

export default function PaywallCard({ feature, limit, compact = false }: Props) {
  const { startCheckout } = useSubscription();

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded border border-amber-500/30 bg-amber-500/5">
        <Lock size={14} className="text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-amber-400">{limit ?? `${feature} requires Core Operator`}</p>
        </div>
        <button
          onClick={startCheckout}
          className="px-3 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-mono hover:bg-amber-500/30 transition-colors whitespace-nowrap"
        >
          UPGRADE $7.99
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-6 text-center"
      style={{ boxShadow: "0 0 24px rgba(245,158,11,0.08)" }}
    >
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
        <Lock size={20} className="text-amber-400" />
      </div>

      <p className="text-[10px] font-mono text-amber-400/70 tracking-widest mb-1">// ACCESS RESTRICTED</p>
      <h3 className="font-display text-lg font-bold text-amber-300 mb-2">{feature}</h3>
      {limit && <p className="text-sm font-body text-muted-foreground mb-4">{limit}</p>}

      <button
        onClick={startCheckout}
        className="w-full py-3 rounded font-display font-bold tracking-wider text-sm bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30 transition-all mb-3"
        style={{ boxShadow: "0 0 12px rgba(245,158,11,0.15)" }}
      >
        <Zap size={14} className="inline mr-2" />
        UPGRADE TO CORE OPERATOR
      </button>
      <p className="text-[10px] font-mono text-muted-foreground">$7.99 / month</p>

      <div className="mt-4 pt-4 border-t border-border text-left space-y-1.5">
        {["Unlimited quests", "Unlimited AI messages", "All 64 skins", "Push notifications", "Party system", "Full stats depth"].map((f) => (
          <p key={f} className="text-[11px] font-mono text-muted-foreground">
            <span className="text-neon-green mr-2">✓</span>{f}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
