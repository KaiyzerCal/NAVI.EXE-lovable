export type EvolutionTier = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20;

export interface MbtiClassInfo {
  className: string;
  desc: string;
  tiers: string[]; // exactly 20 entries
}

// Every 5 levels = one tier. tier = ceil(level / 5), clamped 1–20.
export function tierFromLevel(level: number): EvolutionTier {
  const clamped = Math.max(1, Math.min(100, level));
  return Math.ceil(clamped / 5) as EvolutionTier;
}

export const TIER_NAMES: Record<EvolutionTier, string> = {
  1:  "Initiate",
  2:  "Adept",
  3:  "Specialist",
  4:  "Vanguard",
  5:  "Ascendant",
  6:  "Elite",
  7:  "Warden",
  8:  "Paragon",
  9:  "Sovereign",
  10: "High Sovereign",
  11: "Mythic",
  12: "Transcendent",
  13: "Exalted",
  14: "Prime",
  15: "Eternal",
  16: "Celestial",
  17: "Empyrean",
  18: "Worldshaper",
  19: "Apex",
  20: "Legend Eternal",
};

// { min, max } for each tier — keeps backward compat with all consumers using .min / .max
export const TIER_THRESHOLDS: Record<EvolutionTier, { min: number; max: number }> = {
  1:  { min: 1,  max: 5  },
  2:  { min: 6,  max: 10 },
  3:  { min: 11, max: 15 },
  4:  { min: 16, max: 20 },
  5:  { min: 21, max: 25 },
  6:  { min: 26, max: 30 },
  7:  { min: 31, max: 35 },
  8:  { min: 36, max: 40 },
  9:  { min: 41, max: 45 },
  10: { min: 46, max: 50 },
  11: { min: 51, max: 55 },
  12: { min: 56, max: 60 },
  13: { min: 61, max: 65 },
  14: { min: 66, max: 70 },
  15: { min: 71, max: 75 },
  16: { min: 76, max: 80 },
  17: { min: 81, max: 85 },
  18: { min: 86, max: 90 },
  19: { min: 91, max: 95 },
  20: { min: 96, max: 100 },
};

export const TIER_COLORS: Record<EvolutionTier, string> = {
  1:  "#00E5FF",
  2:  "#00C8FF",
  3:  "#00AAFF",
  4:  "#0088FF",
  5:  "#7B2FFF",
  6:  "#9B3FFF",
  7:  "#BB4FFF",
  8:  "#CC60FF",
  9:  "#FFBF00",
  10: "#FFCF20",
  11: "#FFDF40",
  12: "#FF8C00",
  13: "#FF6B00",
  14: "#FF5500",
  15: "#FF3300",
  16: "#FF2D9B",
  17: "#FF1180",
  18: "#FF0066",
  19: "#FF0044",
  20: "#FF0022",
};

