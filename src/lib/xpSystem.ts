// ============================================================
// XP SYSTEM — Levels 1..100
// Per-level XP:    50 * L * (L + 1) / 2
// Cumulative XP:   25 * (L - 1) * L * (L + 1) / 3
// ============================================================

import {
  tierFromLevel,
  tierNameFromLevel,
  tierThreshold,
  nextTierThreshold,
  evolutionTitleFromMbtiAndLevel,
  classNameFromMbti,
  MBTI_CLASS_MAP,
  TIER_COLORS,
  TIER_NAMES,
  type Tier,
} from "./classEvolution";

const MIN_LEVEL = 1;
const MAX_LEVEL = 100;

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, Math.floor(n)));

/** XP required to advance FROM (level) TO (level + 1). */
export function xpRequiredForLevel(level: number): number {
  const L = clamp(level, MIN_LEVEL, MAX_LEVEL);
  return Math.floor((50 * L * (L + 1)) / 2);
}

/** Total XP needed to REACH this level from zero. Returns 0 for level 1. */
export function totalXpForLevel(level: number): number {
  const L = clamp(level, MIN_LEVEL, MAX_LEVEL);
  if (L <= 1) return 0;
  return Math.floor((25 * (L - 1) * L * (L + 1)) / 3);
}

/**
 * Returns the highest level whose totalXpForLevel(level) <= totalXp.
 * Uses binary search. Clamped between 1 and 100.
 */
export function levelFromTotalXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  let lo = MIN_LEVEL;
  let hi = MAX_LEVEL;
  let best = MIN_LEVEL;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (totalXpForLevel(mid) <= xp) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

/** XP still needed to reach the next level. */
export function xpToNextLevel(currentTotalXp: number): number {
  const xp = Math.max(0, Math.floor(currentTotalXp || 0));
  const lvl = levelFromTotalXp(xp);
  if (lvl >= MAX_LEVEL) return 0;
  return Math.max(0, totalXpForLevel(lvl + 1) - xp);
}

/** 0-100 percent progress through current level toward next. */
export function progressPercent(currentTotalXp: number): number {
  const xp = Math.max(0, Math.floor(currentTotalXp || 0));
  const lvl = levelFromTotalXp(xp);
  if (lvl >= MAX_LEVEL) return 100;
  const base = totalXpForLevel(lvl);
  const next = totalXpForLevel(lvl + 1);
  const span = next - base;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((xp - base) / span) * 100));
}

/** 0-100 percent progress through current TIER toward next tier threshold. */
export function tierProgressPercent(currentTotalXp: number): number {
  const xp = Math.max(0, Math.floor(currentTotalXp || 0));
  const lvl = levelFromTotalXp(xp);
  const t = tierFromLevel(lvl);
  if (t === 5) return 100;
  const tierStartLevel = tierThreshold(t);
  const tierEndLevel = nextTierThreshold(lvl);
  const tierStartXp = totalXpForLevel(tierStartLevel);
  const tierEndXp = totalXpForLevel(tierEndLevel);
  const span = tierEndXp - tierStartXp;
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((xp - tierStartXp) / span) * 100));
}

// ============================================================
// Re-exports — consumers import everything from xpSystem.
// ============================================================
export {
  tierFromLevel,
  tierNameFromLevel,
  tierThreshold,
  nextTierThreshold,
  evolutionTitleFromMbtiAndLevel,
  classNameFromMbti,
  MBTI_CLASS_MAP,
  TIER_COLORS,
  TIER_NAMES,
};
export type { Tier };
