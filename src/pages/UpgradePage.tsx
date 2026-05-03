import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Zap, Check, Lock, Loader2, Crown, Package, Swords, ChevronDown, ChevronUp, Coins, BookOpen, Snowflake, ShoppingBag } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";

const FREE_FEATURES  = ["3 active quests", "15 AI messages/day", "2 starter skins", "Basic NAVI personality"];
const CORE_FEATURES  = ["Unlimited quests", "Unlimited AI messages", "All 64 skins", "All personality modes", "Push notifications", "Party system", "Full stats dashboard", "Guild access"];
const ELITE_FEATURES = [
  "Everything in Core",
  "GPT-4o model upgrade for NAVI",
  "Voice NAVI (ElevenLabs speech)",
  "Agent automation & scheduling",
  "Advanced semantic memory (25 results)",
  "Memory consolidation & learning",
  "Priority AI response speed",
  "Codex Points & Cali Coins 2× earn rate",
  "Exclusive Elite skins",
];

interface QuestPack {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  duration_days: number;
  quest_count: number;
  cali_price: number;
  quest_templates: any[];
}

const CATEGORY_COLORS: Record<string, string> = {
  lifestyle: "text-primary border-primary/30 bg-primary/5",
  business:  "text-amber-400 border-amber-400/30 bg-amber-400/5",
  fitness:   "text-neon-green border-neon-green/30 bg-neon-green/5",
};

