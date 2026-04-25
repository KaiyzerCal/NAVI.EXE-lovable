import { tierFromLevel, tierNameFromLevel, evolutionTitleFromMbtiAndLevel, TIER_NAMES, TIER_THRESHOLDS } from "./classEvolution";

export type { EvolutionTier } from "./classEvolution";
export { tierFromLevel, tierNameFromLevel, evolutionTitleFromMbtiAndLevel, TIER_NAMES, TIER_THRESHOLDS };

// XP required to advance from `level` to `level + 1`.
// Formula: 50 * level * (level + 1) / 2
export function xpRequiredForLevel(level: number): number {
  if (level >= 100) return Infinity;
  const l = Math.max(1, Math.min(100, level));
  return Math.floor((50 * l * (l + 1)) / 2);
}

// Total XP accumulated to reach a given level from 0.
// Closed form: sum_{k=1}^{level-1} 50*k*(k+1)/2 = 25*(level-1)*level*(level+1)/3
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = Math.min(100, level) - 1;
  return Math.floor((25 * n * (n + 1) * (n + 2)) / 3);
}

// Derive the current level from accumulated XP. Binary search, O(log n).
export function levelFromTotalXp(totalXp: number): number {
  let lo = 1, hi = 100;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (totalXpForLevel(mid) <= totalXp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

// XP still needed to reach the next level from current accumulated XP.
export function xpToNextLevel(currentXp: number): number {
  const level = levelFromTotalXp(currentXp);
  if (level >= 100) return 0;
  return Math.max(0, totalXpForLevel(level + 1) - currentXp);
}

// Progress percentage (0–100) through the current level.
export function progressPercent(currentXp: number): number {
  const level = levelFromTotalXp(currentXp);
  if (level >= 100) return 100;
  const start = totalXpForLevel(level);
  const end = totalXpForLevel(level + 1);
  if (end === start) return 100;
  return Math.min(100, Math.floor(((currentXp - start) / (end - start)) * 100));
}

// XP needed to reach the next tier threshold from current level.
export function xpToNextTier(currentXp: number): number {
  const level = levelFromTotalXp(currentXp);
  const tier = tierFromLevel(level);
  if (tier >= 5) return 0;
  const nextTierMin = TIER_THRESHOLDS[(tier + 1) as 2 | 3 | 4 | 5].min;
  return Math.max(0, totalXpForLevel(nextTierMin) - currentXp);
}

// Progress percentage (0–100) through the current tier toward the next tier boundary.
export function tierProgressPercent(currentXp: number): number {
  const level = levelFromTotalXp(currentXp);
  const tier = tierFromLevel(level);
  const { min, max } = TIER_THRESHOLDS[tier];
  if (tier >= 5) return 100;
  const tierStart = totalXpForLevel(min);
  const tierEnd = totalXpForLevel(max + 1);
  if (tierEnd === tierStart) return 100;
  return Math.min(100, Math.floor(((currentXp - tierStart) / (tierEnd - tierStart)) * 100));
}
