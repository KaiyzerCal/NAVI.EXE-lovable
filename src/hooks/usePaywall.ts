import { useMemo } from "react";
import { useSubscription } from "@/hooks/useSubscription";

export const FREE_LIMITS = {
  MAX_ACTIVE_QUESTS: 3,
  DAILY_AI_MESSAGES: 15,
} as const;

export const FREE_SKINS = new Set([
  "NETOP",
  "GUARDIAN",
  "WOLF",
  "DEERLING",
  "SCHOLAR",
]);

export function usePaywall() {
  const { isOwner, isCore, isElite, isFree, tier, loading } = useSubscription();

  return useMemo(() => {
    // Owners/admins always have full access regardless of subscription tier.
    const hasFullAccess = isOwner || isCore;

    return {
      loading,
      isOwner,
      isCore,
      isElite,
      hasFullAccess,
      tier: hasFullAccess ? tier : "free" as const,
      canCreateQuest: (currentActiveQuests: number) =>
        hasFullAccess || currentActiveQuests < FREE_LIMITS.MAX_ACTIVE_QUESTS,
      canSendMessage: (todayCount: number) =>
        hasFullAccess || todayCount < FREE_LIMITS.DAILY_AI_MESSAGES,
      canEquipSkin: (skinName: string) =>
        hasFullAccess || FREE_SKINS.has(skinName.toUpperCase()),
      limits: FREE_LIMITS,
    };
  }, [isOwner, isCore, isElite, isFree, tier, loading]);
}
