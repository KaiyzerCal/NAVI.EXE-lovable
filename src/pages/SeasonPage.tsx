import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Trophy, Lock, Check, Star, Calendar, Zap, Coins } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";

const SEASON_END = new Date("2026-08-16");
const SEASON_XP_CAP = 3000;
const XP_PER_TIER = 100;
const TOTAL_TIERS = 30;

const CLAIMED_KEY = "navi_season1_claimed";

function daysLeft(): number {
  return Math.max(0, Math.ceil((SEASON_END.getTime() - Date.now()) / 86400000));
}

interface Reward {
  tier: number;
  name: string;
  type: "xp" | "codex" | "cali" | "title" | "badge";
  value: string | number;
  isPremium: boolean;
}

const FREE_REWARDS: Reward[] = [
  { tier: 1,  name: "+50 XP",         type: "xp",    value: 50,                   isPremium: false },
  { tier: 2,  name: "+25 CP",          type: "codex", value: 25,                   isPremium: false },
  { tier: 3,  name: "+50 XP",         type: "xp",    value: 50,                   isPremium: false },
  { tier: 4,  name: "+25 CP",          type: "codex", value: 25,                   isPremium: false },
  { tier: 5,  name: "+100 CP",         type: "codex", value: 100,                  isPremium: false },
  { tier: 6,  name: "+75 XP",         type: "xp",    value: 75,                   isPremium: false },
  { tier: 7,  name: "+25 CP",          type: "codex", value: 25,                   isPremium: false },
  { tier: 8,  name: "+75 XP",         type: "xp",    value: 75,                   isPremium: false },
  { tier: 9,  name: "+50 CP",          type: "codex", value: 50,                   isPremium: false },
  { tier: 10, name: "Title: Awakened", type: "title", value: "Awakened",           isPremium: false },
  { tier: 11, name: "+100 XP",        type: "xp",    value: 100,                  isPremium: false },
  { tier: 12, name: "+50 CP",          type: "codex", value: 50,                   isPremium: false },
  { tier: 13, name: "+100 XP",        type: "xp",    value: 100,                  isPremium: false },
  { tier: 14, name: "+75 CP",          type: "codex", value: 75,                   isPremium: false },
  { tier: 15, name: "+200 CP",         type: "codex", value: 200,                  isPremium: false },
  { tier: 16, name: "+100 XP",        type: "xp",    value: 100,                  isPremium: false },
  { tier: 17, name: "+75 CP",          type: "codex", value: 75,                   isPremium: false },
  { tier: 18, name: "+150 XP",        type: "xp",    value: 150,                  isPremium: false },
  { tier: 19, name: "+100 CP",         type: "codex", value: 100,                  isPremium: false },
  { tier: 20, name: "Title: Veteran",  type: "title", value: "Digital Veteran",    isPremium: false },
  { tier: 21, name: "+150 XP",        type: "xp",    value: 150,                  isPremium: false },
  { tier: 22, name: "+100 CP",         type: "codex", value: 100,                  isPremium: false },
  { tier: 23, name: "+200 XP",        type: "xp",    value: 200,                  isPremium: false },
  { tier: 24, name: "+150 CP",         type: "codex", value: 150,                  isPremium: false },
  { tier: 25, name: "+300 CP",         type: "codex", value: 300,                  isPremium: false },
  { tier: 26, name: "+200 XP",        type: "xp",    value: 200,                  isPremium: false },
  { tier: 27, name: "+200 CP",         type: "codex", value: 200,                  isPremium: false },
  { tier: 28, name: "+300 XP",        type: "xp",    value: 300,                  isPremium: false },
  { tier: 29, name: "+300 CP",         type: "codex", value: 300,                  isPremium: false },
  { tier: 30, name: "Title: Legend",   type: "title", value: "Season 1 Legend",    isPremium: false },
];

const PREMIUM_REWARDS: Reward[] = [
  { tier: 1,  name: "5 CC",            type: "cali",  value: 5,                    isPremium: true },
  { tier: 3,  name: "5 CC",            type: "cali",  value: 5,                    isPremium: true },
  { tier: 5,  name: "10 CC",           type: "cali",  value: 10,                   isPremium: true },
  { tier: 8,  name: "5 CC",            type: "cali",  value: 5,                    isPremium: true },
  { tier: 10, name: "10 CC",           type: "cali",  value: 10,                   isPremium: true },
  { tier: 13, name: "Badge: Pioneer",  type: "badge", value: "Season Pioneer",     isPremium: true },
  { tier: 15, name: "15 CC",           type: "cali",  value: 15,                   isPremium: true },
  { tier: 18, name: "10 CC",           type: "cali",  value: 10,                   isPremium: true },
  { tier: 20, name: "AXIOM Skin",      type: "badge", value: "AXIOM Elite Shard",  isPremium: true },
  { tier: 25, name: "15 CC",           type: "cali",  value: 15,                   isPremium: true },
  { tier: 30, name: "20 CC + Champion",type: "cali",  value: 20,                   isPremium: true },
];

const REWARD_ICONS: Record<Reward["type"], React.ReactNode> = {
  xp:    <Zap size={10} className="text-primary" />,
  codex: <Zap size={10} className="text-primary" />,
  cali:  <Coins size={10} className="text-accent" />,
  title: <Star size={10} className="text-neon-purple" />,
  badge: <Trophy size={10} className="text-neon-amber" />,
};