export const MBTI_CLASS_MAP: Record<string, MbtiClassInfo> = {
  INTJ: {
    className: "The Architect",
    desc: "The Architect — Strategic mastermind who bends systems to their will",
    tiers: [
      "Schemer", "Tactician", "Analyst", "Strategist", "Master Strategist",
      "Visionary", "Grand Analyst", "Grand Strategist", "Sovereign Strategist", "High Architect",
      "Mythic Planner", "Transcendent Planner", "Exalted Visionary", "Prime Architect", "Eternal Architect",
      "Celestial Planner", "Empyrean Architect", "Worldshaper", "Apex Architect", "Legend Architect",
    ],
  },
  ENTJ: {
    className: "The Commander",
    desc: "The Commander — Born leader who conquers through force of will",
    tiers: [
      "Enforcer", "Warlord", "Director", "Chancellor", "Grand Commander",
      "Elite Commander", "Warden of Power", "Paragon Commander", "Sovereign", "High Sovereign",
      "Mythic Commander", "Transcendent Warlord", "Exalted Chancellor", "Prime Conqueror", "Eternal Commander",
      "Celestial Warlord", "Empyrean Commander", "Worldbreaker", "Apex Commander", "Legend Commander",
    ],
  },
  INFJ: {
    className: "The Oracle",
    desc: "The Oracle — Visionary who perceives hidden truths",
    tiers: [
      "Counselor", "Seer", "Empath", "Visionary", "Ascendant Oracle",
      "Elite Advocate", "Warden of Souls", "Paragon Visionary", "Sovereign Oracle", "High Oracle",
      "Mythic Seer", "Transcendent Advocate", "Exalted Oracle", "Prime Visionary", "Eternal Oracle",
      "Celestial Seer", "Empyrean Advocate", "Worldshaper", "Apex Oracle", "Legend Oracle",
    ],
  },
  INFP: {
    className: "The Dreamer",
    desc: "The Dreamer — Idealist who shapes reality through imagination",
    tiers: [
      "Wanderer", "Idealist", "Soul Weaver", "Heart Keeper", "Ascendant Dreamer",
      "Elite Dreamer", "Warden of Dreams", "Paragon Idealist", "Sovereign Dreamer", "High Dreamer",
      "Mythic Dreamer", "Transcendent Soul", "Exalted Heart Keeper", "Prime Soul Weaver", "Eternal Dreamer",
      "Celestial Idealist", "Empyrean Soul", "Worldshaper", "Apex Dreamer", "Legend Dreamer",
    ],
  },
  ESTP: {
    className: "The Operator",
    desc: "The Operator — Bold risk-taker who charges into action",
    tiers: [
      "Risk Taker", "Disruptor", "Tactician", "Vanguard", "Ascendant Operator",
      "Elite Operator", "Warden of Chaos", "Paragon Disruptor", "Sovereign Operator", "High Operator",
      "Mythic Disruptor", "Transcendent Risk Taker", "Exalted Operator", "Prime Disruptor", "Eternal Operator",
      "Celestial Disruptor", "Empyrean Operator", "Empire Builder", "Apex Operator", "Legend Operator",
    ],
  },
  ENTP: {
    className: "The Innovator",
    desc: "The Innovator — Inventive disruptor who thrives on creative chaos",
    tiers: [
      "Debater", "Tinkerer", "Architect of Ideas", "Vanguard Thinker", "Ascendant Innovator",
      "Elite Innovator", "Warden of Ideas", "Paragon Debater", "Sovereign Innovator", "High Innovator",
      "Mythic Debater", "Transcendent Thinker", "Exalted Innovator", "Prime Debater", "Eternal Innovator",
      "Celestial Thinker", "Empyrean Innovator", "Worldshaper", "Apex Innovator", "Legend Innovator",
    ],
  },
  ISTJ: {
    className: "The Sentinel",
    desc: "The Sentinel — Disciplined guardian of order and tradition",
    tiers: [
      "Inspector", "Archivist", "Overseer", "Vanguard Sentinel", "Ascendant Inspector",
      "Elite Sentinel", "Warden of Order", "Paragon Inspector", "Sovereign Sentinel", "High Sentinel",
      "Mythic Inspector", "Transcendent Archivist", "Exalted Sentinel", "Prime Inspector", "Eternal Sentinel",
      "Celestial Inspector", "Empyrean Sentinel", "Worldkeeper", "Apex Inspector", "Legend Sentinel",
    ],
  },
  ESTJ: {
    className: "The Executive",
    desc: "The Executive — Decisive organizer who leads with authority",
    tiers: [
      "Supervisor", "Director", "Administrator", "Vanguard Executive", "Ascendant Director",
      "Elite Director", "Warden of Systems", "Paragon Executive", "Sovereign Director", "High Director",
      "Mythic Executive", "Transcendent Director", "Exalted Executive", "Prime Director", "Eternal Director",
      "Celestial Executive", "Empyrean Director", "Worldbuilder", "Apex Executive", "Legend Executive",
    ],
  },
  ISFJ: {
    className: "The Guardian",
    desc: "The Guardian — Devoted protector with quiet strength",
    tiers: [
      "Protector", "Defender", "Keeper", "Vanguard Guardian", "Ascendant Protector",
      "Elite Guardian", "Warden of Hearts", "Paragon Defender", "Sovereign Protector", "High Protector",
      "Mythic Guardian", "Transcendent Defender", "Exalted Protector", "Prime Guardian", "Eternal Protector",
      "Celestial Defender", "Empyrean Guardian", "Worldkeeper", "Apex Protector", "Legend Guardian",
    ],
  },
  ESFJ: {
    className: "The Provider",
    desc: "The Provider — Harmonizer who unites through empathy",
    tiers: [
      "Supporter", "Caretaker", "Benefactor", "Vanguard Provider", "Ascendant Caregiver",
      "Elite Supporter", "Warden of Community", "Paragon Provider", "Sovereign Caregiver", "High Caregiver",
      "Mythic Provider", "Transcendent Caregiver", "Exalted Provider", "Prime Supporter", "Eternal Caregiver",
      "Celestial Provider", "Empyrean Caregiver", "Worldshaper", "Apex Caregiver", "Legend Provider",
    ],
  },
  ISTP: {
    className: "The Craftsman",
    desc: "The Craftsman — Cool-headed operative who masters tools",
    tiers: [
      "Mechanic", "Operator", "Technician", "Vanguard Craftsman", "Ascendant Mechanic",
      "Elite Craftsman", "Warden of Tools", "Paragon Mechanic", "Sovereign Craftsman", "High Craftsman",
      "Mythic Mechanic", "Transcendent Craftsman", "Exalted Mechanic", "Prime Craftsman", "Eternal Craftsman",
      "Celestial Mechanic", "Empyrean Craftsman", "Worldbuilder", "Apex Craftsman", "Legend Craftsman",
    ],
  },
  ISFP: {
    className: "The Artist",
    desc: "The Artist — Free spirit attuned to subtle beauty",
    tiers: [
      "Wanderer", "Free Spirit", "Creator", "Vanguard Artist", "Ascendant Artist",
      "Elite Wanderer", "Warden of Beauty", "Paragon Free Spirit", "Sovereign Artist", "High Artist",
      "Mythic Artist", "Transcendent Wanderer", "Exalted Free Spirit", "Prime Artist", "Eternal Artist",
      "Celestial Wanderer", "Empyrean Artist", "Worldshaper", "Apex Artist", "Legend Artist",
    ],
  },
  ENFJ: {
    className: "The Mentor",
    desc: "The Mentor — Charismatic champion who inspires others",
    tiers: [
      "Teacher", "Inspirer", "Guide", "Vanguard Mentor", "Ascendant Mentor",
      "Elite Teacher", "Warden of Hearts", "Paragon Mentor", "Sovereign Mentor", "High Mentor",
      "Mythic Mentor", "Transcendent Teacher", "Exalted Mentor", "Prime Inspirer", "Eternal Mentor",
      "Celestial Teacher", "Empyrean Mentor", "Worldshaper", "Apex Mentor", "Legend Mentor",
    ],
  },
  ENFP: {
    className: "The Champion",
    desc: "The Champion — Enthusiastic storyteller who energizes all",
    tiers: [
      "Campaigner", "Spark", "Catalyst", "Vanguard Champion", "Ascendant Champion",
      "Elite Spark", "Warden of Possibility", "Paragon Campaigner", "Sovereign Champion", "High Champion",
      "Mythic Campaigner", "Transcendent Spark", "Exalted Champion", "Prime Campaigner", "Eternal Champion",
      "Celestial Spark", "Empyrean Champion", "Worldshaper", "Apex Champion", "Legend Champion",
    ],
  },
  INTP: {
    className: "The Logician",
    desc: "The Logician — Curious thinker who transmutes knowledge into power",
    tiers: [
      "Thinker", "Theorist", "Analyst", "Vanguard Logician", "Ascendant Logician",
      "Elite Theorist", "Warden of Logic", "Paragon Thinker", "Sovereign Logician", "High Thinker",
      "Mythic Logician", "Transcendent Theorist", "Exalted Thinker", "Prime Logician", "Eternal Thinker",
      "Celestial Logician", "Empyrean Thinker", "Worldshaper", "Apex Logician", "Legend Logician",
    ],
  },
  ESFP: {
    className: "The Entertainer",
    desc: "The Entertainer — Vibrant performer who lives in the moment",
    tiers: [
      "Performer", "Showman", "Energizer", "Vanguard Entertainer", "Ascendant Performer",
      "Elite Showman", "Warden of Joy", "Paragon Entertainer", "Sovereign Performer", "High Entertainer",
      "Mythic Showman", "Transcendent Entertainer", "Exalted Performer", "Prime Showman", "Eternal Entertainer",
      "Celestial Performer", "Empyrean Entertainer", "Worldshaper", "Apex Entertainer", "Legend Entertainer",
    ],
  },
};

export function tierNameFromLevel(level: number): string {
  return TIER_NAMES[tierFromLevel(level)];
}

export function evolutionTitleFromMbtiAndLevel(mbti: string, level: number): string {
  const info = MBTI_CLASS_MAP[mbti.toUpperCase()];
  if (!info) return tierNameFromLevel(level);
  const tier = tierFromLevel(level);
  return info.tiers[tier - 1] ?? tierNameFromLevel(level);
}

export function classNameFromMbti(mbti: string): string {
  return MBTI_CLASS_MAP[mbti?.toUpperCase()]?.className ?? "Operator";
}

export function tierThreshold(tier: EvolutionTier): number {
  return TIER_THRESHOLDS[tier].min;
}

export function nextTierThreshold(level: number): number {
  const tier = tierFromLevel(level);
  if (tier >= 20) return 100;
  return TIER_THRESHOLDS[(tier + 1) as EvolutionTier].min;
}
