// Static subclass unlock rules based on MBTI + character class
export interface SubclassRule {
  subclass: string;
  desc: string;
  mbtiTypes: string[];
}

export const SUBCLASS_RULES: Record<string, SubclassRule[]> = {
  Technomancer: [
    { subclass: "Architect", desc: "Master builder of digital systems and frameworks", mbtiTypes: ["INTJ", "INTP"] },
    { subclass: "Vanguard", desc: "Pioneer who pushes boundaries through innovation", mbtiTypes: ["ENTJ", "ENTP"] },
  ],
  Guardian: [
    { subclass: "Sentinel", desc: "Unwavering protector who holds the line", mbtiTypes: ["ISFJ", "ISTJ"] },
    { subclass: "Commander", desc: "Decisive leader who rallies and directs", mbtiTypes: ["ESFJ", "ESTJ"] },
  ],
  Rogue: [
    { subclass: "Infiltrator", desc: "Precision operative who finds every opening", mbtiTypes: ["ISTP", "ESTP"] },
    { subclass: "Phantom", desc: "Elusive presence that strikes from the shadows", mbtiTypes: ["ISFP", "ESFP"] },
  ],
  Sage: [
    { subclass: "Oracle", desc: "Deep seer who perceives patterns others miss", mbtiTypes: ["INFJ", "INFP"] },
    { subclass: "Herald", desc: "Inspiring voice that spreads wisdom and energy", mbtiTypes: ["ENFJ", "ENFP"] },
  ],
  Sorcerer: [
    { subclass: "Archmage", desc: "Supreme wielder of digital arcana", mbtiTypes: ["INTJ", "INTP"] },
    { subclass: "Battlemage", desc: "Combines raw power with tactical brilliance", mbtiTypes: ["ENTJ", "ENTP"] },
  ],
  Warrior: [
    { subclass: "Warden", desc: "Immovable defender with unshakeable resolve", mbtiTypes: ["ISFJ", "ISTJ"] },
    { subclass: "Warlord", desc: "Born leader on the front lines", mbtiTypes: ["ESFJ", "ESTJ"] },
  ],
  Alchemist: [
    { subclass: "Transmuter", desc: "Transforms raw data into potent solutions", mbtiTypes: ["INFJ", "INFP"] },
    { subclass: "Catalyst", desc: "Accelerates growth and change in all things", mbtiTypes: ["ENFJ", "ENFP"] },
  ],
  Healer: [
    { subclass: "Mender", desc: "Gentle restorer who heals through patience", mbtiTypes: ["ISFJ", "INFJ"] },
    { subclass: "Beacon", desc: "Radiates hope and lifts those around them", mbtiTypes: ["ESFJ", "ENFJ"] },
  ],
  Ranger: [
    { subclass: "Marksman", desc: "Precision striker with perfect aim", mbtiTypes: ["ISTP", "ISTJ"] },
    { subclass: "Scout", desc: "Pathfinder who reads the terrain ahead", mbtiTypes: ["ESTP", "ENTP"] },
  ],
  Assassin: [
    { subclass: "Shade", desc: "Silent operative who strikes unseen", mbtiTypes: ["ISTP", "INTP"] },
    { subclass: "Blade", desc: "Lightning-fast combatant who thrives on edge", mbtiTypes: ["ESTP", "ESFP"] },
  ],
  Paladin: [
    { subclass: "Crusader", desc: "Holy warrior who fights for justice", mbtiTypes: ["ISTJ", "ISFJ"] },
    { subclass: "Champion", desc: "Inspiring protector who leads by example", mbtiTypes: ["ESTJ", "ENFJ"] },
  ],
  Necromancer: [
    { subclass: "Revenant", desc: "Summons echoes of forgotten data", mbtiTypes: ["INTJ", "INFP"] },
    { subclass: "Wraith", desc: "Commands shadows and lost memories", mbtiTypes: ["INTP", "INFJ"] },
  ],
  Bard: [
    { subclass: "Virtuoso", desc: "Master performer who buffs through resonance", mbtiTypes: ["ISFP", "ESFP"] },
    { subclass: "Orator", desc: "Commands attention and inspires through words", mbtiTypes: ["ENFP", "ENFJ"] },
  ],
  Berserker: [
    { subclass: "Ravager", desc: "Unstoppable force of pure destruction", mbtiTypes: ["ESTP", "ISTP"] },
    { subclass: "Juggernaut", desc: "Overwhelming power that cannot be stopped", mbtiTypes: ["ESTJ", "ENTJ"] },
  ],
};

export function getSubclass(characterClass: string | null, mbtiType: string | null): { subclass: string; desc: string } | null {
  if (!characterClass || !mbtiType) return null;
  const rules = SUBCLASS_RULES[characterClass];
  if (!rules) return null;
  for (const rule of rules) {
    if (rule.mbtiTypes.includes(mbtiType)) {
      return { subclass: rule.subclass, desc: rule.desc };
    }
  }
  return null;
}
