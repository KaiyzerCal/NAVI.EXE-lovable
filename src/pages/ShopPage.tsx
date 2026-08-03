import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { ShoppingBag, Zap, Coins, Shield, Star, Clock, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency: "codex" | "cali";
  icon: React.ReactNode;
  action: () => Promise<void>;
}

export default function ShopPage() {
  const { user } = useAuth();
  const [codexPoints, setCodexPoints] = useState(0);
  const [caliCoins, setCaliCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("codex_points, cali_coins").eq("id", user.id).single()
      .then(({ data }) => {
        setCodexPoints(Number((data as any)?.codex_points ?? 0));
        setCaliCoins(Number((data as any)?.cali_coins ?? 0));
        setLoading(false);
      });
  }, [user]);

  const deduct = async (currency: "codex" | "cali", amount: number) => {
    if (!user) return false;
    const current = currency === "codex" ? codexPoints : caliCoins;
    if (current < amount) { toast({ title: "Insufficient funds", variant: "destructive" }); return false; }
    const patch =
      currency === "codex"
        ? { codex_points: current - amount }
        : { cali_coins: current - amount };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) { toast({ title: "Purchase failed", variant: "destructive" }); return false; }
    if (currency === "codex") setCodexPoints(current - amount);
    else setCaliCoins(current - amount);
    return true;
  };

  const buyStreakShield = async () => {
    if (!user || !await deduct("codex", 150)) return;
    const { data: p } = await supabase.from("profiles").select("streak_freeze_count").eq("id", user.id).single();
    await supabase.from("profiles").update({ streak_freeze_count: ((p as any)?.streak_freeze_count ?? 0) + 1 }).eq("id", user.id);
    toast({ title: "Streak Shield activated!", description: "Your streak is protected for an extra day." });
  };

  const grantBuff = async (buff: {
    name: string;
    description: string;
    effect_type: string;
    stat_affected: string;
    modifier_value: number;
    duration_hours: number;
  }) => {
    if (!user) return;
    try {
      await supabase.from("buffs").insert({
        user_id: user.id,
        name: buff.name,
        description: buff.description,
        effect_type: buff.effect_type,
        stat_affected: buff.stat_affected,
        modifier_value: buff.modifier_value,
        duration_hours: buff.duration_hours,
        source: "shop",
        expires_at: new Date(Date.now() + buff.duration_hours * 3600000).toISOString(),
      });
    } catch {
      /* non-blocking */
    }
  };

  const buyXPBoost = async () => {
    if (!user || !await deduct("codex", 200)) return;
    await grantBuff({ name: "XP Boost", description: "1.5× XP for 24 hours", effect_type: "buff", stat_affected: "xp_multiplier", modifier_value: 150, duration_hours: 24 });
    toast({ title: "XP Boost active!", description: "Earn 1.5× XP for the next 24 hours." });
  };

  const buyQuestSlot = async () => {
    if (!user || !await deduct("codex", 300)) return;
    await grantBuff({ name: "Quest Slot", description: "Extra quest slot for 7 days", effect_type: "buff", stat_affected: "quest_slots", modifier_value: 1, duration_hours: 168 });
    toast({ title: "Quest slot unlocked!", description: "+1 active quest for 7 days." });
  };

  const buyMemoryReset = async () => {
    if (!user || !await deduct("codex", 100)) return;
    await supabase.from("navi_core_memory").delete().eq("user_id", user.id);
    toast({ title: "NAVI memory wiped", description: "Starting fresh with a clean slate." });
  };

  const buyTitle = async () => {
    if (!user || !await deduct("codex", 500)) return;
    await supabase.from("profiles").update({ custom_title: "Shadow Operative" } as any).eq("id", user.id);
    toast({ title: "Title unlocked: Shadow Operative" });
  };

  const buyPremiumFrame = async () => {
    if (!user || !await deduct("cali", 10)) return;
    await supabase.from("profiles").update({ has_premium_frame: true } as any).eq("id", user.id);
    toast({ title: "Premium frame unlocked!", description: "Your profile now has a premium border." });
  };

  const buyDoubleXP = async () => {
    if (!user || !await deduct("cali", 25)) return;
    await grantBuff({ name: "Double XP", description: "2× XP for 48 hours", effect_type: "buff", stat_affected: "xp_multiplier", modifier_value: 200, duration_hours: 48 });
    toast({ title: "Double XP active!", description: "Earn 2× XP for the next 48 hours." });
  };

  const buyEliteSkinTrial = async () => {
    if (!user || !await deduct("cali", 15)) return;
    await grantBuff({ name: "Elite Skin Trial", description: "7-day access to Elite skins", effect_type: "buff", stat_affected: "skin_trial", modifier_value: 7, duration_hours: 168 });
    toast({ title: "Elite Skin Trial activated!", description: "Access all elite skins for 7 days." });
  };

  const CODEX_ITEMS: ShopItem[] = [
    { id: "streak_shield", name: "Streak Shield", description: "Protects your streak if you miss a day.", cost: 150, currency: "codex", icon: <Shield size={18} className="text-blue-400" />, action: buyStreakShield },
    { id: "xp_boost", name: "XP Boost ×1.5", description: "Earn 1.5× XP for 24 hours.", cost: 200, currency: "codex", icon: <Zap size={18} className="text-primary" />, action: buyXPBoost },
    { id: "quest_slot", name: "Quest Slot +1", description: "Unlock one extra active quest for 7 days.", cost: 300, currency: "codex", icon: <Star size={18} className="text-neon-amber" />, action: buyQuestSlot },
    { id: "memory_reset", name: "Memory Wipe", description: "Clear all NAVI memories and start fresh.", cost: 100, currency: "codex", icon: <Clock size={18} className="text-destructive" />, action: buyMemoryReset },
    { id: "title_shadow", name: "Title: Shadow Operative", description: "A rare cosmetic title displayed on your profile.", cost: 500, currency: "codex", icon: <Star size={18} className="text-neon-purple" />, action: buyTitle },
  ];

  const CALI_ITEMS: ShopItem[] = [
    { id: "premium_frame", name: "Premium Profile Frame", description: "Exclusive animated border on your profile.", cost: 10, currency: "cali", icon: <Star size={18} className="text-accent" />, action: buyPremiumFrame },
    { id: "double_xp", name: "Double XP Weekend", description: "Earn 2× XP for 48 hours.", cost: 25, currency: "cali", icon: <Zap size={18} className="text-neon-green" />, action: buyDoubleXP },
    { id: "elite_trial", name: "Elite Skin Trial", description: "7-day access to all Elite exclusive skins.", cost: 15, currency: "cali", icon: <Shield size={18} className="text-secondary" />, action: buyEliteSkinTrial },
  ];

  const handlePurchase = async (item: ShopItem) => {
    setPurchasing(item.id);
    try {
      await item.action();
      setPurchased(prev => new Set(prev).add(item.id));
    } finally {
      setPurchasing(null);
    }
  };

  const ItemCard = ({ item }: { item: ShopItem }) => {
    const isCali = item.currency === "cali";
    const balance = isCali ? caliCoins : codexPoints;
    const canAfford = balance >= item.cost;
    const isPurchasing = purchasing === item.id;

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-border bg-muted/30 flex items-center justify-center shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display font-bold text-foreground">{item.name}</p>
            <p className="text-[10px] font-body text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-1 text-xs font-mono font-bold ${isCali ? "text-accent" : "text-primary"}`}>
            {isCali ? <Coins size={12} /> : <Zap size={12} />}
            {item.cost} {isCali ? "CC" : "CP"}
          </div>
          <button
            onClick={() => handlePurchase(item)}
            disabled={!canAfford || isPurchasing || !!purchasing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono transition-all ${
              canAfford ? "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20" : "bg-muted border border-border text-muted-foreground cursor-not-allowed opacity-50"
            } disabled:opacity-40`}
          >
            {isPurchasing ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            {isPurchasing ? "BUYING..." : canAfford ? "BUY" : "INSUFFICIENT"}
          </button>
        </div>
      </motion.div>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>;

  return (
    <div>
      <PageHeader title="SHOP" subtitle="// SPEND YOUR EARNINGS" />

      {/* Balance Bar */}
      <div className="flex gap-6 mb-6 bg-card border border-primary/20 rounded p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <Zap size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground">CODEX POINTS</p>
            <p className="font-display text-xl font-bold text-primary">{codexPoints.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
            <Coins size={16} className="text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-muted-foreground">CALI COINS</p>
            <p className="font-display text-xl font-bold text-accent">{caliCoins.toLocaleString()}</p>
          </div>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-[10px] font-mono text-muted-foreground">EARN BY</p>
          <p className="text-[10px] font-mono text-foreground/60">completing quests</p>
        </div>
      </div>

      <div className="space-y-6">
        <HudCard title="CODEX STORE" icon={<Zap size={14} />} glow>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">Spend Codex Points earned from quest completion</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {CODEX_ITEMS.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </HudCard>

        <HudCard title="CALI MARKET" icon={<Coins size={14} />}>
          <p className="text-[10px] font-mono text-muted-foreground mb-4">Spend Cali Coins on premium items</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {CALI_ITEMS.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </HudCard>
      </div>
    </div>
  );
}
