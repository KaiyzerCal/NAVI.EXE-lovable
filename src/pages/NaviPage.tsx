import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Heart, Wifi, Shield, Zap, Sparkles, Lock, Check, Loader2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type SkinCategory = "ELEMENTAL" | "CLASS" | "MYTHIC" | "COSMIC" | "NATURE" | "TECH" | "SPECIAL";

interface NaviSkin {
  name: string;
  category: SkinCategory;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/navi-skins`;

const getSkinUrl = (name: string) => `${STORAGE_BASE}/${name.toLowerCase()}.png`;

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
  { name: "FLAMEBIRD", category: "ELEMENTAL", rarity: "RARE" },
  { name: "AQUACAT", category: "ELEMENTAL", rarity: "RARE" },
  { name: "THUNDERDOG", category: "ELEMENTAL", rarity: "RARE" },
  { name: "CRYSTALFISH", category: "ELEMENTAL", rarity: "EPIC" },
  { name: "SHADOWBUNNY", category: "ELEMENTAL", rarity: "EPIC" },
  { name: "IRONBEAR", category: "ELEMENTAL", rarity: "RARE" },
  { name: "STORMDRAKE", category: "ELEMENTAL", rarity: "LEGENDARY" },
  { name: "VENOMBUG", category: "ELEMENTAL", rarity: "COMMON" },
  { name: "FROSTFOX", category: "ELEMENTAL", rarity: "RARE" },
  { name: "EMBERCORE", category: "ELEMENTAL", rarity: "EPIC" },
  { name: "TIDECALLER", category: "ELEMENTAL", rarity: "RARE" },
  { name: "NETOP", category: "CLASS", rarity: "COMMON" },
  { name: "WARRIOR", category: "CLASS", rarity: "COMMON" },
  { name: "GUARDIAN", category: "CLASS", rarity: "RARE" },
  { name: "PALADIN", category: "CLASS", rarity: "EPIC" },
  { name: "BERSERKER", category: "CLASS", rarity: "RARE" },
  { name: "SORCERER", category: "CLASS", rarity: "EPIC" },
  { name: "RANGER", category: "CLASS", rarity: "COMMON" },
  { name: "NAVIGATOR", category: "CLASS", rarity: "RARE" },
  { name: "ROCKETEER", category: "CLASS", rarity: "EPIC" },
  { name: "ALCHEMIST", category: "CLASS", rarity: "RARE" },
  { name: "PHOENIX", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "LEVIATHAN", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "THUNDERGOD", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "BANSHEE", category: "MYTHIC", rarity: "EPIC" },
  { name: "GOLEM", category: "MYTHIC", rarity: "RARE" },
  { name: "FROSTGIANT", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "SUNWYRM", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "MOONWITCH", category: "MYTHIC", rarity: "EPIC" },
  { name: "TREANT", category: "MYTHIC", rarity: "RARE" },
  { name: "RAGNAROK", category: "MYTHIC", rarity: "LEGENDARY" },
  { name: "STARDUST", category: "COSMIC", rarity: "EPIC" },
  { name: "NEBULA", category: "COSMIC", rarity: "EPIC" },
  { name: "XENOMORPH", category: "COSMIC", rarity: "LEGENDARY" },
  { name: "GALACTIC", category: "COSMIC", rarity: "EPIC" },
  { name: "COSMIC", category: "COSMIC", rarity: "RARE" },
  { name: "VOIDWALKER", category: "COSMIC", rarity: "LEGENDARY" },
  { name: "UFOSIGNAL", category: "COSMIC", rarity: "RARE" },
  { name: "SOLARIS", category: "COSMIC", rarity: "LEGENDARY" },
  { name: "CELESTIAL", category: "COSMIC", rarity: "EPIC" },
  { name: "GENESIS", category: "COSMIC", rarity: "LEGENDARY" },
  { name: "LEAFSPIRIT", category: "NATURE", rarity: "COMMON" },
  { name: "GALEFORCE", category: "NATURE", rarity: "RARE" },
  { name: "BLOOMFAE", category: "NATURE", rarity: "EPIC" },
  { name: "PALMSHAMAN", category: "NATURE", rarity: "RARE" },
  { name: "TEMPEST", category: "NATURE", rarity: "EPIC" },
  { name: "MISTCLOUD", category: "NATURE", rarity: "COMMON" },
  { name: "SUNSHARD", category: "NATURE", rarity: "RARE" },
  { name: "CYBERCORE", category: "TECH", rarity: "RARE" },
  { name: "NETBOT", category: "TECH", rarity: "COMMON" },
  { name: "DATASTREAM", category: "TECH", rarity: "RARE" },
  { name: "BROADCAST", category: "TECH", rarity: "COMMON" },
  { name: "DNAWEAVER", category: "TECH", rarity: "EPIC" },
  { name: "MAGNETAR", category: "TECH", rarity: "EPIC" },
  { name: "NEUROMIND", category: "TECH", rarity: "LEGENDARY" },
  { name: "ATOMSPARK", category: "TECH", rarity: "RARE" },
  { name: "SOULBLADE", category: "SPECIAL", rarity: "LEGENDARY" },
  { name: "HEARTBOND", category: "SPECIAL", rarity: "EPIC" },
  { name: "HEXCORE", category: "SPECIAL", rarity: "EPIC" },
  { name: "GEMSTONE", category: "SPECIAL", rarity: "RARE" },
  { name: "STARMARK", category: "SPECIAL", rarity: "RARE" },
  { name: "EYEOFTRUTH", category: "SPECIAL", rarity: "LEGENDARY" },
  { name: "ORACLE", category: "SPECIAL", rarity: "LEGENDARY" },
  { name: "ANCHOR", category: "SPECIAL", rarity: "COMMON" },
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

export default function NaviPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<SkinCategory | "ALL">("ALL");
  const [equippedSkin, setEquippedSkin] = useState("NETOP");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewSkin, setPreviewSkin] = useState<NaviSkin | null>(null);
  const [unlockedSkins, setUnlockedSkins] = useState<Set<string>>(new Set(["NETOP"]));
  const [unlockConditions, setUnlockConditions] = useState<Record<string, { unlock_type: string; unlock_value: number; description: string }>>({});

  useEffect(() => {
    if (!user) return;
    // Fetch unlocked skins
    supabase
      .from("user_unlocked_skins")
      .select("skin_name")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setUnlockedSkins(new Set(data.map((r: any) => r.skin_name)));
      });
    // Fetch unlock conditions
    supabase
      .from("skin_unlock_conditions")
      .select("skin_name, unlock_type, unlock_value, description")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((r: any) => { map[r.skin_name] = r; });
          setUnlockConditions(map);
        }
      });
    // Fetch equipped skin from profile
    supabase
      .from("profiles")
      .select("equipped_skin")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.equipped_skin) setEquippedSkin(data.equipped_skin);
      });
  }, [user]);

  const handleEquipSkin = async (skinName: string) => {
    setEquippedSkin(skinName);
    setPreviewSkin(null);
    if (user) {
      await supabase
        .from("profiles")
        .update({ equipped_skin: skinName } as any)
        .eq("id", user.id);
    }
  };

  const isSkinUnlocked = (name: string) => unlockedSkins.has(name);

  const filteredSkins = ALL_SKINS.filter((s) => {
    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unlockedCount = ALL_SKINS.filter((s) => isSkinUnlocked(s.name)).length;
  const equippedSkinData = ALL_SKINS.find((s) => s.name === equippedSkin);

  return (
    <div>
      <PageHeader title="NAVI" subtitle="// COMPANION STATUS" />

      {/* Skin Preview Modal */}
      <Dialog open={!!previewSkin} onOpenChange={() => setPreviewSkin(null)}>
        <DialogContent className="sm:max-w-md bg-card border-primary/30 p-0 overflow-hidden">
          {previewSkin && (
            <div className="flex flex-col items-center p-6">
              <div className="w-56 h-56 rounded-lg bg-muted/30 border border-border flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src={getSkinUrl(previewSkin.name)}
                  alt={previewSkin.name}
                  className="w-full h-full object-contain drop-shadow-[0_0_16px_hsl(185,100%,50%,0.3)]"
                />
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
              {isSkinUnlocked(previewSkin.name) && (
                <Button
                  size="sm"
                  onClick={() => { setEquippedSkin(previewSkin.name); setPreviewSkin(null); }}
                  className="font-mono text-xs"
                >
                  EQUIP SKIN
                </Button>
              )}
              {!isSkinUnlocked(previewSkin.name) && (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Lock size={10} /> LOCKED
                  </p>
                  {unlockConditions[previewSkin.name] && (
                    <p className="text-[10px] font-mono text-primary flex items-center gap-1">
                      <Trophy size={10} />
                      {unlockConditions[previewSkin.name].description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navi Display — shows equipped skin artwork */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-40 h-40 rounded-full bg-primary/5 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative overflow-hidden">
          <img
            src={getSkinUrl(equippedSkin)}
            alt="NAVI companion"
            className="w-32 h-32 object-contain drop-shadow-[0_0_12px_hsl(185,100%,50%,0.4)]"
          />
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

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredSkins.map((skin) => (
            <button
              key={skin.name}
              onClick={() => setPreviewSkin(skin)}
              className={`rounded border p-2 flex flex-col items-center gap-1.5 transition-all relative group ${
                RARITY_BORDER[skin.rarity]
              } ${RARITY_BG[skin.rarity]} ${
                equippedSkin === skin.name ? "ring-1 ring-primary" : ""
              } cursor-pointer hover:border-primary/60`}
            >
              {/* Skin artwork thumbnail */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted/30 flex items-center justify-center">
                <img
                  src={getSkinUrl(skin.name)}
                  alt={skin.name}
                  className={`w-full h-full object-contain ${!isSkinUnlocked(skin.name) ? "opacity-40 grayscale" : "drop-shadow-[0_0_6px_hsl(185,100%,50%,0.3)]"}`}
                  loading="lazy"
                />
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
