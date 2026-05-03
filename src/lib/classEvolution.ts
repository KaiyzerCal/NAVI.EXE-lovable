export type EvolutionTier = number; // 1–20

export interface MbtiClassInfo {
  className: string;
  desc: string;
  tiers: string[]; // exactly 20 entries
}

const MAX_TIER = 20;

export const TIER_NAMES: Record<number, string> = {
  1: "AWAKENING",
  2: "ASCENDING",
  3: "RISING",
  4: "EMERGING",
  5: "TEMPERED",
  6: "VANGUARD",
  7: "SOVEREIGN",
  8: "PARAGON",
  9: "EXALTED",
  10: "HIGH",
  11: "MYTHIC",
  12: "TRANSCENDENT",
  13: "PRIME",
  14: "ETERNAL",
  15: "CELESTIAL",
  16: "EMPYREAN",
  17: "WORLDSHAPER",
  18: "APEX",
  19: "LEGEND",
  20: "ULTIMATE",
};

export const TIER_THRESHOLDS: Record<number, { min: number; max: number }> = (() => {
  const out: Record<number, { min: number; max: number }> = {};
  for (let t = 1; t <= MAX_TIER; t++) {
    const min = (t - 1) * 5 + 1;
    const max = t === MAX_TIER ? 100 : t * 5;
    out[t] = { min, max };
  }
  return out;
})();

// Color progression: cyan → violet → gold → orange → pink
export const TIER_COLORS: Record<number, string> = {
  1: "#00E5FF",
  2: "#3FA9FF",
  3: "#5C7DFF",
  4: "#7B2FFF",
  5: "#A855F7",
  6: "#C084FC",
  7: "#E0AAFF",
  8: "#FFD24A",
  9: "#FFBF00",
  10: "#FFA500",
  11: "#FF8C00",
  12: "#FF6B00",
  13: "#FF5722",
  14: "#FF4500",
  15: "#FF2D9B",
  16: "#FF1493",
  17: "#E91E63",
  18: "#FF00C8",
  19: "#FF00FF",
  20: "#FFFFFF",
};

