import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type AchievementCategory = "quests" | "journal" | "character" | "navi" | "streak" | "xp" | "general" | "custom";
export type AchievementRarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export interface Achievement {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlocked_at: string | null;
  threshold: number | null;
  icon: string;
  rarity: string;
  source: string;
  xp: number;
  created_at: string;
}

// The starter set now lives server-side in the seed_my_achievements() RPC
// (see migrations/20260805010000_fix_achievements_client_write_blocked.sql)
// since achievements RLS blocks direct client inserts.

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    (supabase as any)
      .rpc("seed_my_achievements")
      .then(({ data, error }: { data: Achievement[] | null; error: any }) => {
        if (error) { console.error("[useAchievements] load:", error); setLoading(false); return; }
        setAchievements((data as Achievement[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  const checkAchievements = useCallback(
    async (stats: {
      questsCompleted?: number;
      journalEntries?: number;
      currentStreak?: number;
      xpTotal?: number;
      operatorLevel?: number;
      naviLevel?: number;
      hasMbti?: boolean;
      hasSubClass?: boolean;
      chatMessages?: number;
      bondLevel?: number;
      hasMainQuestCompleted?: boolean;
      sideQuestsCompleted?: number;
    }) => {
      if (!user || achievements.length === 0) return;

      const toUnlock: string[] = [];

      for (const ach of achievements) {
        if (ach.unlocked) continue;
        let shouldUnlock = false;

        switch (ach.name) {
          case "First Mission": shouldUnlock = (stats.questsCompleted ?? 0) >= 1; break;
          case "Quest Runner": shouldUnlock = (stats.questsCompleted ?? 0) >= 10; break;
          case "Centurion": shouldUnlock = (stats.questsCompleted ?? 0) >= 100; break;
          case "Legendary Hunter": shouldUnlock = (stats.questsCompleted ?? 0) >= 500; break;
          case "Main Arc Complete": shouldUnlock = !!stats.hasMainQuestCompleted; break;
          case "Side Hustler": shouldUnlock = (stats.sideQuestsCompleted ?? 0) >= 5; break;
          case "First Entry": shouldUnlock = (stats.journalEntries ?? 0) >= 1; break;
          case "Chronicler": shouldUnlock = (stats.journalEntries ?? 0) >= 10; break;
          case "Archivist": shouldUnlock = (stats.journalEntries ?? 0) >= 50; break;
          case "Consistent": shouldUnlock = (stats.currentStreak ?? 0) >= 3; break;
          case "Week Warrior": shouldUnlock = (stats.currentStreak ?? 0) >= 7; break;
          case "Iron Will": shouldUnlock = (stats.currentStreak ?? 0) >= 30; break;
          case "Unbreakable": shouldUnlock = (stats.currentStreak ?? 0) >= 100; break;
          case "Power Up": shouldUnlock = (stats.xpTotal ?? 0) >= 1000; break;
          case "XP Grinder": shouldUnlock = (stats.xpTotal ?? 0) >= 10000; break;
          case "Max Power": shouldUnlock = (stats.xpTotal ?? 0) >= 100000; break;
          case "Calibrated": shouldUnlock = !!stats.hasMbti; break;
          case "Sub-Classed": shouldUnlock = !!stats.hasSubClass; break;
          case "Operator Lv10": shouldUnlock = (stats.operatorLevel ?? 0) >= 10; break;
          case "Operator Lv50": shouldUnlock = (stats.operatorLevel ?? 0) >= 50; break;
          case "Max Operator": shouldUnlock = (stats.operatorLevel ?? 0) >= 100; break;
          case "Jack In": shouldUnlock = (stats.chatMessages ?? 0) >= 1; break;
          case "Deep Link": shouldUnlock = (stats.chatMessages ?? 0) >= 100; break;
          case "Full Sync": shouldUnlock = (stats.bondLevel ?? 0) >= 10; break;
          case "Navi Lv10": shouldUnlock = (stats.naviLevel ?? 0) >= 10; break;
          case "Navi Lv50": shouldUnlock = (stats.naviLevel ?? 0) >= 50; break;
          case "Max Navi": shouldUnlock = (stats.naviLevel ?? 0) >= 100; break;
        }

        if (shouldUnlock) toUnlock.push(ach.id);
      }

      if (toUnlock.length === 0) return;

      const { data: unlocked, error } = await (supabase as any).rpc("unlock_my_achievements", { p_ids: toUnlock });
      if (error) { console.error("[useAchievements] unlock:", error); return; }
      const unlockedIds = new Set(((unlocked as Achievement[]) ?? []).map((a) => a.id));
      const now = new Date().toISOString();

      setAchievements((prev) =>
        prev.map((a) => (unlockedIds.has(a.id) ? { ...a, unlocked: true, unlocked_at: now } : a))
      );

      const names = achievements.filter((a) => unlockedIds.has(a.id)).map((a) => a.name);
      if (names.length > 0) toast({ title: "🏆 Achievement Unlocked!", description: names.join(", ") });
    },
    [user, achievements]
  );

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (!error && data) setAchievements(data as Achievement[]);
  }, [user]);

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
  };

  return { achievements, loading, checkAchievements, stats, refetch };
}
