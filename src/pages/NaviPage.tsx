import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Heart, Wifi, Shield, Zap, Sparkles, Lock, Check, Trophy, MessageSquare, Star, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useOwner } from "@/hooks/useOwner";

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

const NAVI_PERSONALITIES = [
  { id: "GUARDIAN", label: "Guardian", desc: "Loyal, encouraging, steady" },
  { id: "HYPE", label: "Hype", desc: "Energetic, hyped, high-voltage" },
  { id: "COMPANION", label: "Companion", desc: "Soft, empathetic, heart-first" },
  { id: "ROGUE", label: "Rogue", desc: "Witty, sarcastic, sharp (Lv3+)", unlockLevel: 3 },
  { id: "SHADOW", label: "Shadow", desc: "Mysterious, cryptic, precise (Lv5+)", unlockLevel: 5 },
  { id: "SAGE", label: "Sage", desc: "Analytical, strategic, tactical (Lv8+)", unlockLevel: 8 },
];

const NAVI_SKILLS_BY_LEVEL: { name: string; unlockLevel: number; max: number; desc: string }[] = [
  { name: "Data Scan", unlockLevel: 1, max: 10, desc: "Analyze quest data" },
  { name: "Sync Pulse", unlockLevel: 3, max: 10, desc: "Boost operator focus" },
  { name: "Firewall", unlockLevel: 5, max: 10, desc: "Resist procrastination" },
  { name: "Cache Burst", unlockLevel: 8, max: 10, desc: "Memory recall boost" },
  { name: "Overclock", unlockLevel: 12, max: 10, desc: "Temporary stat buff" },
  { name: "Neural Link", unlockLevel: 15, max: 10, desc: "Deep operator sync" },
  { name: "Quantum Parse", unlockLevel: 20, max: 10, desc: "Multi-task analysis" },
  { name: "Aegis Shield", unlockLevel: 25, max: 10, desc: "Burnout protection" },
  { name: "Hyperdrive", unlockLevel: 30, max: 10, desc: "Productivity surge" },
  { name: "Singularity", unlockLevel: 40, max: 10, desc: "Ultimate ability" },
];

const CATEGORIES: SkinCategory[] = ["ELEMENTAL", "CLASS", "MYTHIC", "COSMIC", "NATURE", "TECH", "SPECIAL"];

