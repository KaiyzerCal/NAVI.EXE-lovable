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

const SYSTEM_ACHIEVEMENTS = [
  { name: "First Mission", description: "Complete your first quest", category: "quests", threshold: 1, icon: "🗡️", rarity: "COMMON" },
  { name: "Quest Runner", description: "Complete 10 quests", category: "quests", threshold: 10, icon: "⚔️", rarity: "COMMON" },
  { name: "Centurion", description: "Complete 100 quests", category: "quests", threshold: 100, icon: "🏆", rarity: "RARE" },
  { name: "Legendary Hunter", description: "Complete 500 quests", category: "quests", threshold: 500, icon: "👑", rarity: "EPIC" },
  { name: "Main Arc Complete", description: "Complete a Main quest", category: "quests", threshold: 1, icon: "⭐", rarity: "RARE" },
  { name: "Side Hustler", description: "Complete 5 Side quests", category: "quests", threshold: 5, icon: "🎯", rarity: "COMMON" },
  { name: "First Entry", description: "Write your first journal entry", category: "journal", threshold: 1, icon: "📖", rarity: "COMMON" },
  { name: "Chronicler", description: "Write 10 journal entries", category: "journal", threshold: 10, icon: "📚", rarity: "COMMON" },
  { name: "Archivist", description: "Write 50 journal entries", category: "journal", threshold: 50, icon: "🗂️", rarity: "RARE" },
  { name: "Consistent", description: "Maintain a 3-day streak", category: "streak", threshold: 3, icon: "🔥", rarity: "COMMON" },
  { name: "Week Warrior", description: "Maintain a 7-day streak", category: "streak", threshold: 7, icon: "💥", rarity: "RARE" },
  { name: "Iron Will", description: "Maintain a 30-day streak", category: "streak", threshold: 30, icon: "🌊", rarity: "EPIC" },
  { name: "Unbreakable", description: "Maintain a 100-day streak", category: "streak", threshold: 100, icon: "💎", rarity: "LEGENDARY" },
  { name: "Power Up", description: "Earn 1,000 total XP", category: "xp", threshold: 1000, icon: "⚡", rarity: "COMMON" },
  { name: "XP Grinder", description: "Earn 10,000 total XP", category: "xp", threshold: 10000, icon: "🌟", rarity: "RARE" },
  { name: "Max Power", description: "Earn 100,000 total XP", category: "xp", threshold: 100000, icon: "☀️", rarity: "LEGENDARY" },
  { name: "Calibrated", description: "Complete the MBTI personality quiz", category: "character", threshold: 1, icon: "🧠", rarity: "COMMON" },
  { name: "Sub-Classed", description: "Equip a sub-class", category: "character", threshold: 1, icon: "🎭", rarity: "COMMON" },
  { name: "Operator Lv10", description: "Reach operator level 10", category: "character", threshold: 10, icon: "🛡️", rarity: "RARE" },
  { name: "Operator Lv50", description: "Reach operator level 50", category: "character", threshold: 50, icon: "🌙", rarity: "EPIC" },
  { name: "Max Operator", description: "Reach operator level 100", category: "character", threshold: 100, icon: "🌌", rarity: "LEGENDARY" },
  { name: "Jack In", description: "Send your first message to NAVI", category: "navi", threshold: 1, icon: "🤖", rarity: "COMMON" },
  { name: "Deep Link", description: "Send 100 messages to NAVI", category: "navi", threshold: 100, icon: "💬", rarity: "RARE" },
  { name: "Full Sync", description: "Reach NAVI bond level 10", category: "navi", threshold: 10, icon: "🔗", rarity: "EPIC" },
  { name: "Navi Lv10", description: "Reach NAVI level 10", category: "navi", threshold: 10, icon: "✨", rarity: "RARE" },
  { name: "Navi Lv50", description: "Reach NAVI level 50", category: "navi", threshold: 50, icon: "🚀", rarity: "EPIC" },
  { name: "Max Navi", description: "Reach NAVI level 100", category: "navi", threshold: 100, icon: "🌠", rarity: "LEGENDARY" },
] as const;

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(async ({ data, error }) => {
        if (error) { console.error("[useAchievements] load:", error); setLoading(false); return; }

        if (!data || data.length === 0) {
          const toInsert = SYSTEM_ACHIEVEMENTS.map((a) => ({
            user_id: user.id,
            name: a.name,
            description: a.description,
            category: a.category,
            threshold: a.threshold,
            icon: a.icon,
            rarity: a.rarity,
            source: "system",
            unlocked: false,
          }));
          const { data: seeded } = await supabase
            .from("achievements")
            .insert(toInsert as any)
            .select();
          setAchievements((seeded as Achievement[]) ?? []);
        } else {
          setAchievements(data as Achievement[]);
        }
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

      const now = new Date().toISOString();
      for (const id of toUnlock) {
        await supabase
          .from("achievements")
          .update({ unlocked: true, unlocked_at: now } as any)
          .eq("id", id);
      }

      setAchievements((prev) =>
        prev.map((a) => (toUnlock.includes(a.id) ? { ...a, unlocked: true, unlocked_at: now } : a))
      );

      const names = achievements.filter((a) => toUnlock.includes(a.id)).map((a) => a.name);
      toast({ title: "🏆 Achievement Unlocked!", description: names.join(", ") });
    },
    [user, achievements]
  );

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter((a) => a.unlocked).length,
  };

  return { achievements, loading, checkAchievements, stats };
}