export default function SeasonPage() {
  const { profile } = useAppData();
  const [claimed, setClaimed] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(CLAIMED_KEY) ?? "[]")); } catch { return new Set(); }
  });

  const seasonXp = Math.min((profile.xp_total ?? 0), SEASON_XP_CAP);
  const currentTier = Math.min(TOTAL_TIERS, Math.floor(seasonXp / XP_PER_TIER) + 1);
  const tierXp = seasonXp % XP_PER_TIER;
  const progress = Math.round((tierXp / XP_PER_TIER) * 100);

  const claimReward = (tier: number, reward: Reward) => {
    const next = new Set(claimed).add(tier);
    setClaimed(next);
    localStorage.setItem(CLAIMED_KEY, JSON.stringify([...next]));
    toast({ title: `Tier ${tier} claimed!`, description: `Reward: ${reward.name}` });
  };

  const TIER_COLORS: Record<number, string> = {};
  [5, 10, 15, 20, 25, 30].forEach((t, i) => { TIER_COLORS[t] = ["text-neon-green", "text-primary", "text-secondary", "text-neon-amber", "text-neon-purple", "text-accent"][i]; });

  return (
    <div>
      <PageHeader title="SEASON 1" subtitle="// DIGITAL AWAKENING" />

      {/* Header Card */}
      <div className="relative mb-6 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 via-card to-secondary/5 p-5 overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary via-transparent to-secondary" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-primary text-glow-cyan">DIGITAL AWAKENING</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">Season 1 · Ends August 16, 2026</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar size={12} className="text-muted-foreground" />
              <span className="text-xs font-mono text-neon-amber font-bold">{daysLeft()} days remaining</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-muted-foreground">SEASON XP</p>
            <p className="font-display text-3xl font-bold text-primary">{seasonXp.toLocaleString()}</p>
            <p className="text-[10px] font-mono text-muted-foreground">/ {SEASON_XP_CAP.toLocaleString()} max</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
            <span>TIER {currentTier} — {tierXp} / {XP_PER_TIER} XP</span>
            <span>TIER {Math.min(TOTAL_TIERS, currentTier + 1)}</span>
          </div>
          <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Track */}
      <HudCard title="REWARD TRACK" icon={<Trophy size={14} />} glow>
        <p className="text-[10px] font-mono text-muted-foreground mb-4">Scroll horizontally to see all 30 tiers</p>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {Array.from({ length: TOTAL_TIERS }, (_, i) => i + 1).map(tier => {
              const freeReward = FREE_REWARDS.find(r => r.tier === tier);
              const premReward = PREMIUM_REWARDS.find(r => r.tier === tier);
              const isUnlocked = tier <= currentTier;
              const isClaimed = claimed.has(tier);
              const isMilestone = [5, 10, 15, 20, 25, 30].includes(tier);

              return (
                <div key={tier} className="flex flex-col items-center gap-1.5 w-16">
                  {/* Premium reward */}
                  <div className={`w-14 rounded p-1.5 text-center border ${premReward ? "border-neon-purple/30 bg-neon-purple/5" : "border-transparent"}`}>
                    {premReward ? (
                      <div className="space-y-0.5">
                        <div className="flex justify-center">{REWARD_ICONS[premReward.type]}</div>
                        <p className="text-[8px] font-mono text-neon-purple leading-tight">{premReward.name}</p>
                      </div>
                    ) : <div className="h-8" />}
                  </div>

                  {/* Tier node */}
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isUnlocked
                      ? isMilestone
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground"
                  }`}>
                    {isUnlocked ? <Check size={14} className="text-primary" /> : <span className="text-[10px] font-mono">{tier}</span>}
                    {isMilestone && <div className="absolute -inset-0.5 rounded-full border border-primary/30 animate-pulse" />}
                  </div>

                  {/* Connector */}
                  <div className={`w-0.5 h-2 ${isUnlocked ? "bg-primary/40" : "bg-border"}`} />

                  {/* Free reward */}
                  {freeReward && (
                    <div className={`w-14 rounded p-1.5 text-center border ${isUnlocked ? "border-primary/20 bg-primary/5" : "border-border bg-muted/10"}`}>
                      <div className="flex justify-center mb-0.5">{REWARD_ICONS[freeReward.type]}</div>
                      <p className="text-[8px] font-mono text-muted-foreground leading-tight">{freeReward.name}</p>
                      {isUnlocked && !isClaimed && (
                        <button onClick={() => claimReward(tier, freeReward)}
                          className="mt-1 w-full text-[8px] font-mono px-1 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors">
                          CLAIM
                        </button>
                      )}
                      {isClaimed && <p className="text-[8px] font-mono text-neon-green mt-1">CLAIMED</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </HudCard>

      {/* Info */}
      <div className="mt-4 p-4 rounded-lg border border-border bg-card">
        <p className="text-[10px] font-mono text-muted-foreground">
          Earn Season XP by completing quests, writing journal entries, and maintaining your streak. XP caps at {SEASON_XP_CAP.toLocaleString()} this season. Premium track rewards require Elite subscription.
        </p>
      </div>
    </div>
  );
}
