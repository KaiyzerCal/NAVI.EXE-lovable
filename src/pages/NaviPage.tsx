import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Heart, Wifi, Shield, Zap, Sparkles, Lock, Check } from "lucide-react";
import { useState } from "react";
import naviDefault from "@/assets/navi-default.png";
import { Input } from "@/components/ui/input";

type SkinCategory = "ELEMENTAL" | "CLASS" | "MYTHIC" | "COSMIC" | "NATURE" | "TECH" | "SPECIAL";

interface NaviSkin {
  name: string;
  category: SkinCategory;
  color: string; // tailwind hsl accent
  unlocked: boolean;
  rarity: "COMMON" | "RARE" | "EPIC" | "LEGENDARY";
}

const CATEGORY_COLORS: Record<SkinCategory, string> = {
  ELEMENTAL: "hsl(15, 90%, 55%)",
  CLASS: "hsl(45, 90%, 55%)",
  MYTHIC: "hsl(280, 80%, 60%)",
  COSMIC: "hsl(220, 90%, 60%)",
  NATURE: "hsl(140, 70%, 45%)",
  TECH: "hsl(185, 100%, 50%)",
  SPECIAL: "hsl(340, 80%, 55%)",
};

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
  // Elemental
  { name: "FLAMEBIRD", category: "ELEMENTAL", color: "hsl(15,90%,55%)", unlocked: false, rarity: "RARE" },
  { name: "AQUACAT", category: "ELEMENTAL", color: "hsl(200,90%,55%)", unlocked: false, rarity: "RARE" },
  { name: "THUNDERDOG", category: "ELEMENTAL", color: "hsl(50,95%,55%)", unlocked: false, rarity: "RARE" },
  { name: "CRYSTALFISH", category: "ELEMENTAL", color: "hsl(190,80%,70%)", unlocked: false, rarity: "EPIC" },
  { name: "SHADOWBUNNY", category: "ELEMENTAL", color: "hsl(270,40%,30%)", unlocked: false, rarity: "EPIC" },
  { name: "IRONBEAR", category: "ELEMENTAL", color: "hsl(220,10%,50%)", unlocked: false, rarity: "RARE" },
  { name: "STORMDRAKE", category: "ELEMENTAL", color: "hsl(210,80%,60%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "VENOMBUG", category: "ELEMENTAL", color: "hsl(100,70%,40%)", unlocked: false, rarity: "COMMON" },
  { name: "FROSTFOX", category: "ELEMENTAL", color: "hsl(195,90%,75%)", unlocked: false, rarity: "RARE" },
  { name: "EMBERCORE", category: "ELEMENTAL", color: "hsl(20,95%,50%)", unlocked: false, rarity: "EPIC" },
  { name: "TIDECALLER", category: "ELEMENTAL", color: "hsl(210,70%,50%)", unlocked: false, rarity: "RARE" },
  // Class
  { name: "NETOP", category: "CLASS", color: "hsl(185,100%,50%)", unlocked: true, rarity: "COMMON" },
  { name: "WARRIOR", category: "CLASS", color: "hsl(0,70%,50%)", unlocked: false, rarity: "COMMON" },
  { name: "GUARDIAN", category: "CLASS", color: "hsl(210,60%,50%)", unlocked: false, rarity: "RARE" },
  { name: "PALADIN", category: "CLASS", color: "hsl(45,90%,60%)", unlocked: false, rarity: "EPIC" },
  { name: "BERSERKER", category: "CLASS", color: "hsl(0,90%,45%)", unlocked: false, rarity: "RARE" },
  { name: "SORCERER", category: "CLASS", color: "hsl(270,80%,55%)", unlocked: false, rarity: "EPIC" },
  { name: "RANGER", category: "CLASS", color: "hsl(120,60%,40%)", unlocked: false, rarity: "COMMON" },
  { name: "NAVIGATOR", category: "CLASS", color: "hsl(185,80%,45%)", unlocked: false, rarity: "RARE" },
  { name: "ROCKETEER", category: "CLASS", color: "hsl(30,90%,55%)", unlocked: false, rarity: "EPIC" },
  { name: "ALCHEMIST", category: "CLASS", color: "hsl(55,80%,50%)", unlocked: false, rarity: "RARE" },
  // Mythic
  { name: "PHOENIX", category: "MYTHIC", color: "hsl(25,100%,55%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "LEVIATHAN", category: "MYTHIC", color: "hsl(220,80%,45%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "THUNDERGOD", category: "MYTHIC", color: "hsl(50,100%,55%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "BANSHEE", category: "MYTHIC", color: "hsl(280,60%,50%)", unlocked: false, rarity: "EPIC" },
  { name: "GOLEM", category: "MYTHIC", color: "hsl(30,30%,40%)", unlocked: false, rarity: "RARE" },
  { name: "FROSTGIANT", category: "MYTHIC", color: "hsl(200,80%,75%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "SUNWYRM", category: "MYTHIC", color: "hsl(40,100%,55%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "MOONWITCH", category: "MYTHIC", color: "hsl(260,50%,60%)", unlocked: false, rarity: "EPIC" },
  { name: "TREANT", category: "MYTHIC", color: "hsl(130,50%,35%)", unlocked: false, rarity: "RARE" },
  { name: "RAGNAROK", category: "MYTHIC", color: "hsl(0,80%,40%)", unlocked: false, rarity: "LEGENDARY" },
  // Cosmic
  { name: "STARDUST", category: "COSMIC", color: "hsl(270,70%,70%)", unlocked: false, rarity: "EPIC" },
  { name: "NEBULA", category: "COSMIC", color: "hsl(300,60%,50%)", unlocked: false, rarity: "EPIC" },
  { name: "XENOMORPH", category: "COSMIC", color: "hsl(150,40%,30%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "GALACTIC", category: "COSMIC", color: "hsl(240,70%,55%)", unlocked: false, rarity: "EPIC" },
  { name: "COSMIC", category: "COSMIC", color: "hsl(260,80%,60%)", unlocked: false, rarity: "RARE" },
  { name: "VOIDWALKER", category: "COSMIC", color: "hsl(280,30%,20%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "UFOSIGNAL", category: "COSMIC", color: "hsl(160,90%,55%)", unlocked: false, rarity: "RARE" },
  { name: "SOLARIS", category: "COSMIC", color: "hsl(45,100%,60%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "CELESTIAL", category: "COSMIC", color: "hsl(210,60%,70%)", unlocked: false, rarity: "EPIC" },
  { name: "GENESIS", category: "COSMIC", color: "hsl(180,70%,50%)", unlocked: false, rarity: "LEGENDARY" },
  // Nature
  { name: "LEAFSPIRIT", category: "NATURE", color: "hsl(120,70%,45%)", unlocked: false, rarity: "COMMON" },
  { name: "GALEFORCE", category: "NATURE", color: "hsl(180,50%,60%)", unlocked: false, rarity: "RARE" },
  { name: "BLOOMFAE", category: "NATURE", color: "hsl(330,70%,65%)", unlocked: false, rarity: "EPIC" },
  { name: "PALMSHAMAN", category: "NATURE", color: "hsl(80,60%,40%)", unlocked: false, rarity: "RARE" },
  { name: "TEMPEST", category: "NATURE", color: "hsl(200,60%,50%)", unlocked: false, rarity: "EPIC" },
  { name: "MISTCLOUD", category: "NATURE", color: "hsl(210,30%,70%)", unlocked: false, rarity: "COMMON" },
  { name: "SUNSHARD", category: "NATURE", color: "hsl(40,90%,55%)", unlocked: false, rarity: "RARE" },
  // Tech
  { name: "CYBERCORE", category: "TECH", color: "hsl(185,100%,50%)", unlocked: false, rarity: "RARE" },
  { name: "NETBOT", category: "TECH", color: "hsl(170,80%,45%)", unlocked: false, rarity: "COMMON" },
  { name: "DATASTREAM", category: "TECH", color: "hsl(190,90%,55%)", unlocked: false, rarity: "RARE" },
  { name: "BROADCAST", category: "TECH", color: "hsl(30,80%,55%)", unlocked: false, rarity: "COMMON" },
  { name: "DNAWEAVER", category: "TECH", color: "hsl(300,60%,55%)", unlocked: false, rarity: "EPIC" },
  { name: "MAGNETAR", category: "TECH", color: "hsl(0,60%,50%)", unlocked: false, rarity: "EPIC" },
  { name: "NEUROMIND", category: "TECH", color: "hsl(250,70%,60%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "ATOMSPARK", category: "TECH", color: "hsl(55,90%,50%)", unlocked: false, rarity: "RARE" },
  // Special
  { name: "SOULBLADE", category: "SPECIAL", color: "hsl(340,80%,55%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "HEARTBOND", category: "SPECIAL", color: "hsl(350,80%,60%)", unlocked: false, rarity: "EPIC" },
  { name: "HEXCORE", category: "SPECIAL", color: "hsl(280,70%,45%)", unlocked: false, rarity: "EPIC" },
  { name: "GEMSTONE", category: "SPECIAL", color: "hsl(160,60%,55%)", unlocked: false, rarity: "RARE" },
  { name: "STARMARK", category: "SPECIAL", color: "hsl(45,90%,60%)", unlocked: false, rarity: "RARE" },
  { name: "EYEOFTRUTH", category: "SPECIAL", color: "hsl(200,80%,55%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "ORACLE", category: "SPECIAL", color: "hsl(270,60%,60%)", unlocked: false, rarity: "LEGENDARY" },
  { name: "ANCHOR", category: "SPECIAL", color: "hsl(210,40%,40%)", unlocked: false, rarity: "COMMON" },
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
  const [selectedCategory, setSelectedCategory] = useState<SkinCategory | "ALL">("ALL");
  const [equippedSkin, setEquippedSkin] = useState("NETOP");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSkins = ALL_SKINS.filter((s) => {
    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unlockedCount = ALL_SKINS.filter((s) => s.unlocked).length;

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
            {unlockedCount}/{ALL_SKINS.length} UNLOCKED
          </p>
          <Input
            placeholder="Search skins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-40 h-7 text-xs bg-muted/50 border-border"
          />
        </div>

        {/* Category Filters */}
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

        {/* Skin Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {filteredSkins.map((skin) => (
            <button
              key={skin.name}
              onClick={() => skin.unlocked && setEquippedSkin(skin.name)}
              className={`rounded border p-2 flex flex-col items-center gap-1.5 transition-all relative group ${
                RARITY_BORDER[skin.rarity]
              } ${RARITY_BG[skin.rarity]} ${
                equippedSkin === skin.name ? "ring-1 ring-primary" : ""
              } ${skin.unlocked ? "cursor-pointer hover:border-primary/60" : "cursor-default opacity-60"}`}
            >
              {/* Color avatar circle */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: `linear-gradient(135deg, ${skin.color}, ${skin.color}88)`,
                  boxShadow: skin.unlocked ? `0 0 8px ${skin.color}44` : "none",
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