export default function UpgradePage() {
  const [params] = useSearchParams();
  const { tier, startCheckout } = useSubscription();
  const { user, session } = useAuth();
  const { profile, refetchProfile } = useAppData();
  const [loading, setLoading] = useState(false);
  const [eliteLoading, setEliteLoading] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [packs, setPacks] = useState<QuestPack[]>([]);
  const [ownedPackIds, setOwnedPackIds] = useState<Set<string>>(new Set());
  const [expandedPack, setExpandedPack] = useState<string | null>(null);
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);
  const success = params.get("success") === "1";
  const cancelled = params.get("cancelled") === "1";

  const caliBalance  = (profile as any).cali_coins   ?? 0;
  const codexBalance = (profile as any).codex_points  ?? 0;

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).from("quest_packs").select("*").eq("is_active", true).order("name");
      if (data) setPacks(data);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any).from("operator_quest_packs").select("pack_id").eq("user_id", user.id);
      if (data) setOwnedPackIds(new Set((data as any[]).map((r: any) => r.pack_id)));
    })();
  }, [user]);

  async function handleUpgrade() {
    setLoading(true);
    try { await startCheckout(); } finally { setLoading(false); }
  }

  async function handleEliteCheckout() {
    setEliteLoading(true);
    try {
      const ELITE_PRICE_ID = "price_elite_placeholder"; // replace with real Stripe Elite price ID
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId: ELITE_PRICE_ID, tier: "elite" },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Checkout Error", description: e.message || "Could not start checkout.", variant: "destructive" });
    } finally {
      setEliteLoading(false);
    }
  }

  async function handlePackPurchase(pack: QuestPack) {
    if (!user || !session?.access_token) return;
    if (caliBalance < pack.cali_price) {
      toast({ title: "Not enough Cali coins.", description: `You need ${pack.cali_price} CALI to unlock this pack.`, variant: "destructive" });
      return;
    }
    setPurchasingPack(pack.id);
    try {
      // Insert quest templates as quests for the user
      const quests = (pack.quest_templates as any[]).map((t: any) => ({
        user_id: user.id,
        name: t.name,
        description: t.description || "",
        type: t.type || "Daily",
        total: 1,
        xp_reward: t.xp_reward || 50,
        progress: 0,
        completed: false,
      }));
      const { error: qErr } = await supabase.from("quests").insert(quests as any);
      if (qErr) throw qErr;

      // Record purchase
      await (supabase as any).from("operator_quest_packs").insert({ user_id: user.id, pack_id: pack.id });
      setOwnedPackIds((prev) => new Set([...prev, pack.id]));

      // Deduct Cali coins
      await supabase.functions.invoke("navi-actions", {
        body: { actions: [{ type: "spend_cali", params: { amount: pack.cali_price, reason: `Quest pack: ${pack.name}` } }] },
      });
      await refetchProfile();

      toast({ title: `${pack.name} Activated!`, description: `${pack.quest_count} quests have been added to your board.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not activate quest pack.", variant: "destructive" });
    } finally {
      setPurchasingPack(null);
    }
  }

  const [purchasingFreeze, setPurchasingFreeze] = useState(false);
  async function handleBuyStreakFreeze() {
    if (caliBalance < 200) return;
    setPurchasingFreeze(true);
    try {
      await supabase.functions.invoke("navi-actions", {
        body: {
          actions: [
            { type: "spend_cali", params: { amount: 200, reason: "Streak freeze purchase" } },
            { type: "award_streak_freeze", params: {} },
          ],
        },
      });
      await refetchProfile();
      toast({ title: "Streak Freeze Purchased!", description: "One streak freeze has been added to your account." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Could not purchase streak freeze.", variant: "destructive" });
    } finally {
      setPurchasingFreeze(false);
    }
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

      {/* WALLET */}
      <HudCard title="WALLET" icon={<Coins size={14} />} className="mb-4">
        <div className="flex flex-wrap gap-3 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10">
            <Coins size={13} className="text-amber-400" />
            <span className="font-display font-bold text-amber-400 text-sm">{caliBalance.toLocaleString()}</span>
            <span className="text-[10px] font-mono text-amber-400/70">CALI</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-400/40 bg-purple-400/10">
            <BookOpen size={13} className="text-purple-400" />
            <span className="font-display font-bold text-purple-400 text-sm">{codexBalance.toLocaleString()}</span>
            <span className="text-[10px] font-mono text-purple-400/70">CODEX</span>
          </div>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground">
          Earned by completing quests. Spend on quest packs, skin unlocks, and streak freezes.
        </p>
      </HudCard>

      {/* Streak Freeze purchase */}
      <div className="mb-6 p-4 rounded-lg border border-border bg-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Snowflake size={16} className="text-sky-400 shrink-0" />
          <div>
            <p className="text-xs font-display font-bold tracking-wider">BUY STREAK FREEZE · 200 CALI</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
              You have <span className="text-sky-400 font-bold">{(profile as any).streak_freeze_count ?? 0}</span> freeze{((profile as any).streak_freeze_count ?? 0) !== 1 ? "s" : ""} remaining
            </p>
          </div>
        </div>
        <button
          onClick={handleBuyStreakFreeze}
          disabled={caliBalance < 200 || purchasingFreeze}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-400/10 border border-sky-400/30 text-sky-400 text-[10px] font-mono hover:bg-sky-400/20 transition-colors disabled:opacity-40 shrink-0"
        >
          {purchasingFreeze ? <Loader2 size={10} className="animate-spin" /> : <Snowflake size={10} />}
          BUY FREEZE
        </button>
      </div>

      {/* Current tier */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded border border-border bg-muted/20">
        <span className="text-xs font-mono text-muted-foreground">YOUR CURRENT TIER:</span>
        <SubscriptionBadge tier={tier} />
      </div>

      {/* Tier comparison */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
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
          {tier === "core" || tier === "elite" ? (
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
        <motion.div
          className="rounded-lg border-2 border-secondary/50 bg-secondary/5 p-4 relative"
          style={{ boxShadow: "0 0 24px rgba(168,85,247,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Crown size={14} className="text-secondary" />
            <span className="text-xs font-display font-bold text-secondary tracking-wider">ELITE OPERATOR</span>
          </div>
          <div className="space-y-2 mb-4">
            {ELITE_FEATURES.map((f) => (
              <p key={f} className="text-xs font-body text-foreground flex gap-2">
                <Check size={10} className="text-secondary mt-0.5 shrink-0" />{f}
              </p>
            ))}
          </div>
          <p className="text-2xl font-display font-bold text-secondary mb-0.5">$19.99</p>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">per month</p>
          {tier === "elite" ? (
            <div className="py-2 text-center text-xs font-mono text-secondary">// ACTIVE — ELITE</div>
          ) : waitlistSubmitted ? (
            <div className="py-1.5 text-center rounded border border-amber-500/40 bg-amber-500/10">
              <span className="text-[10px] font-mono text-amber-400 font-bold tracking-widest">YOU'RE ON THE LIST</span>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleEliteCheckout}
                disabled={eliteLoading}
                className="w-full py-2 rounded font-display font-bold tracking-wider text-sm bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 transition-all flex items-center justify-center gap-2"
              >
                {eliteLoading ? <Loader2 size={14} className="animate-spin" /> : <Crown size={14} />}
                UPGRADE TO ELITE
              </button>
              <button
                onClick={() => setWaitlistSubmitted(true)}
                className="w-full py-1.5 text-center rounded border border-secondary/20 bg-transparent text-[10px] font-mono text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-colors"
              >
                JOIN WAITLIST INSTEAD
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quest Packs */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Package size={14} className="text-primary" />
          <h2 className="font-display text-sm font-bold text-primary tracking-widest">QUEST PACKS</h2>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-4">
          30-day quest arcs for specific life domains. Activate a pack to instantly load all quests onto your board.
        </p>
      </div>

      <div className="space-y-3">
        {packs.length === 0 ? (
          <div className="p-6 rounded border border-border text-center">
            <p className="text-xs font-mono text-muted-foreground">Loading quest packs...</p>
          </div>
        ) : (
          packs.map((pack, i) => {
            const owned = ownedPackIds.has(pack.id);
            const expanded = expandedPack === pack.id;
            const colorClass = CATEGORY_COLORS[pack.category] ?? CATEGORY_COLORS.lifestyle;
            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-lg border p-4 ${owned ? "border-neon-green/30 bg-neon-green/5" : "border-border bg-card"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Swords size={13} className={owned ? "text-neon-green" : "text-primary"} />
                      <span className="font-display text-sm font-bold">{pack.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${colorClass}`}>
                        {pack.category.toUpperCase()}
                      </span>
                      {owned && (
                        <span className="text-[9px] font-mono text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded">
                          ACTIVATED
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-body text-muted-foreground mb-2">{pack.description}</p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                      <span>{pack.duration_days}d arc</span>
                      <span>·</span>
                      <span>{pack.quest_count} quests</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {owned ? (
                      <span className="text-[10px] font-mono text-neon-green">ACTIVE</span>
                    ) : (
                      <button
                        onClick={() => handlePackPurchase(pack)}
                        disabled={!!purchasingPack}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-mono hover:bg-amber-400/20 transition-colors disabled:opacity-40"
                      >
                        {purchasingPack === pack.id ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <>
                            <Coins size={10} />
                            UNLOCK · {pack.cali_price} CALI
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedPack(expanded ? null : pack.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-border"
                  >
                    <p className="text-[10px] font-mono text-muted-foreground mb-2">INCLUDED QUESTS</p>
                    <div className="space-y-1.5">
                      {(pack.quest_templates as any[]).map((t: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded shrink-0 mt-0.5 ${
                            t.type === "Epic" ? "bg-accent/10 text-accent" :
                            t.type === "Main" ? "bg-neon-purple/10 text-neon-purple" :
                            t.type === "Weekly" ? "bg-primary/10 text-primary" :
                            "bg-muted/30 text-muted-foreground"
                          }`}>{t.type}</span>
                          <div>
                            <p className="text-xs font-body">{t.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{t.xp_reward} XP</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Skin Shop */}
      <div className="mt-8 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={14} className="text-secondary" />
          <h2 className="font-display text-sm font-bold text-secondary tracking-widest">SKIN SHOP</h2>
        </div>
        <p className="text-xs font-mono text-muted-foreground mb-4">
          Unlock NAVI skins with Cali Coins. Browse all skins on your NAVI page.
          {tier === "free" && (
            <span className="ml-1 text-amber-400/80">Core+ required to access all skins.</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { rarity: "UNCOMMON", price: 500,   color: "text-neon-green border-neon-green/30 bg-neon-green/5",   count: 12 },
          { rarity: "RARE",     price: 1500,  color: "text-primary border-primary/30 bg-primary/5",           count: 8  },
          { rarity: "EPIC",     price: 4000,  color: "text-secondary border-secondary/30 bg-secondary/5",     count: 5  },
          { rarity: "LEGENDARY",price: 10000, color: "text-amber-400 border-amber-400/30 bg-amber-400/5",     count: 3  },
        ].map(({ rarity, price, color, count }) => (
          <div key={rarity} className={`rounded-lg border p-3 flex flex-col gap-2 ${color}`}>
            <span className={`text-[9px] font-mono font-bold tracking-widest ${color.split(" ")[0]}`}>{rarity}</span>
            <div className="flex items-center gap-1">
              <Coins size={11} className="text-amber-400" />
              <span className="font-display font-bold text-xs text-amber-400">{price.toLocaleString()}</span>
              <span className="text-[9px] font-mono text-amber-400/70">CALI</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">{count} skins available</p>
            <button
              onClick={() => window.location.href = "/navi"}
              className={`mt-auto text-[10px] font-mono font-bold tracking-wider hover:opacity-80 transition-opacity text-left ${color.split(" ")[0]}`}
            >
              BROWSE SKINS →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
