export type SkinRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type SkinCategory = "ELEMENTAL" | "CLASS" | "MYTHIC" | "COSMIC" | "NATURE" | "TECH" | "SPECIAL";

export interface SkinDefinition {
  id: string;
  name: string;
  category: SkinCategory;
  rarity: SkinRarity;
  unlockCondition: string;
  unlockType: "default" | "level" | "navi_level" | "streak" | "quests" | "achievement" | "premium";
  unlockValue?: number;
  achievementId?: string;
}

export const RARITY_COLORS: Record<SkinRarity, string> = {
  COMMON:    "#94a3b8",
  UNCOMMON:  "#4ade80",
  RARE:      "#38bdf8",
  EPIC:      "#a78bfa",
  LEGENDARY: "#f97316",
};

export const RARITY_GLOW: Record<SkinRarity, string> = {
  COMMON:    "none",
  UNCOMMON:  "0 0 8px rgba(74,222,128,0.3)",
  RARE:      "0 0 10px rgba(56,189,248,0.35)",
  EPIC:      "0 0 12px rgba(167,139,250,0.4)",
  LEGENDARY: "0 0 16px rgba(249,115,22,0.5)",
};

export const SKIN_DEFINITIONS: SkinDefinition[] = [
  // ── ELEMENTAL ──────────────────────────────────────────────────────────────
  { id: "FLAMEBIRD",   name: "Flamebird",   category: "ELEMENTAL", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 5,  unlockCondition: "Reach Operator Level 5" },
  { id: "AQUACAT",     name: "Aquacat",     category: "ELEMENTAL", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 5,  unlockCondition: "Reach Operator Level 5" },
  { id: "THUNDERDOG",  name: "Thunderdog",  category: "ELEMENTAL", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 8,  unlockCondition: "Reach Operator Level 8" },
  { id: "CRYSTALFISH", name: "Crystalfish", category: "ELEMENTAL", rarity: "RARE",      unlockType: "level",      unlockValue: 12, unlockCondition: "Reach Operator Level 12" },
  { id: "SHADOWBUNNY", name: "Shadowbunny", category: "ELEMENTAL", rarity: "RARE",      unlockType: "streak",     unlockValue: 7,  unlockCondition: "Maintain a 7-day streak" },
  { id: "IRONBEAR",    name: "Ironbear",    category: "ELEMENTAL", rarity: "RARE",      unlockType: "quests",     unlockValue: 20, unlockCondition: "Complete 20 quests" },
  { id: "STORMDRAKE",  name: "Stormdrake",  category: "ELEMENTAL", rarity: "EPIC",      unlockType: "level",      unlockValue: 20, unlockCondition: "Reach Operator Level 20" },
  { id: "VENOMBUG",    name: "Venombug",    category: "ELEMENTAL", rarity: "RARE",      unlockType: "streak",     unlockValue: 14, unlockCondition: "Maintain a 14-day streak" },
  { id: "FROSTFOX",    name: "Frostfox",    category: "ELEMENTAL", rarity: "RARE",      unlockType: "level",      unlockValue: 15, unlockCondition: "Reach Operator Level 15" },
  { id: "EMBERCORE",   name: "Embercore",   category: "ELEMENTAL", rarity: "EPIC",      unlockType: "level",      unlockValue: 25, unlockCondition: "Reach Operator Level 25" },
  { id: "TIDECALLER",  name: "Tidecaller",  category: "ELEMENTAL", rarity: "EPIC",      unlockType: "navi_level", unlockValue: 20, unlockCondition: "Reach NAVI Level 20" },

  // ── CLASS ──────────────────────────────────────────────────────────────────
  { id: "NETOP",      name: "Netop",      category: "CLASS", rarity: "COMMON",   unlockType: "default",    unlockCondition: "Available from the start" },
  { id: "WARRIOR",    name: "Warrior",    category: "CLASS", rarity: "COMMON",   unlockType: "level",      unlockValue: 2,  unlockCondition: "Reach Operator Level 2" },
  { id: "GUARDIAN",   name: "Guardian",   category: "CLASS", rarity: "UNCOMMON", unlockType: "level",      unlockValue: 5,  unlockCondition: "Reach Operator Level 5" },
  { id: "PALADIN",    name: "Paladin",    category: "CLASS", rarity: "UNCOMMON", unlockType: "streak",     unlockValue: 5,  unlockCondition: "Maintain a 5-day streak" },
  { id: "BERSERKER",  name: "Berserker",  category: "CLASS", rarity: "RARE",     unlockType: "quests",     unlockValue: 10, unlockCondition: "Complete 10 quests" },
  { id: "SORCERER",   name: "Sorcerer",   category: "CLASS", rarity: "RARE",     unlockType: "navi_level", unlockValue: 10, unlockCondition: "Reach NAVI Level 10" },
  { id: "RANGER",     name: "Ranger",     category: "CLASS", rarity: "RARE",     unlockType: "level",      unlockValue: 10, unlockCondition: "Reach Operator Level 10" },
  { id: "NAVIGATOR",  name: "Navigator",  category: "CLASS", rarity: "RARE",     unlockType: "level",      unlockValue: 12, unlockCondition: "Reach Operator Level 12" },
  { id: "ROCKETEER",  name: "Rocketeer",  category: "CLASS", rarity: "EPIC",     unlockType: "level",      unlockValue: 18, unlockCondition: "Reach Operator Level 18" },
  { id: "ALCHEMIST",  name: "Alchemist",  category: "CLASS", rarity: "EPIC",     unlockType: "quests",     unlockValue: 30, unlockCondition: "Complete 30 quests" },
  { id: "SCHOLAR",    name: "Scholar",    category: "CLASS", rarity: "EPIC",     unlockType: "navi_level", unlockValue: 15, unlockCondition: "Reach NAVI Level 15" },

  // ── MYTHIC ─────────────────────────────────────────────────────────────────
  { id: "PHOENIX",    name: "Phoenix",    category: "MYTHIC", rarity: "EPIC",      unlockType: "level",      unlockValue: 30, unlockCondition: "Reach Operator Level 30" },
  { id: "LEVIATHAN",  name: "Leviathan",  category: "MYTHIC", rarity: "EPIC",      unlockType: "level",      unlockValue: 35, unlockCondition: "Reach Operator Level 35" },
  { id: "THUNDERGOD", name: "Thundergod", category: "MYTHIC", rarity: "EPIC",      unlockType: "streak",     unlockValue: 30, unlockCondition: "Maintain a 30-day streak" },
  { id: "BANSHEE",    name: "Banshee",    category: "MYTHIC", rarity: "EPIC",      unlockType: "level",      unlockValue: 40, unlockCondition: "Reach Operator Level 40" },
  { id: "GOLEM",      name: "Golem",      category: "MYTHIC", rarity: "EPIC",      unlockType: "quests",     unlockValue: 50, unlockCondition: "Complete 50 quests" },
  { id: "FROSTGIANT", name: "Frostgiant", category: "MYTHIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 50, unlockCondition: "Reach Operator Level 50" },
  { id: "SUNWYRM",    name: "Sunwyrm",    category: "MYTHIC", rarity: "LEGENDARY", unlockType: "navi_level", unlockValue: 30, unlockCondition: "Reach NAVI Level 30" },
  { id: "MOONWITCH",  name: "Moonwitch",  category: "MYTHIC", rarity: "LEGENDARY", unlockType: "achievement", achievementId: "bond_100", unlockCondition: "Reach max bond with NAVI" },
  { id: "TREANT",     name: "Treant",     category: "MYTHIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 60, unlockCondition: "Reach Operator Level 60" },
  { id: "RAGNAROK",   name: "Ragnarok",   category: "MYTHIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 75, unlockCondition: "Reach Operator Level 75" },

  // ── COSMIC ─────────────────────────────────────────────────────────────────
  { id: "STARDUST",   name: "Stardust",   category: "COSMIC", rarity: "RARE",      unlockType: "level",      unlockValue: 20, unlockCondition: "Reach Operator Level 20" },
  { id: "NEBULA",     name: "Nebula",     category: "COSMIC", rarity: "RARE",      unlockType: "level",      unlockValue: 25, unlockCondition: "Reach Operator Level 25" },
  { id: "XENOMORPH",  name: "Xenomorph",  category: "COSMIC", rarity: "EPIC",      unlockType: "quests",     unlockValue: 40, unlockCondition: "Complete 40 quests" },
  { id: "GALACTIC",   name: "Galactic",   category: "COSMIC", rarity: "EPIC",      unlockType: "level",      unlockValue: 30, unlockCondition: "Reach Operator Level 30" },
  { id: "COSMIC",     name: "Cosmic",     category: "COSMIC", rarity: "EPIC",      unlockType: "navi_level", unlockValue: 25, unlockCondition: "Reach NAVI Level 25" },
  { id: "VOIDWALKER", name: "Voidwalker", category: "COSMIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 45, unlockCondition: "Reach Operator Level 45" },
  { id: "UFOSIGNAL",  name: "UFO Signal", category: "COSMIC", rarity: "RARE",      unlockType: "streak",     unlockValue: 21, unlockCondition: "Maintain a 21-day streak" },
  { id: "SOLARIS",    name: "Solaris",    category: "COSMIC", rarity: "EPIC",      unlockType: "level",      unlockValue: 35, unlockCondition: "Reach Operator Level 35" },
  { id: "CELESTIAL",  name: "Celestial",  category: "COSMIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 55, unlockCondition: "Reach Operator Level 55" },
  { id: "GENESIS",    name: "Genesis",    category: "COSMIC", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 70, unlockCondition: "Reach Operator Level 70" },

  // ── NATURE ─────────────────────────────────────────────────────────────────
  { id: "LEAFSPIRIT", name: "Leafspirit", category: "NATURE", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 3,  unlockCondition: "Reach Operator Level 3" },
  { id: "GALEFORCE",  name: "Galeforce",  category: "NATURE", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 6,  unlockCondition: "Reach Operator Level 6" },
  { id: "BLOOMFAE",   name: "Bloomfae",   category: "NATURE", rarity: "UNCOMMON",  unlockType: "streak",     unlockValue: 3,  unlockCondition: "Maintain a 3-day streak" },
  { id: "PALMSHAMAN", name: "Palmshaman", category: "NATURE", rarity: "RARE",      unlockType: "quests",     unlockValue: 15, unlockCondition: "Complete 15 quests" },
  { id: "TEMPEST",    name: "Tempest",    category: "NATURE", rarity: "RARE",      unlockType: "level",      unlockValue: 10, unlockCondition: "Reach Operator Level 10" },
  { id: "MISTCLOUD",  name: "Mistcloud",  category: "NATURE", rarity: "RARE",      unlockType: "navi_level", unlockValue: 12, unlockCondition: "Reach NAVI Level 12" },
  { id: "SUNSHARD",   name: "Sunshard",   category: "NATURE", rarity: "RARE",      unlockType: "streak",     unlockValue: 10, unlockCondition: "Maintain a 10-day streak" },
  { id: "DEERLING",   name: "Deerling",   category: "NATURE", rarity: "EPIC",      unlockType: "level",      unlockValue: 22, unlockCondition: "Reach Operator Level 22" },
  { id: "OCELOT",     name: "Ocelot",     category: "NATURE", rarity: "EPIC",      unlockType: "quests",     unlockValue: 35, unlockCondition: "Complete 35 quests" },
  { id: "RAVEN",      name: "Raven",      category: "NATURE", rarity: "EPIC",      unlockType: "level",      unlockValue: 28, unlockCondition: "Reach Operator Level 28" },
  { id: "WOLF",       name: "Wolf",       category: "NATURE", rarity: "LEGENDARY", unlockType: "achievement", achievementId: "lone_wolf", unlockCondition: "Complete 10 quests solo without party" },

  // ── TECH ───────────────────────────────────────────────────────────────────
  { id: "CYBERCORE",  name: "Cybercore",  category: "TECH", rarity: "RARE",      unlockType: "level",      unlockValue: 8,  unlockCondition: "Reach Operator Level 8" },
  { id: "NETBOT",     name: "Netbot",     category: "TECH", rarity: "UNCOMMON",  unlockType: "level",      unlockValue: 4,  unlockCondition: "Reach Operator Level 4" },
  { id: "DATASTREAM", name: "Datastream", category: "TECH", rarity: "RARE",      unlockType: "navi_level", unlockValue: 8,  unlockCondition: "Reach NAVI Level 8" },
  { id: "BROADCAST",  name: "Broadcast",  category: "TECH", rarity: "RARE",      unlockType: "level",      unlockValue: 14, unlockCondition: "Reach Operator Level 14" },
  { id: "DNAWEAVER",  name: "DNA Weaver", category: "TECH", rarity: "EPIC",      unlockType: "level",      unlockValue: 32, unlockCondition: "Reach Operator Level 32" },
  { id: "MAGNETAR",   name: "Magnetar",   category: "TECH", rarity: "EPIC",      unlockType: "level",      unlockValue: 38, unlockCondition: "Reach Operator Level 38" },
  { id: "NEUROMIND",  name: "Neuromind",  category: "TECH", rarity: "LEGENDARY", unlockType: "navi_level", unlockValue: 40, unlockCondition: "Reach NAVI Level 40" },
  { id: "ATOMSPARK",  name: "Atomspark",  category: "TECH", rarity: "LEGENDARY", unlockType: "level",      unlockValue: 65, unlockCondition: "Reach Operator Level 65" },

  // ── SPECIAL ────────────────────────────────────────────────────────────────
  { id: "SOULBLADE",  name: "Soulblade",  category: "SPECIAL", rarity: "EPIC",      unlockType: "achievement", achievementId: "quest_master", unlockCondition: "Complete 100 quests" },
  { id: "HEARTBOND",  name: "Heartbond",  category: "SPECIAL", rarity: "EPIC",      unlockType: "achievement", achievementId: "bond_75",      unlockCondition: "Reach 75 bond in all stats with NAVI" },
  { id: "HEXCORE",    name: "Hexcore",    category: "SPECIAL", rarity: "LEGENDARY", unlockType: "level",       unlockValue: 80,               unlockCondition: "Reach Operator Level 80" },
  { id: "GEMSTONE",   name: "Gemstone",   category: "SPECIAL", rarity: "LEGENDARY", unlockType: "achievement", achievementId: "streak_100",   unlockCondition: "Maintain a 100-day streak" },
  { id: "STARMARK",   name: "Starmark",   category: "SPECIAL", rarity: "LEGENDARY", unlockType: "level",       unlockValue: 90,               unlockCondition: "Reach Operator Level 90" },
  { id: "EYEOFTRUTH", name: "Eye of Truth", category: "SPECIAL", rarity: "LEGENDARY", unlockType: "navi_level", unlockValue: 50,              unlockCondition: "Reach NAVI Level 50" },
  { id: "ORACLE",     name: "Oracle",     category: "SPECIAL", rarity: "LEGENDARY", unlockType: "level",       unlockValue: 95,               unlockCondition: "Reach Operator Level 95" },
  { id: "ANCHOR",     name: "Anchor",     category: "SPECIAL", rarity: "LEGENDARY", unlockType: "achievement", achievementId: "sovereign",    unlockCondition: "Reach NAVI Level 100" },
];

export interface UnlockState {
  operatorLevel: number;
  naviLevel: number;
  currentStreak: number;
  questsCompleted: number;
  unlockedAchievements: Set<string>;
  isPremium: boolean;
  isAdmin?: boolean;
}

export function isSkinUnlocked(skin: SkinDefinition, state: UnlockState): boolean {
  if (state.isAdmin) return true;
  if (skin.unlockType === "default") return true;
  if (skin.unlockType === "premium") return state.isPremium;
  if (skin.unlockType === "level") return state.operatorLevel >= (skin.unlockValue ?? 0);
  if (skin.unlockType === "navi_level") return state.naviLevel >= (skin.unlockValue ?? 0);
  if (skin.unlockType === "streak") return state.currentStreak >= (skin.unlockValue ?? 0);
  if (skin.unlockType === "quests") return state.questsCompleted >= (skin.unlockValue ?? 0);
  if (skin.unlockType === "achievement") return skin.achievementId ? state.unlockedAchievements.has(skin.achievementId) : false;
  return false;
}

export function getSkinById(id: string): SkinDefinition | undefined {
  return SKIN_DEFINITIONS.find((s) => s.id === id);
}

export function getSkinsByCategory(category: SkinCategory): SkinDefinition[] {
  return SKIN_DEFINITIONS.filter((s) => s.category === category);
}

export function getUnlockedSkins(state: UnlockState): SkinDefinition[] {
  return SKIN_DEFINITIONS.filter((s) => isSkinUnlocked(s, state));
}

export const SKIN_CATEGORIES: SkinCategory[] = ["CLASS", "ELEMENTAL", "NATURE", "TECH", "MYTHIC", "COSMIC", "SPECIAL"];
