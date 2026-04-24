import { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Lock, Check, Layers, Filter } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { getNaviCharacter } from "@/components/navi-characters";
import {
  SKIN_DEFINITIONS,
  SKIN_CATEGORIES,
  RARITY_COLORS,
  RARITY_GLOW,
  isSkinUnlocked,
  type SkinCategory,
  type SkinRarity,
  type UnlockState,
} from "@/lib/skinUnlockSystem";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_LABELS: Record<SkinCategory, string> = {
  CLASS:     "CLASS",
  ELEMENTAL: "ELEMENTAL",
  NATURE:    "NATURE",
  TECH:      "TECH",
  MYTHIC:    "MYTHIC",
  COSMIC:    "COSMIC",
  SPECIAL:   "SPECIAL",
};

const RARITY_ORDER: SkinRarity[] = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

function SkinCard({
  skinId,
  isUnlocked,
  isEquipped,
  onEquip,
}: {
  skinId: string;
  isUnlocked: boolean;
  isEquipped: boolean;
  onEquip: () => void;
}) {
  const def = SKIN_DEFINITIONS.find((s) => s.id === skinId)!;
  const NaviComponent = getNaviCharacter(skinId);
  const rarityColor = RARITY_COLORS[def.rarity];
  const glow = RARITY_GLOW[def.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-lg border p-3 flex flex-col items-center gap-2 cursor-pointer transition-all group
        ${isEquipped
          ? "border-primary/70 bg-primary/10"
          : isUnlocked
          ? "border-border hover:border-primary/40 bg-card hover:bg-muted/10"
          : "border-border/40 bg-muted/5 opacity-50"
        }`}
      style={isEquipped ? { boxShadow: "0 0 12px rgba(56,189,248,0.2)" } : undefined}
      onClick={isUnlocked ? onEquip : undefined}
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: rarityColor, boxShadow: glow }}
      />

      {/* Equipped badge */}
      {isEquipped && (
        <div className="absolute top-1.5 right-1.5 bg-primary text-black text-[8px] font-mono px-1.5 py-0.5 rounded-full">
          ON
        </div>
      )}

      {/* Skin preview */}
      <div className="w-14 h-14 relative flex items-center justify-center">
        {isUnlocked && NaviComponent ? (
          <Suspense fallback={<div className="w-14 h-14 rounded-full bg-muted/30 animate-pulse" />}>
            <NaviComponent size={56} animated={false} />
          </Suspense>
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted/20 border border-border flex items-center justify-center">
            <Lock size={16} className="text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Name */}
      <p className={`text-[10px] font-mono text-center ${isEquipped ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
        {def.name.toUpperCase()}
      </p>

      {/* Rarity label */}
      <p className="text-[8px] font-mono" style={{ color: rarityColor }}>
        {def.rarity}
      </p>

      {/* Unlock condition (when locked) */}
      {!isUnlocked && (
        <p className="text-[8px] font-mono text-muted-foreground/60 text-center leading-tight">
          {def.unlockCondition}
        </p>
      )}
    </motion.div>
  );
}

export default function SkinsPage() {
  const { profile, updateProfile } = useAppData();
  const [activeCategory, setActiveCategory] = useState<SkinCategory | "ALL">("ALL");
  const [rarityFilter, setRarityFilter] = useState<SkinRarity | "ALL">("ALL");
  const [showLocked, setShowLocked] = useState(true);

  const unlockState: UnlockState = {
    operatorLevel: profile.operator_level ?? 1,
    naviLevel: profile.navi_level ?? 1,
    currentStreak: profile.current_streak ?? 0,
    questsCompleted: (profile as any).quests_completed ?? 0,
    unlockedAchievements: new Set(),
    isPremium: (profile as any).subscription_tier === "core" || (profile as any).subscription_tier === "power",
  };

  const visibleSkins = SKIN_DEFINITIONS.filter((skin) => {
    if (activeCategory !== "ALL" && skin.category !== activeCategory) return false;
    if (rarityFilter !== "ALL" && skin.rarity !== rarityFilter) return false;
    if (!showLocked && !isSkinUnlocked(skin, unlockState)) return false;
    return true;
  }).sort((a, b) => {
    const rarityDiff = RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
    if (rarityDiff !== 0) return rarityDiff;
    return a.name.localeCompare(b.name);
  });

  const totalUnlocked = SKIN_DEFINITIONS.filter((s) => isSkinUnlocked(s, unlockState)).length;

  async function equipSkin(skinId: string) {
    await updateProfile({ equipped_skin: skinId });
  }

  return (
    <div>
      <PageHeader
        title="SKIN COLLECTION"
        subtitle={`// ${totalUnlocked} / ${SKIN_DEFINITIONS.length} UNLOCKED`}
      />

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
          <span>COLLECTION PROGRESS</span>
          <span>{Math.round((totalUnlocked / SKIN_DEFINITIONS.length) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalUnlocked / SKIN_DEFINITIONS.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1 flex-wrap">
          {(["ALL", ...SKIN_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors
                ${activeCategory === cat
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-auto items-center">
          {(["ALL", ...RARITY_ORDER] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRarityFilter(r as any)}
              className={`px-2 py-1 text-[9px] font-mono rounded border transition-colors
                ${rarityFilter === r ? "border-primary/60 bg-primary/10" : "border-border"}`}
              style={r !== "ALL" ? { color: RARITY_COLORS[r as SkinRarity] } : undefined}
            >
              {r}
            </button>
          ))}

          <button
            onClick={() => setShowLocked(!showLocked)}
            className={`ml-2 flex items-center gap-1 px-2 py-1 text-[9px] font-mono rounded border transition-colors
              ${!showLocked ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {showLocked ? <Layers size={9} /> : <Lock size={9} />}
            {showLocked ? "HIDE LOCKED" : "SHOW ALL"}
          </button>
        </div>
      </div>

      {/* Currently equipped */}
      <div className="mb-4 p-3 rounded border border-primary/30 bg-primary/5 flex items-center gap-3">
        <div className="w-10 h-10 shrink-0">
          {(() => {
            const NaviComp = getNaviCharacter(profile.equipped_skin);
            return NaviComp ? (
              <Suspense fallback={<div className="w-10 h-10 rounded-full bg-muted/30 animate-pulse" />}>
                <NaviComp size={40} animated />
              </Suspense>
            ) : null;
          })()}
        </div>
        <div>
          <p className="text-[10px] font-mono text-muted-foreground">EQUIPPED</p>
          <p className="text-sm font-display font-bold text-primary">{profile.equipped_skin}</p>
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence>
        {activeCategory === "ALL" ? (
          SKIN_CATEGORIES.map((cat) => {
            const catSkins = visibleSkins.filter((s) => s.category === cat);
            if (catSkins.length === 0) return null;
            return (
              <div key={cat} className="mb-6">
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-3">
                  // {CATEGORY_LABELS[cat]}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {catSkins.map((skin) => (
                    <SkinCard
                      key={skin.id}
                      skinId={skin.id}
                      isUnlocked={isSkinUnlocked(skin, unlockState)}
                      isEquipped={profile.equipped_skin === skin.id}
                      onEquip={() => equipSkin(skin.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {visibleSkins.map((skin) => (
              <SkinCard
                key={skin.id}
                skinId={skin.id}
                isUnlocked={isSkinUnlocked(skin, unlockState)}
                isEquipped={profile.equipped_skin === skin.id}
                onEquip={() => equipSkin(skin.id)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {visibleSkins.length === 0 && (
        <div className="text-center py-12">
          <p className="font-mono text-muted-foreground text-sm">No skins match your filters.</p>
        </div>
      )}
    </div>
  );
}
