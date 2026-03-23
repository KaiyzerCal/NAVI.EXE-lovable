import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Wifi, Shield, Zap, Sparkles, Lock, Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import naviDefault from "@/assets/navi-default.png";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SkinCategory = "ELEMENTAL" | "CLASS" | "MYTHIC" | "COSMIC" | "NATURE" | "TECH" | "SPECIAL";

interface NaviSkin {
  name: string;
  category: SkinCategory;
  color: string;
  unlocked: boolean;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

const RARITY_BORDER: Record<string, string> = {
  COMMON: "border-muted-foreground/30",
  RARE: "border-primary/50",
  EPIC: "border-secondary/60",
  LEGENDARY: "border-accent/80",
};

const RARITY_BG: Record<string, string> = {
  COMMON: "bg-muted/20",
  RARE: "bg-primary/5",
  EPIC: "bg-secondary/10",
  LEGENDARY: "bg-accent/10",
};

const ALL_SKINS: NaviSkin[] = [
  { name: "FLAMEBIRD", category: "ELEMENTAL", color: "orange-red", unlocked: false, rarity: "RARE" },
  { name: "AQUACAT", category: "ELEMENTAL", color: "ocean blue", unlocked: false, rarity: "RARE" },
  { name: "THUNDERDOG", category: "ELEMENTAL", color: "electric yellow", unlocked: false, rarity: "RARE" },
  { name: "CRYSTALFISH", category: "ELEMENTAL", color: "ice blue crystal", unlocked: false, rarity: "EPIC" },
  { name: "SHADOWBUNNY", category: "ELEMENTAL", color: "dark purple shadow", unlocked: false, rarity: "EPIC" },
  { name: "IRONBEAR", category: "ELEMENTAL", color: "steel grey", unlocked: false, rarity: "RARE" },
  { name: "STORMDRAKE", category: "ELEMENTAL", color: "stormy blue lightning", unlocked: false, rarity: "LEGENDARY" },
  { name: "VENOMBUG", category: "ELEMENTAL", color: "toxic green", unlocked: false, rarity: "COMMON" },
  { name: "FROSTFOX", category: "ELEMENTAL", color: "icy white-blue", unlocked: false, rarity: "RARE" },
  { name: "EMBERCORE", category: "ELEMENTAL", color: "deep ember orange", unlocked: false, rarity: "EPIC" },
  { name: "TIDECALLER", category: "ELEMENTAL", color: "teal ocean", unlocked: false, rarity: "RARE" },
  { name: "NETOP", category: "CLASS", color: "cyan digital", unlocked: true, rarity: "COMMON" },
  { name: "WARRIOR", category: "CLASS", color: "crimson red", unlocked: false, rarity: "COMMON" },
  { name: "GUARDIAN", category: "CLASS", color: "royal blue", unlocked: false, rarity: "RARE" },
  { name: "PALADIN", category: "CLASS", color: "golden holy", unlocked: false, rarity: "EPIC" },
  { name: "BERSERKER", category: "CLASS", color: "blood red dark", unlocked: false, rarity: "RARE" },
  { name: "SORCERER", category: "CLASS", color: "mystic purple", unlocked: false, rarity: "EPIC" },
  { name: "RANGER", category: "CLASS", color: "forest green", unlocked: false, rarity: "COMMON" },
  { name: "NAVIGATOR", category: "CLASS", color: "teal compass", unlocked: false, rarity: "RARE" },
  { name: "ROCKETEER", category: "CLASS", color: "fiery orange jet", unlocked: false, rarity: "EPIC" },
  { name: "ALCHEMIST", category: "CLASS", color: "gold-green potion", unlocked: false, rarity: "RARE" },
  { name: "PHOENIX", category: "MYTHIC", color: "blazing orange-gold fire", unlocked: false, rarity: "LEGENDARY" },
  { name: "LEVIATHAN", category: "MYTHIC", color: "deep sea blue", unlocked: false, rarity: "LEGENDARY" },
  { name: "THUNDERGOD", category: "MYTHIC", color: "gold lightning", unlocked: false, rarity: "LEGENDARY" },
  { name: "BANSHEE", category: "MYTHIC", color: "ghostly purple", unlocked: false, rarity: "EPIC" },
  { name: "GOLEM", category: "MYTHIC", color: "earthy brown rock", unlocked: false, rarity: "RARE" },
  { name: "FROSTGIANT", category: "MYTHIC", color: "glacial white-blue", unlocked: false, rarity: "LEGENDARY" },
  { name: "SUNWYRM", category: "MYTHIC", color: "solar gold-orange", unlocked: false, rarity: "LEGENDARY" },
  { name: "MOONWITCH", category: "MYTHIC", color: "silver-violet moon", unlocked: false, rarity: "EPIC" },
  { name: "TREANT", category: "MYTHIC", color: "mossy dark green", unlocked: false, rarity: "RARE" },
  { name: "RAGNAROK", category: "MYTHIC", color: "apocalyptic red-black", unlocked: false, rarity: "LEGENDARY" },
  { name: "STARDUST", category: "COSMIC", color: "sparkling lavender", unlocked: false, rarity: "EPIC" },
  { name: "NEBULA", category: "COSMIC", color: "pink-purple nebula", unlocked: false, rarity: "EPIC" },
  { name: "XENOMORPH", category: "COSMIC", color: "alien dark green", unlocked: false, rarity: "LEGENDARY" },
  { name: "GALACTIC", category: "COSMIC", color: "deep space blue", unlocked: false, rarity: "EPIC" },
  { name: "COSMIC", category: "COSMIC", color: "violet cosmic", unlocked: false, rarity: "RARE" },
  { name: "VOIDWALKER", category: "COSMIC", color: "void black-purple", unlocked: false, rarity: "LEGENDARY" },
  { name: "UFOSIGNAL", category: "COSMIC", color: "neon green alien", unlocked: false, rarity: "RARE" },
  { name: "SOLARIS", category: "COSMIC", color: "blazing sun gold", unlocked: false, rarity: "LEGENDARY" },
  { name: "CELESTIAL", category: "COSMIC", color: "heavenly blue-white", unlocked: false, rarity: "EPIC" },
  { name: "GENESIS", category: "COSMIC", color: "creation teal-gold", unlocked: false, rarity: "LEGENDARY" },
  { name: "LEAFSPIRIT", category: "NATURE", color: "bright leaf green", unlocked: false, rarity: "COMMON" },
  { name: "GALEFORCE", category: "NATURE", color: "wind silver-teal", unlocked: false, rarity: "RARE" },
  { name: "BLOOMFAE", category: "NATURE", color: "pink blossom", unlocked: false, rarity: "EPIC" },
  { name: "PALMSHAMAN", category: "NATURE", color: "tropical green", unlocked: false, rarity: "RARE" },
  { name: "TEMPEST", category: "NATURE", color: "stormy grey-blue", unlocked: false, rarity: "EPIC" },
  { name: "MISTCLOUD", category: "NATURE", color: "soft grey mist", unlocked: false, rarity: "COMMON" },
  { name: "SUNSHARD", category: "NATURE", color: "warm amber gold", unlocked: false, rarity: "RARE" },
  { name: "CYBERCORE", category: "TECH", color: "neon cyan circuit", unlocked: false, rarity: "RARE" },
  { name: "NETBOT", category: "TECH", color: "digital teal", unlocked: false, rarity: "COMMON" },
  { name: "DATASTREAM", category: "TECH", color: "data blue streams", unlocked: false, rarity: "RARE" },
  { name: "BROADCAST", category: "TECH", color: "signal orange", unlocked: false, rarity: "COMMON" },
  { name: "DNAWEAVER", category: "TECH", color: "bio purple helix", unlocked: false, rarity: "EPIC" },
  { name: "MAGNETAR", category: "TECH", color: "magnetic red", unlocked: false, rarity: "EPIC" },
  { name: "NEUROMIND", category: "TECH", color: "neural violet glow", unlocked: false, rarity: "LEGENDARY" },
  { name: "ATOMSPARK", category: "TECH", color: "atomic yellow spark", unlocked: false, rarity: "RARE" },
  { name: "SOULBLADE", category: "SPECIAL", color: "crimson soul flame", unlocked: false, rarity: "LEGENDARY" },
  { name: "HEARTBOND", category: "SPECIAL", color: "warm pink heart", unlocked: false, rarity: "EPIC" },
  { name: "HEXCORE", category: "SPECIAL", color: "dark violet hex", unlocked: false, rarity: "EPIC" },
  { name: "GEMSTONE", category: "SPECIAL", color: "emerald gem green", unlocked: false, rarity: "RARE" },
  { name: "STARMARK", category: "SPECIAL", color: "golden star", unlocked: false, rarity: "RARE" },
  { name: "EYEOFTRUTH", category: "SPECIAL", color: "mystic blue eye", unlocked: false, rarity: "LEGENDARY" },
  { name: "ORACLE", category: "SPECIAL", color: "ethereal purple oracle", unlocked: false, rarity: "LEGENDARY" },
  { name: "ANCHOR", category: "SPECIAL", color: "navy anchor steel", unlocked: false, rarity: "COMMON" },
];

const naviSkills = [
  { name: "Data Scan", level: 5, max: 10, desc: "Analyze quest data" },
  { name: "Sync Pulse", level: 3, max: 8, desc: "Boost operator focus" },
  { name: "Firewall", level: 7, max: 10, desc: "Resist procrastination" },
  { name: "Cache Burst", level: 2, max: 6, desc: "Memory recall boost" },
  { name: "Overclock", level: 1, max: 10, desc: "Temporary stat buff" },
];

const CATEGORIES: SkinCategory[] = ["ELEMENTAL", "CLASS", "MYTHIC", "COSMIC", "NATURE", "TECH", "SPECIAL"];
const currentNaviLevel = 8;

// Simple color map for skin card circles
const SKIN_HUE: Record<SkinCategory, string> = {
  ELEMENTAL: "hsl(15, 80%, 50%)",
  CLASS: "hsl(45, 80%, 50%)",
  MYTHIC: "hsl(280, 70%, 55%)",
  COSMIC: "hsl(240, 70%, 55%)",
  NATURE: "hsl(130, 60%, 42%)",
  TECH: "hsl(185, 90%, 45%)",
  SPECIAL: "hsl(340, 75%, 50%)",
};

export default function NaviPage() {
  const [selectedCategory, setSelectedCategory] = useState<SkinCategory | "ALL">("ALL");
  const [equippedSkin, setEquippedSkin] = useState("NETOP");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewSkin, setPreviewSkin] = useState<NaviSkin | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const filteredSkins = ALL_SKINS.filter((s) => {
    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unlockedCount = ALL_SKINS.filter((s) => s.unlocked).length;

  const handleSkinClick = async (skin: NaviSkin) => {
    setPreviewSkin(skin);
    setPreviewImage(null);
    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-navi-skin", {
        body: { skinName: skin.name, skinColor: skin.color },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setPreviewImage(data.imageUrl + "?t=" + Date.now());
      }
    } catch (err) {
      console.error("Failed to generate skin:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader title="NAVI" subtitle="// COMPANION STATUS" />

      {/* Skin Preview Modal */}
      <Dialog open={!!previewSkin} onOpenChange={() => setPreviewSkin(null)}>
        <DialogContent className="sm:max-w-md bg-card border-primary/30 p-0 overflow-hidden">
          {previewSkin && (
            <div className="flex flex-col items-center p-6">
              <div className="w-56 h-56 rounded-lg bg-muted/30 border border-border flex items-center justify-center mb-4 relative overflow-hidden">
                {generating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-primary animate-spin" />
                    <p className="text-xs font-mono text-muted-foreground animate-pulse">GENERATING ARTWORK...</p>
                  </div>
                ) : previewImage ? (
                  <img
                    src={previewImage}
                    alt={previewSkin.name}
                    className="w-full h-full object-contain drop-shadow-[0_0_16px_hsl(185,100%,50%,0.3)]"
                  />
                ) : (
                  <p className="text-xs font-mono text-muted-foreground">FAILED TO LOAD</p>
                )}
              </div>
              <h3 className="font-display text-lg text-primary font-bold">{previewSkin.name}</h3>
              <div className="flex gap-2 mt-1 mb-3">
                <span className="text-[10px] font-mono text-muted-foreground">{previewSkin.category}</span>
                <span className={`text-[10px] font-mono ${
                  previewSkin.rarity === "LEGENDARY" ? "text-accent" :
                  previewSkin.rarity === "EPIC" ? "text-secondary" :
                  previewSkin.rarity === "RARE" ? "text-primary" : "text-muted-foreground"
                }`}>{previewSkin.rarity}</span>
              </div>
              {previewSkin.unlocked && (
                <Button
                  size="sm"
                  onClick={() => { setEquippedSkin(previewSkin.name); setPreviewSkin(null); }}
                  className="font-mono text-xs"
                >
                  EQUIP SKIN
                </Button>
              )}
              {!previewSkin.unlocked && (
                <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Lock size={10} /> LOCKED
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navi Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-40 h-40 rounded-full bg-primary/5 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative overflow-hidden">
          <img src={naviDefault} alt="NAVI companion" className="w-32 h-32 object-contain drop-shadow-[0_0_12px_hsl(185,100%,50%,0.4)]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
            <Wifi size={10} className="text-background" />
          </div>
        </div>
        <h2 className="font-display text-lg text-primary font-bold text-glow-cyan">NAVI.EXE</h2>
        <p className="text-muted-foreground text-xs font-mono">LVL {currentNaviLevel} // SKIN: {equippedSkin}</p>
        <div className="w-48 mt-2">
          <ProgressBar value={currentNaviLevel} max={10} variant="cyan" label="LEVEL PROGRESS" size="sm" />
        </div>
      </motion.div>

      {/* Skin Locker */}
      <HudCard title="SKIN LOCKER" icon={<Sparkles size={14} />} glow className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-muted-foreground">
            {unlockedCount}/{ALL_SKINS.length} UNLOCKED • TAP TO PREVIEW
          </p>
          <Input
            placeholder="Search skins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 h-7 text-xs bg-muted/50 border-border"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
              selectedCategory === "ALL"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/20"
            }`}
          >
            ALL ({ALL_SKINS.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${
                selectedCategory === cat
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/20"
              }`}
            >
              {cat} ({ALL_SKINS.filter((s) => s.category === cat).length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredSkins.map((skin) => (
            <button
              key={skin.name}
              onClick={() => handleSkinClick(skin)}
              className={`rounded border p-2 flex flex-col items-center gap-1.5 transition-all relative group ${
                RARITY_BORDER[skin.rarity]
              } ${RARITY_BG[skin.rarity]} ${
                equippedSkin === skin.name ? "ring-1 ring-primary" : ""
              } cursor-pointer hover:border-primary/60`}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: `linear-gradient(135deg, ${SKIN_HUE[skin.category]}, ${SKIN_HUE[skin.category]}88)`,
                  boxShadow: `0 0 8px ${SKIN_HUE[skin.category]}44`,
                }}
              >
                {skin.unlocked ? (
                  <span className="text-white drop-shadow-md">{skin.name.slice(0, 2)}</span>
                ) : (
                  <Lock size={12} className="text-white/60" />
                )}
              </div>
              <p className="font-mono text-[8px] text-foreground leading-tight text-center truncate w-full">
                {skin.name}
              </p>
              <span className={`text-[7px] font-mono ${
                skin.rarity === "LEGENDARY" ? "text-accent" :
                skin.rarity === "EPIC" ? "text-secondary" :
                skin.rarity === "RARE" ? "text-primary" : "text-muted-foreground"
              }`}>
                {skin.rarity}
              </span>
              {equippedSkin === skin.name && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check size={8} className="text-primary-foreground" />
                </div>
              )}
            </button>
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
