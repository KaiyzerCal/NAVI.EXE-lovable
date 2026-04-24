export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: "bonding" | "quests" | "streaks" | "levels" | "exploration" | "social" | "hidden";
  hidden: boolean;
  xpReward: number;
  check: (state: AchievementState) => boolean;
}

export interface AchievementState {
  operatorLevel: number;
  naviLevel: number;
  currentStreak: number;
  longestStreak: number;
  questsCompleted: number;
  journalEntries: number;
  bondAffection: number;
  bondTrust: number;
  bondLoyalty: number;
  totalMessages: number;
  partySize: number;
  daysSinceJoined: number;
  mbtiSet: boolean;
  classSet: boolean;
  naviNameCustomized: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // ── BONDING ────────────────────────────────────────────────────────────────
  {
    id: "bond_25",
    name: "First Contact",
    description: "Reach 25 bond in any stat with NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 50,
    check: (s) => Math.max(s.bondAffection, s.bondTrust, s.bondLoyalty) >= 25,
  },
  {
    id: "bond_50",
    name: "Signal Established",
    description: "Reach 50 bond in all stats with NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 100,
    check: (s) => s.bondAffection >= 50 && s.bondTrust >= 50 && s.bondLoyalty >= 50,
  },
  {
    id: "bond_75",
    name: "Synchronized",
    description: "Reach 75 bond in all stats with NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 200,
    check: (s) => s.bondAffection >= 75 && s.bondTrust >= 75 && s.bondLoyalty >= 75,
  },
  {
    id: "bond_100",
    name: "Neural Link",
    description: "Reach max bond with NAVI — full resonance achieved",
    category: "bonding",
    hidden: false,
    xpReward: 500,
    check: (s) => s.bondAffection >= 100 && s.bondTrust >= 100 && s.bondLoyalty >= 100,
  },
  {
    id: "first_message",
    name: "Handshake",
    description: "Send your first message to NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 25,
    check: (s) => s.totalMessages >= 1,
  },
  {
    id: "messages_100",
    name: "Frequent Flyer",
    description: "Send 100 messages to NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 100,
    check: (s) => s.totalMessages >= 100,
  },
  {
    id: "messages_500",
    name: "Deep Channel",
    description: "Send 500 messages to NAVI",
    category: "bonding",
    hidden: false,
    xpReward: 250,
    check: (s) => s.totalMessages >= 500,
  },
  {
    id: "named_navi",
    name: "Christened",
    description: "Give your NAVI a custom name",
    category: "bonding",
    hidden: false,
    xpReward: 50,
    check: (s) => s.naviNameCustomized,
  },

  // ── QUESTS ─────────────────────────────────────────────────────────────────
  {
    id: "first_quest",
    name: "Boots On",
    description: "Complete your first quest",
    category: "quests",
    hidden: false,
    xpReward: 30,
    check: (s) => s.questsCompleted >= 1,
  },
  {
    id: "quests_10",
    name: "Field Operator",
    description: "Complete 10 quests",
    category: "quests",
    hidden: false,
    xpReward: 75,
    check: (s) => s.questsCompleted >= 10,
  },
  {
    id: "quests_25",
    name: "Veteran",
    description: "Complete 25 quests",
    category: "quests",
    hidden: false,
    xpReward: 150,
    check: (s) => s.questsCompleted >= 25,
  },
  {
    id: "quests_50",
    name: "Elite Operative",
    description: "Complete 50 quests",
    category: "quests",
    hidden: false,
    xpReward: 300,
    check: (s) => s.questsCompleted >= 50,
  },
  {
    id: "quest_master",
    name: "Quest Master",
    description: "Complete 100 quests",
    category: "quests",
    hidden: false,
    xpReward: 600,
    check: (s) => s.questsCompleted >= 100,
  },
  {
    id: "lone_wolf",
    name: "Lone Wolf",
    description: "Complete 10 quests without being in a party",
    category: "quests",
    hidden: true,
    xpReward: 150,
    check: (s) => s.questsCompleted >= 10 && s.partySize === 0,
  },

