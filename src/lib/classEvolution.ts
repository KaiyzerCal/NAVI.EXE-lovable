export type EvolutionTier = 1 | 2 | 3 | 4 | 5;

export interface MbtiClassInfo {
  className: string;
  desc: string;
  tiers: [string, string, string, string, string]; // T1–T5
}

export const TIER_NAMES: Record<EvolutionTier, string> = {
  1: "AWAKENING",
  2: "ASCENDING",
  3: "SOVEREIGN",
  4: "TRANSCENDENT",
  5: "LEGENDARY",
};

export const TIER_THRESHOLDS: Record<EvolutionTier, { min: number; max: number }> = {
  1: { min: 1,  max: 10  },
  2: { min: 11, max: 25  },
  3: { min: 26, max: 50  },
  4: { min: 51, max: 75  },
  5: { min: 76, max: 100 },
};

export const MBTI_CLASS_MAP: Record<string, MbtiClassInfo> = {
  INTJ: {
    className: "The Architect",
    desc: "The Architect — Strategic mastermind who bends systems to their will",
    tiers: ["Strategist Initiate", "Shadow Architect", "Sovereign Architect", "Grand Architect", "Architect Eternal"],
  },
  INTP: {
    className: "The Logician",
    desc: "The Logician — Curious thinker who transmutes knowledge into power",
    tiers: ["Logic Seeker", "System Theorist", "Infinite Logician", "Architect of Truth", "Logician Eternal"],
  },
  ENTJ: {
    className: "The Commander",
    desc: "The Commander — Born leader who conquers through force of will",
    tiers: ["Field Commander", "War Strategist", "Supreme Commander", "Warlord Sovereign", "Commander Eternal"],
  },
  ENTP: {
    className: "The Debater",
    desc: "The Debater — Inventive disruptor who thrives on creative chaos",
    tiers: ["Spark Catalyst", "Chaos Engineer", "Paradigm Breaker", "Reality Architect", "Debater Eternal"],
  },
  INFJ: {
    className: "The Advocate",
    desc: "The Advocate — Visionary who perceives hidden truths",
    tiers: ["Quiet Visionary", "Oracle Adept", "Sacred Advocate", "Sovereign Oracle", "Advocate Eternal"],
  },
  INFP: {
    className: "The Mediator",
    desc: "The Mediator — Idealist who shapes reality through imagination",
    tiers: ["Dream Walker", "Soul Weaver", "Eternal Mediator", "Keeper of Souls", "Mediator Eternal"],
  },
  ENFJ: {
    className: "The Protagonist",
    desc: "The Protagonist — Charismatic champion who inspires others",
    tiers: ["Voice of Change", "People's Champion", "Luminous Protagonist", "Sovereign of Hearts", "Protagonist Eternal"],
  },
  ENFP: {
    className: "The Campaigner",
    desc: "The Campaigner — Enthusiastic storyteller who energizes all",
    tiers: ["Spark Bearer", "Wildfire Spirit", "Boundless Campaigner", "Storm of Possibility", "Campaigner Eternal"],
  },
  ISTJ: {
    className: "The Logistician",
    desc: "The Logistician — Disciplined guardian of order and tradition",
    tiers: ["Order Keeper", "Iron Logistician", "Master of Systems", "Sovereign of Order", "Logistician Eternal"],
  },
  ISFJ: {
    className: "The Defender",
    desc: "The Defender — Devoted protector with quiet strength",
    tiers: ["Silent Guardian", "Steadfast Defender", "Eternal Protector", "Sovereign Shield", "Defender Eternal"],
  },
  ESTJ: {
    className: "The Executive",
    desc: "The Executive — Decisive organizer who leads with authority",
    tiers: ["Order Enforcer", "Command Executive", "Sovereign Executive", "Iron Chancellor", "Executive Eternal"],
  },
  ESFJ: {
    className: "The Consul",
    desc: "The Consul — Harmonizer who unites through empathy",
    tiers: ["Community Keeper", "Harmony Consul", "Grand Consul", "Sovereign of Bonds", "Consul Eternal"],
  },
  ISTP: {
    className: "The Virtuoso",
    desc: "The Virtuoso — Cool-headed operative who masters tools",
    tiers: ["Silent Tinkerer", "Edge Virtuoso", "Master Craftsman", "Sovereign Artisan", "Virtuoso Eternal"],
  },
  ISFP: {
    className: "The Adventurer",
    desc: "The Adventurer — Free spirit attuned to subtle beauty",
    tiers: ["Free Spirit", "Wild Adventurer", "Soul of the World", "Sovereign Wanderer", "Adventurer Eternal"],
  },
  ESTP: {
    className: "The Entrepreneur",
    desc: "The Entrepreneur — Bold risk-taker who charges into action",
    tiers: ["Street Operator", "Risk Architect", "Empire Builder", "Sovereign Disruptor", "Entrepreneur Eternal"],
  },
  ESFP: {
    className: "The Entertainer",
    desc: "The Entertainer — Vibrant performer who lives in the moment",
    tiers: ["Stage Spark", "Living Legend", "Eternal Entertainer", "Sovereign of Joy", "Entertainer Eternal"],
  },
};

export function tierFromLevel(level: number): EvolutionTier {
  if (level >= 76) return 5;
  if (level >= 51) return 4;
  if (level >= 26) return 3;
  if (level >= 11) return 2;
  return 1;
}

export function tierNameFromLevel(level: number): string {
  return TIER_NAMES[tierFromLevel(level)];
}

export function evolutionTitleFromMbtiAndLevel(mbti: string, level: number): string {
  const info = MBTI_CLASS_MAP[mbti.toUpperCase()];
  if (!info) return tierNameFromLevel(level);
  const tier = tierFromLevel(level);
  return info.tiers[tier - 1];
}