export default function NaviPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const isOwner = useOwner();
  const [selectedCategory, setSelectedCategory] = useState<SkinCategory | "ALL">("ALL");
  const [equippedSkin, setEquippedSkin] = useState("NETOP");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewSkin, setPreviewSkin] = useState<NaviSkin | null>(null);
  const [unlockedSkins, setUnlockedSkins] = useState<Set<string>>(new Set(["NETOP"]));
  const [unlockConditions, setUnlockConditions] = useState<Record<string, { unlock_type: string; unlock_value: number; description: string }>>({});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_unlocked_skins").select("skin_name").eq("user_id", user.id)
      .then(({ data }) => { if (data) setUnlockedSkins(new Set(data.map((r: any) => r.skin_name))); });
    supabase.from("skin_unlock_conditions").select("skin_name, unlock_type, unlock_value, description")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, any> = {};
          data.forEach((r: any) => { map[r.skin_name] = r; });
          setUnlockConditions(map);
        }
      });
    supabase.from("profiles").select("equipped_skin").eq("id", user.id).single()
      .then(({ data }) => { if (data?.equipped_skin) setEquippedSkin(data.equipped_skin); });
  }, [user]);

  const handleEquipSkin = async (skinName: string) => {
    setEquippedSkin(skinName);
    setPreviewSkin(null);
    if (user) {
      await supabase.from("profiles").update({ equipped_skin: skinName } as any).eq("id", user.id);
    }
  };

  const isSkinUnlocked = (name: string) => unlockedSkins.has(name);

  const filteredSkins = ALL_SKINS.filter((s) => {
    const matchesCategory = selectedCategory === "ALL" || s.category === selectedCategory;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unlockedCount = ALL_SKINS.filter((s) => isSkinUnlocked(s.name)).length;
  const naviLevel = profile.navi_level;
  const unlockedNaviSkills = NAVI_SKILLS_BY_LEVEL.filter((s) => s.unlockLevel <= naviLevel);

  return (
    <div>
      <PageHeader title="NAVI" subtitle="// COMPANION STATUS">
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className="text-xs font-mono"
          >
            <Eye size={12} className="mr-1" /> {editMode ? "VIEW MODE" : "EDIT MODE"}
          </Button>
        )}
      </PageHeader>

      {/* Skin Preview Modal */}
      <Dialog open={!!previewSkin} onOpenChange={() => setPreviewSkin(null)}>
        <DialogContent className="sm:max-w-md bg-card border-primary/30 p-0 overflow-hidden">
          {previewSkin && (
            <div className="flex flex-col items-center p-6">
              <div className="w-56 h-56 rounded-lg bg-muted/30 border border-border flex items-center justify-center mb-4 overflow-hidden">
                <img src={getSkinUrl(previewSkin.name)} alt={previewSkin.name} className="w-full h-full object-contain drop-shadow-[0_0_16px_hsl(185,100%,50%,0.3)]" />
              </div>
              <h3 className="font-display text-lg text-primary font-bold">{previewSkin.name}</h3>
              <div className="flex gap-2 mt-1 mb-3">
                <span className="text-[10px] font-mono text-muted-foreground">{previewSkin.category}</span>
                <span className={`text-[10px] font-mono ${previewSkin.rarity === "LEGENDARY" ? "text-accent" : previewSkin.rarity === "EPIC" ? "text-secondary" : previewSkin.rarity === "RARE" ? "text-primary" : "text-muted-foreground"}`}>{previewSkin.rarity}</span>
              </div>
              {isSkinUnlocked(previewSkin.name) ? (
                <Button size="sm" onClick={() => handleEquipSkin(previewSkin.name)} className="font-mono text-xs">EQUIP SKIN</Button>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-mono text-muted-foreground flex items-center gap-1"><Lock size={10} /> LOCKED</p>
                  {unlockConditions[previewSkin.name] && (
                    <p className="text-[10px] font-mono text-primary flex items-center gap-1"><Trophy size={10} />{unlockConditions[previewSkin.name].description}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Navi Display — clickable to go to Navi AI chat */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-8"
      >
        <button
          onClick={() => navigate("/mavis")}
          className="w-40 h-40 rounded-full bg-primary/5 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative overflow-hidden cursor-pointer hover:border-primary/60 transition-all group"
          title="Open Navi AI Chat"
        >
          <img
            src={getSkinUrl(equippedSkin)}
            alt="NAVI companion"
            className="w-32 h-32 object-contain drop-shadow-[0_0_12px_hsl(185,100%,50%,0.4)] group-hover:scale-105 transition-transform"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
            <Wifi size={10} className="text-background" />
          </div>
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center">
            <MessageSquare size={24} className="text-primary opacity-0 group-hover:opacity-80 transition-opacity" />
          </div>
        </button>
        <h2 className="font-display text-lg text-primary font-bold text-glow-cyan">NAVI.EXE</h2>
        <p className="text-muted-foreground text-xs font-mono">LVL {naviLevel}/50 // SKIN: {equippedSkin}</p>
        <div className="w-48 mt-2">
          <ProgressBar value={naviLevel} max={50} variant="cyan" label="NAVI LEVEL" size="sm" />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-1 cursor-pointer hover:text-primary" onClick={() => navigate("/mavis")}>
          ▶ TAP TO CHAT WITH NAVI
        </p>
      </motion.div>

      {/* Personality Selector */}
      <HudCard title="PERSONALITY" icon={<Shield size={14} />} glow className="mb-4">
        <p className="text-[10px] font-mono text-muted-foreground mb-3">SELECT NAVI PERSONALITY TYPE</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {NAVI_PERSONALITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => updateProfile({ navi_personality: p.id })}
              className={`rounded border p-3 text-left transition-all ${
                profile.navi_personality === p.id
                  ? "border-primary/50 bg-primary/10 glow-subtle"
                  : "border-border bg-muted/20 hover:border-primary/30"
              }`}
            >
              <p className="text-xs font-display font-bold">{p.label}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.desc}</p>
            </button>
          ))}
        </div>
      </HudCard>

      {/* Bond Status + Navi Skills */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <HudCard title="BOND STATUS" icon={<Heart size={14} />} glow>
          <div className="space-y-3">
            <ProgressBar value={profile.bond_affection} max={100} variant="purple" label="AFFECTION" size="md" />
            <ProgressBar value={profile.bond_trust} max={100} variant="cyan" label="TRUST" size="md" />
            <ProgressBar value={profile.bond_loyalty} max={100} variant="green" label="LOYALTY" size="md" />
          </div>
          {editMode && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              <p className="text-[10px] font-mono text-muted-foreground">OWNER EDIT</p>
              {(["bond_affection", "bond_trust", "bond_loyalty"] as const).map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-20">{key.split("_")[1].toUpperCase()}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profile[key]}
                    onChange={(e) => updateProfile({ [key]: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs font-mono w-8">{profile[key]}</span>
                </div>
              ))}
            </div>
          )}
        </HudCard>

        <HudCard title="NAVI SKILLS" icon={<Zap size={14} />} glow>
          <p className="text-[10px] font-mono text-muted-foreground mb-2">
            {unlockedNaviSkills.length}/{NAVI_SKILLS_BY_LEVEL.length} SKILLS UNLOCKED
          </p>
          <div className="space-y-2.5">
            {NAVI_SKILLS_BY_LEVEL.map((skill) => {
              const unlocked = skill.unlockLevel <= naviLevel;
              const level = unlocked ? Math.min(Math.floor((naviLevel - skill.unlockLevel) / 2) + 1, skill.max) : 0;
              return (
                <div key={skill.name} className={unlocked ? "" : "opacity-40"}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-body flex items-center gap-1">
                      {!unlocked && <Lock size={10} />}
                      {skill.name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {unlocked ? `LVL ${level}/${skill.max}` : `UNLOCK @ LVL ${skill.unlockLevel}`}
                    </span>
                  </div>
                  <ProgressBar value={level} max={skill.max} variant="cyan" showValue={false} />
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{skill.desc}</p>
                </div>
              );
            })}
          </div>
          {editMode && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-[10px] font-mono text-muted-foreground mb-1">OWNER: SET NAVI LEVEL</p>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={naviLevel}
                  onChange={(e) => updateProfile({ navi_level: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8">{naviLevel}</span>
              </div>
            </div>
          )}
        </HudCard>
      </div>

      {/* Skin Locker */}
      <HudCard title="SKIN LOCKER" icon={<Sparkles size={14} />} glow className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-muted-foreground">{unlockedCount}/{ALL_SKINS.length} UNLOCKED • TAP TO PREVIEW</p>
          <Input placeholder="Search skins..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 h-7 text-xs bg-muted/50 border-border" />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button onClick={() => setSelectedCategory("ALL")} className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${selectedCategory === "ALL" ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/20"}`}>ALL ({ALL_SKINS.length})</button>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all ${selectedCategory === cat ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/20"}`}>{cat} ({ALL_SKINS.filter((s) => s.category === cat).length})</button>
          ))}
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filteredSkins.map((skin) => (
            <button key={skin.name} onClick={() => setPreviewSkin(skin)} className={`rounded border p-2 flex flex-col items-center gap-1.5 transition-all relative group ${RARITY_BORDER[skin.rarity]} ${RARITY_BG[skin.rarity]} ${equippedSkin === skin.name ? "ring-1 ring-primary" : ""} cursor-pointer hover:border-primary/60`}>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted/30 flex items-center justify-center">
                <img src={getSkinUrl(skin.name)} alt={skin.name} className={`w-full h-full object-contain ${!isSkinUnlocked(skin.name) ? "opacity-40 grayscale" : "drop-shadow-[0_0_6px_hsl(185,100%,50%,0.3)]"}`} loading="lazy" />
              </div>
              <p className="font-mono text-[8px] text-foreground leading-tight text-center truncate w-full">{skin.name}</p>
              <span className={`text-[7px] font-mono ${skin.rarity === "LEGENDARY" ? "text-accent" : skin.rarity === "EPIC" ? "text-secondary" : skin.rarity === "RARE" ? "text-primary" : "text-muted-foreground"}`}>{skin.rarity}</span>
              {equippedSkin === skin.name && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><Check size={8} className="text-primary-foreground" /></div>
              )}
            </button>
          ))}
        </div>
      </HudCard>
    </div>
  );
}