  // ── STREAKS ────────────────────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "On A Roll",
    description: "Maintain a 3-day streak",
    category: "streaks",
    hidden: false,
    xpReward: 30,
    check: (s) => s.longestStreak >= 3,
  },
  {
    id: "streak_7",
    name: "Weekly Warrior",
    description: "Maintain a 7-day streak",
    category: "streaks",
    hidden: false,
    xpReward: 75,
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: "streak_14",
    name: "Fortnight",
    description: "Maintain a 14-day streak",
    category: "streaks",
    hidden: false,
    xpReward: 150,
    check: (s) => s.longestStreak >= 14,
  },
  {
    id: "streak_30",
    name: "Monthly Operator",
    description: "Maintain a 30-day streak",
    category: "streaks",
    hidden: false,
    xpReward: 300,
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: "streak_100",
    name: "Unbreakable",
    description: "Maintain a 100-day streak",
    category: "streaks",
    hidden: false,
    xpReward: 1000,
    check: (s) => s.longestStreak >= 100,
  },
  {
    id: "streak_365",
    name: "Year One",
    description: "Maintain a 365-day streak",
    category: "streaks",
    hidden: true,
    xpReward: 5000,
    check: (s) => s.longestStreak >= 365,
  },

  // ── LEVELS ─────────────────────────────────────────────────────────────────
  {
    id: "op_level_5",
    name: "Initiated",
    description: "Reach Operator Level 5",
    category: "levels",
    hidden: false,
    xpReward: 50,
    check: (s) => s.operatorLevel >= 5,
  },
  {
    id: "op_level_10",
    name: "Calibrated",
    description: "Reach Operator Level 10",
    category: "levels",
    hidden: false,
    xpReward: 100,
    check: (s) => s.operatorLevel >= 10,
  },
  {
    id: "op_level_25",
    name: "Advancing",
    description: "Reach Operator Level 25",
    category: "levels",
    hidden: false,
    xpReward: 200,
    check: (s) => s.operatorLevel >= 25,
  },
  {
    id: "op_level_50",
    name: "Hardened",
    description: "Reach Operator Level 50",
    category: "levels",
    hidden: false,
    xpReward: 500,
    check: (s) => s.operatorLevel >= 50,
  },
  {
    id: "op_level_100",
    name: "Apex Operator",
    description: "Reach Operator Level 100 — the highest rank",
    category: "levels",
    hidden: false,
    xpReward: 5000,
    check: (s) => s.operatorLevel >= 100,
  },
  {
    id: "navi_level_10",
    name: "Syncing",
    description: "Reach NAVI Level 10",
    category: "levels",
    hidden: false,
    xpReward: 75,
    check: (s) => s.naviLevel >= 10,
  },
  {
    id: "navi_level_25",
    name: "Resonating",
    description: "Reach NAVI Level 25",
    category: "levels",
    hidden: false,
    xpReward: 200,
    check: (s) => s.naviLevel >= 25,
  },
  {
    id: "navi_level_50",
    name: "Deep Bond",
    description: "Reach NAVI Level 50",
    category: "levels",
    hidden: false,
    xpReward: 500,
    check: (s) => s.naviLevel >= 50,
  },
  {
    id: "sovereign",
    name: "Sovereign",
    description: "Reach NAVI Level 100 — the bond is complete",
    category: "levels",
    hidden: true,
    xpReward: 10000,
    check: (s) => s.naviLevel >= 100,
  },

  // ── EXPLORATION ────────────────────────────────────────────────────────────
  {
    id: "first_journal",
    name: "Log Entry",
    description: "Write your first journal entry",
    category: "exploration",
    hidden: false,
    xpReward: 25,
    check: (s) => s.journalEntries >= 1,
  },
  {
    id: "journal_10",
    name: "Chronicler",
    description: "Write 10 journal entries",
    category: "exploration",
    hidden: false,
    xpReward: 75,
    check: (s) => s.journalEntries >= 10,
  },
  {
    id: "journal_50",
    name: "Archivist",
    description: "Write 50 journal entries",
    category: "exploration",
    hidden: false,
    xpReward: 250,
    check: (s) => s.journalEntries >= 50,
  },
  {
    id: "mbti_set",
    name: "Self-Mapped",
    description: "Complete the MBTI personality quiz",
    category: "exploration",
    hidden: false,
    xpReward: 100,
    check: (s) => s.mbtiSet,
  },
  {
    id: "class_set",
    name: "Classed Up",
    description: "Choose your character class",
    category: "exploration",
    hidden: false,
    xpReward: 50,
    check: (s) => s.classSet,
  },
  {
    id: "veteran_7",
    name: "Old Timer",
    description: "Have an account for 7 days",
    category: "exploration",
    hidden: false,
    xpReward: 50,
    check: (s) => s.daysSinceJoined >= 7,
  },
  {
    id: "veteran_30",
    name: "Committed",
    description: "Have an account for 30 days",
    category: "exploration",
    hidden: false,
    xpReward: 150,
    check: (s) => s.daysSinceJoined >= 30,
  },

  // ── SOCIAL ─────────────────────────────────────────────────────────────────
  {
    id: "first_party",
    name: "Found Your Squad",
    description: "Join a party",
    category: "social",
    hidden: false,
    xpReward: 50,
    check: (s) => s.partySize > 0,
  },
  {
    id: "full_party",
    name: "Full Roster",
    description: "Be part of a party with 4+ members",
    category: "social",
    hidden: false,
    xpReward: 100,
    check: (s) => s.partySize >= 4,
  },

  // ── HIDDEN ─────────────────────────────────────────────────────────────────
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Send a message after midnight",
    category: "hidden",
    hidden: true,
    xpReward: 50,
    check: (_) => false, // Triggered server-side by time check
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Send a message before 6am",
    category: "hidden",
    hidden: true,
    xpReward: 50,
    check: (_) => false,
  },
  {
    id: "prolific",
    name: "Prolific",
    description: "Complete 5 quests in a single day",
    category: "hidden",
    hidden: true,
    xpReward: 150,
    check: (_) => false,
  },
];

export function checkAchievements(state: AchievementState, alreadyUnlocked: Set<string>): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.filter(
    (a) => !alreadyUnlocked.has(a.id) && a.check(state)
  );
}

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
}

export const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  bonding:     "BONDING",
  quests:      "QUESTS",
  streaks:     "STREAKS",
  levels:      "LEVELS",
  exploration: "EXPLORATION",
  social:      "SOCIAL",
  hidden:      "HIDDEN",
};
