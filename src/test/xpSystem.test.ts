import { describe, it, expect } from "vitest";
import {
  xpRequiredForLevel,
  totalXpForLevel,
  levelFromTotalXp,
  xpToNextLevel,
  progressPercent,
} from "@/lib/xpSystem";

describe("xpSystem", () => {
  it("level 1 requires no accumulated XP", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(levelFromTotalXp(0)).toBe(1);
  });

  it("xpRequiredForLevel follows 50*l*(l+1)/2", () => {
    expect(xpRequiredForLevel(1)).toBe(50);
    expect(xpRequiredForLevel(2)).toBe(150);
    expect(xpRequiredForLevel(3)).toBe(300);
  });

  it("totalXpForLevel is the cumulative sum of per-level costs", () => {
    // Level 3 total = cost(1) + cost(2) = 50 + 150 = 200
    expect(totalXpForLevel(3)).toBe(200);
  });

  it("levelFromTotalXp inverts totalXpForLevel at boundaries", () => {
    for (let lvl = 1; lvl <= 50; lvl++) {
      const atThreshold = totalXpForLevel(lvl);
      expect(levelFromTotalXp(atThreshold)).toBe(lvl);
      // One XP short stays on the previous level (for lvl > 1)
      if (lvl > 1) expect(levelFromTotalXp(atThreshold - 1)).toBe(lvl - 1);
    }
  });

  it("xpToNextLevel reaches zero exactly at a level threshold", () => {
    const t = totalXpForLevel(10);
    expect(xpToNextLevel(t)).toBe(totalXpForLevel(11) - t);
    expect(xpToNextLevel(totalXpForLevel(100))).toBe(0);
  });

  it("progressPercent stays within 0–100", () => {
    for (const xp of [0, 25, 199, 200, 5000, 999999]) {
      const p = progressPercent(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    }
  });

  it("caps at level 100", () => {
    expect(levelFromTotalXp(Number.MAX_SAFE_INTEGER)).toBe(100);
    expect(xpRequiredForLevel(100)).toBe(Infinity);
  });
});
