// ============================================================
// CLASS EVOLUTION SYSTEM
// 16 MBTI types × 5 evolution tiers
// ============================================================

export type Tier = 1 | 2 | 3 | 4 | 5;

export interface MbtiClassEntry {
  className: string;
  desc: string;
  tiers: [string, string, string, string, string]; // T1..T5 titles
}

export const MBTI_CLASS_MAP: Record<string, MbtiClassEntry> = {
  INTJ: {
    className: "The Architect",
    desc: "Strategic mastermind who bends systems to their will",
    tiers: [
      "Strategist Initiate",
      "Shadow Architect",
      "Sovereign Architect",
      "Grand Architect",
      "Architect Eternal",
    ],
  },
  INTP: {
    className: "The Logician",
    desc: "Curious thinker who transmutes knowledge into power",
    tiers: [
      "Logic Seeker",
      "System Theorist",
      "Infinite Logician",
      "Architect of Truth",
      "Logician Eternal",
    ],
  },
  ENTJ: {
    className: "The Commander",
    desc: "Born leader who conquers through force of will",
    tiers: [
      "Field Commander",
      "War Strategist",
      "Supreme Commander",
      "Warlord Sovereign",
      "Commander Eternal",
    ],
  },
  ENTP: {
    className: "The Debater",
    desc: "Inventive disruptor who thrives on creative chaos",
    tiers: [
      "Spark Catalyst",
      "Chaos Engineer",
      "Paradigm Breaker",
      "Reality Architect",
      "Debater Eternal",
    ],
  },
  INFJ: {
    className: "The Advocate",
    desc: "Visionary who perceives hidden truths",
    tiers: [
      "Quiet Visionary",
      "Oracle Adept",
      "Sacred Advocate",
      "Sovereign Oracle",
      "Advocate Eternal",
    ],
  },
  INFP: {
    className: "The Mediator",
    desc: "Idealist who shapes reality through imagination",
    tiers: [
      "Dream Walker",
      "Soul Weaver",
      "Eternal Mediator",
      "Keeper of Souls",
      "Mediator Eternal",
    ],
  },
  ENFJ: {
    className: "The Protagonist",
    desc: "Charismatic champion who inspires others",
    tiers: [
      "Voice of Change",
      "People's Champion",
      "Luminous Protagonist",
      "Sovereign of Hearts",
      "Protagonist Eternal",
    ],
  },
  ENFP: {
    className: "The Campaigner",
    desc: "Enthusiastic storyteller who energizes all",
    tiers: [
      "Spark Bearer",
      "Wildfire Spirit",
      "Boundless Campaigner",
      "Storm of Possibility",
      "Campaigner Eternal",
    ],
  },
  ISTJ: {
    className: "The Logistician",
    desc: "Disciplined guardian of order and tradition",
    tiers: [
      "Order Keeper",
      "Iron Logistician",
      "Master of Systems",
      "Sovereign of Order",
      "Logistician Eternal",
    ],
  },
  ISFJ: {
    className: "The Defender",
    desc: "Devoted protector with quiet strength",
    tiers: [
      "Silent Guardian",
      "Steadfast Defender",
      "Eternal Protector",
      "Sovereign Shield",
      "Defender Eternal",
    ],
  },
  ESTJ: {
    className: "The Executive",
    desc: "Decisive organizer who leads with authority",
    tiers: [
      "Order Enforcer",
      "Command Executive",
      "Sovereign Executive",
      "Iron Chancellor",
      "Executive Eternal",
    ],
  },
  ESFJ: {
    className: "The Consul",
    desc: "Harmonizer who unites through empathy",
    tiers: [
      "Community Keeper",
      "Harmony Consul",
      "Grand Consul",
      "Sovereign of Bonds",
      "Consul Eternal",
    ],
  },
  ISTP: {
    className: "The Virtuoso",
    desc: "Cool-headed operative who masters tools",
    tiers: [
      "Silent Tinkerer",
      "Edge Virtuoso",
      "Master Craftsman",
      "Sovereign Artisan",
      "Virtuoso Eternal",
    ],
  },
  ISFP: {
    className: "The Adventurer",
    desc: "Free spirit attuned to subtle beauty",
    tiers: [
      "Free Spirit",
      "Wild Adventurer",
      "Soul of the World",
      "Sovereign Wanderer",
      "Adventurer Eternal",
    ],
  },
  ESTP: {
    className: "The Entrepreneur",
    desc: "Bold risk-taker who charges into action",
    tiers: [
      "Street Operator",
      "Risk Architect",
      "Empire Builder",
      "Sovereign Disruptor",
      "Entrepreneur Eternal",
    ],
  },
  ESFP: {
    className: "The Entertainer",
    desc: "Vibrant performer who lives in the moment",
    tiers: [
      "Stage Spark",
      "Living Legend",
      "Eternal Entertainer",
      "Sovereign of Joy",
      "Entertainer Eternal",
    ],
  },
};

// ============================================================
// TIER COLORS — Used across UI for glows, borders, badges
// ============================================================
export const TIER_COLORS: Record<Tier, string> = {
  1: "#00E5FF", // cyan        — AWAKENING
  2: "#7B2FFF", // purple      — ASCENDING
  3: "#FFBF00", // amber       — SOVEREIGN
  4: "#FF6B00", // orange      — TRANSCENDENT
  5: "#FF2D9B", // pink/magenta — LEGENDARY
};

export const TIER_NAMES: Record<Tier, string> = {
  1: "AWAKENING",
  2: "ASCENDING",
  3: "SOVEREIGN",
  4: "TRANSCENDENT",
  5: "LEGENDARY",
};

const TIER_THRESHOLDS: Record<Tier, number> = {
  1: 1,
  2: 11,
  3: 26,
  4: 51,
  5: 76,
};

// ============================================================
// FUNCTIONS
// ============================================================

/** Returns the tier (1-5) for a given operator/navi level. */
export function tierFromLevel(level: number): Tier {
  if (level >= 76) return 5;
  if (level >= 51) return 4;
  if (level >= 26) return 3;
  if (level >= 11) return 2;
  return 1;
}

/** Returns the tier name for a given level. */
export function tierNameFromLevel(level: number): string {
  return TIER_NAMES[tierFromLevel(level)];
}

/** Returns the minimum level required for a given tier. */
export function tierThreshold(tier: Tier): number {
  return TIER_THRESHOLDS[tier];
}

/** Returns the level required to reach the NEXT tier. Returns 100 if already in tier 5. */
export function nextTierThreshold(level: number): number {
  const t = tierFromLevel(level);
  if (t === 5) return 100;
  return TIER_THRESHOLDS[(t + 1) as Tier];
}

/** Returns the title corresponding to a given MBTI type and level. */
export function evolutionTitleFromMbtiAndLevel(mbti: string, level: number): string {
  const entry = MBTI_CLASS_MAP[mbti?.toUpperCase?.() ?? ""];
  if (!entry) return "Operator";
  const t = tierFromLevel(level);
  return entry.tiers[t - 1] ?? "Operator";
}

/** Returns the className for an MBTI type. */
export function classNameFromMbti(mbti: string): string {
  const entry = MBTI_CLASS_MAP[mbti?.toUpperCase?.() ?? ""];
  return entry?.className ?? "Operator";
}