export const MBTI_CLASS_MAP: Record<string, MbtiClassInfo> = {
  INTJ: {
    className: "The Architect",
    desc: "The Architect — Strategic mastermind who bends systems to their will",
    tiers: ["Schemer", "Tactician", "Analyst", "Strategist", "Master Strategist", "Visionary", "Grand Analyst", "Grand Strategist", "Sovereign Strategist", "High Architect", "Mythic Planner", "Transcendent Planner", "Exalted Visionary", "Prime Architect", "Eternal Architect", "Celestial Planner", "Empyrean Architect", "Worldshaper", "Apex Architect", "Legend Architect"],
  },
  INTP: {
    className: "The Logician",
    desc: "The Logician — Curious thinker who transmutes knowledge into power",
    tiers: ["Thinker", "Theorist", "Analyst", "Vanguard Logician", "Ascendant Logician", "Elite Theorist", "Warden of Logic", "Paragon Thinker", "Sovereign Logician", "High Thinker", "Mythic Logician", "Transcendent Theorist", "Exalted Thinker", "Prime Logician", "Eternal Thinker", "Celestial Logician", "Empyrean Thinker", "Worldshaper", "Apex Logician", "Legend Logician"],
  },
  ENTJ: {
    className: "The Commander",
    desc: "The Commander — Born leader who conquers through force of will",
    tiers: ["Enforcer", "Warlord", "Director", "Chancellor", "Grand Commander", "Elite Commander", "Warden of Power", "Paragon Commander", "Sovereign", "High Sovereign", "Mythic Commander", "Transcendent Warlord", "Exalted Chancellor", "Prime Conqueror", "Eternal Commander", "Celestial Warlord", "Empyrean Commander", "Worldbreaker", "Apex Commander", "Legend Commander"],
  },
  ENTP: {
    className: "The Debater",
    desc: "The Debater — Inventive disruptor who thrives on creative chaos",
    tiers: ["Debater", "Tinkerer", "Architect of Ideas", "Vanguard Thinker", "Ascendant Innovator", "Elite Innovator", "Warden of Ideas", "Paragon Debater", "Sovereign Innovator", "High Innovator", "Mythic Debater", "Transcendent Thinker", "Exalted Innovator", "Prime Debater", "Eternal Innovator", "Celestial Thinker", "Empyrean Innovator", "Worldshaper", "Apex Innovator", "Legend Innovator"],
  },
  INFJ: {
    className: "The Advocate",
    desc: "The Advocate — Visionary who perceives hidden truths",
    tiers: ["Counselor", "Seer", "Empath", "Visionary", "Ascendant Oracle", "Elite Advocate", "Warden of Souls", "Paragon Visionary", "Sovereign Oracle", "High Oracle", "Mythic Seer", "Transcendent Advocate", "Exalted Oracle", "Prime Visionary", "Eternal Oracle", "Celestial Seer", "Empyrean Advocate", "Worldshaper", "Apex Oracle", "Legend Oracle"],
  },
  INFP: {
    className: "The Mediator",
    desc: "The Mediator — Idealist who shapes reality through imagination",
    tiers: ["Wanderer", "Idealist", "Soul Weaver", "Heart Keeper", "Ascendant Dreamer", "Elite Dreamer", "Warden of Dreams", "Paragon Idealist", "Sovereign Dreamer", "High Dreamer", "Mythic Dreamer", "Transcendent Soul", "Exalted Heart Keeper", "Prime Soul Weaver", "Eternal Dreamer", "Celestial Idealist", "Empyrean Soul", "Worldshaper", "Apex Dreamer", "Legend Dreamer"],
  },
  ENFJ: {
    className: "The Protagonist",
    desc: "The Protagonist — Charismatic champion who inspires others",
    tiers: ["Teacher", "Inspirer", "Guide", "Vanguard Mentor", "Ascendant Mentor", "Elite Teacher", "Warden of Hearts", "Paragon Mentor", "Sovereign Mentor", "High Mentor", "Mythic Mentor", "Transcendent Teacher", "Exalted Mentor", "Prime Inspirer", "Eternal Mentor", "Celestial Teacher", "Empyrean Mentor", "Worldshaper", "Apex Mentor", "Legend Mentor"],
  },
  ENFP: {
    className: "The Campaigner",
    desc: "The Campaigner — Enthusiastic storyteller who energizes all",
    tiers: ["Campaigner", "Spark", "Catalyst", "Vanguard Champion", "Ascendant Champion", "Elite Spark", "Warden of Possibility", "Paragon Campaigner", "Sovereign Champion", "High Champion", "Mythic Campaigner", "Transcendent Spark", "Exalted Champion", "Prime Campaigner", "Eternal Champion", "Celestial Spark", "Empyrean Champion", "Worldshaper", "Apex Champion", "Legend Champion"],
  },
  ISTJ: {
    className: "The Logistician",
    desc: "The Logistician — Disciplined guardian of order and tradition",
    tiers: ["Inspector", "Archivist", "Overseer", "Vanguard Sentinel", "Ascendant Inspector", "Elite Sentinel", "Warden of Order", "Paragon Inspector", "Sovereign Sentinel", "High Sentinel", "Mythic Inspector", "Transcendent Archivist", "Exalted Sentinel", "Prime Inspector", "Eternal Sentinel", "Celestial Inspector", "Empyrean Sentinel", "Worldkeeper", "Apex Inspector", "Legend Sentinel"],
  },
  ISFJ: {
    className: "The Defender",
    desc: "The Defender — Devoted protector with quiet strength",
    tiers: ["Protector", "Defender", "Keeper", "Vanguard Guardian", "Ascendant Protector", "Elite Guardian", "Warden of Hearts", "Paragon Defender", "Sovereign Protector", "High Protector", "Mythic Guardian", "Transcendent Defender", "Exalted Protector", "Prime Guardian", "Eternal Protector", "Celestial Defender", "Empyrean Guardian", "Worldkeeper", "Apex Protector", "Legend Guardian"],
  },
  ESTJ: {
    className: "The Executive",
    desc: "The Executive — Decisive organizer who leads with authority",
    tiers: ["Supervisor", "Director", "Administrator", "Vanguard Executive", "Ascendant Director", "Elite Director", "Warden of Systems", "Paragon Executive", "Sovereign Director", "High Director", "Mythic Executive", "Transcendent Director", "Exalted Executive", "Prime Director", "Eternal Director", "Celestial Executive", "Empyrean Director", "Worldbuilder", "Apex Executive", "Legend Executive"],
  },
  ESFJ: {
    className: "The Consul",
    desc: "The Consul — Harmonizer who unites through empathy",
    tiers: ["Supporter", "Caretaker", "Benefactor", "Vanguard Provider", "Ascendant Caregiver", "Elite Supporter", "Warden of Community", "Paragon Provider", "Sovereign Caregiver", "High Caregiver", "Mythic Provider", "Transcendent Caregiver", "Exalted Provider", "Prime Supporter", "Eternal Caregiver", "Celestial Provider", "Empyrean Caregiver", "Worldshaper", "Apex Caregiver", "Legend Provider"],
  },
  ISTP: {
    className: "The Virtuoso",
    desc: "The Virtuoso — Cool-headed operative who masters tools",
    tiers: ["Mechanic", "Operator", "Technician", "Vanguard Craftsman", "Ascendant Mechanic", "Elite Craftsman", "Warden of Tools", "Paragon Mechanic", "Sovereign Craftsman", "High Craftsman", "Mythic Mechanic", "Transcendent Craftsman", "Exalted Mechanic", "Prime Craftsman", "Eternal Craftsman", "Celestial Mechanic", "Empyrean Craftsman", "Worldbuilder", "Apex Craftsman", "Legend Craftsman"],
  },
  ISFP: {
    className: "The Adventurer",
    desc: "The Adventurer — Free spirit attuned to subtle beauty",
    tiers: ["Wanderer", "Free Spirit", "Creator", "Vanguard Artist", "Ascendant Artist", "Elite Wanderer", "Warden of Beauty", "Paragon Free Spirit", "Sovereign Artist", "High Artist", "Mythic Artist", "Transcendent Wanderer", "Exalted Free Spirit", "Prime Artist", "Eternal Artist", "Celestial Wanderer", "Empyrean Artist", "Worldshaper", "Apex Artist", "Legend Artist"],
  },
  ESTP: {
    className: "The Entrepreneur",
    desc: "The Entrepreneur — Bold risk-taker who charges into action",
    tiers: ["Risk Taker", "Disruptor", "Tactician", "Vanguard", "Ascendant Operator", "Elite Operator", "Warden of Chaos", "Paragon Disruptor", "Sovereign Operator", "High Operator", "Mythic Disruptor", "Transcendent Risk Taker", "Exalted Operator", "Prime Disruptor", "Eternal Operator", "Celestial Disruptor", "Empyrean Operator", "Empire Builder", "Apex Operator", "Legend Operator"],
  },
  ESFP: {
    className: "The Entertainer",
    desc: "The Entertainer — Vibrant performer who lives in the moment",
    tiers: ["Performer", "Showman", "Energizer", "Vanguard Entertainer", "Ascendant Performer", "Elite Showman", "Warden of Joy", "Paragon Entertainer", "Sovereign Performer", "High Entertainer", "Mythic Showman", "Transcendent Entertainer", "Exalted Performer", "Prime Showman", "Eternal Entertainer", "Celestial Performer", "Empyrean Entertainer", "Worldshaper", "Apex Entertainer", "Legend Entertainer"],
  },
};

export function tierFromLevel(level: number): EvolutionTier {
  const lv = Math.max(1, Math.min(100, Math.floor(level || 1)));
  return Math.max(1, Math.min(MAX_TIER, Math.ceil(lv / 5)));
}

export function tierNameFromLevel(level: number): string {
  return TIER_NAMES[tierFromLevel(level)];
}

export function evolutionTitleFromMbtiAndLevel(mbti: string, level: number): string {
  const info = MBTI_CLASS_MAP[(mbti || "").toUpperCase()];
  if (!info) return tierNameFromLevel(level);
  const tier = tierFromLevel(level);
  return info.tiers[tier - 1] ?? tierNameFromLevel(level);
}

export function classNameFromMbti(mbti: string): string {
  return MBTI_CLASS_MAP[(mbti || "").toUpperCase()]?.className ?? "Operator";
}

export function tierThreshold(tier: number): number {
  const t = Math.max(1, Math.min(MAX_TIER, Math.floor(tier)));
  return TIER_THRESHOLDS[t].min;
}

export function nextTierThreshold(level: number): number {
  const tier = tierFromLevel(level);
  if (tier >= MAX_TIER) return 100;
  return TIER_THRESHOLDS[tier + 1].min;
}

