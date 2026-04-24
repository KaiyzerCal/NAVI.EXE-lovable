import { useMemo } from "react";
import { useOwner } from "@/hooks/useOwner";
import { useSubscription } from "@/hooks/useSubscription";

export const FREE_LIMITS = {
  MAX_ACTIVE_QUESTS: 3,
  DAILY_AI_MESSAGES: 15,
} as const;

/**
 * Starter skins available on the free tier. Everything else requires Core.
 * Owners/admins always have access to everything regardless of subscription.
 */
export const FREE_SKINS = new Set([
  "NETOP",
  "GUARDIAN",
  "WOLF",
  "DEERLING",
  "SCHOLAR",
]);

export function usePaywall() {
  const isOwner = useOwner();
  const { isActive, tier, loading } = useSubscription();

  return useMemo(() => {
    // Owners/admins/editors always have full access.
    const hasFullAccess = isOwner || isActive;
    return {
      loading,
      isOwner,
      isCore: isActive,
      hasFullAccess,
      tier: hasFullAccess ? ("core" as const) : tier,
      canCreateQuest: (currentActiveQuests: number) =>
        hasFullAccess || currentActiveQuests < FREE_LIMITS.MAX_ACTIVE_QUESTS,
      canSendMessage: (todayCount: number) =>
        hasFullAccess || todayCount < FREE_LIMITS.DAILY_AI_MESSAGES,
      canEquipSkin: (skinName: string) =>
        hasFullAccess || FREE_SKINS.has(skinName.toUpperCase()),
      limits: FREE_LIMITS,
    };
  }, [isOwner, isActive, tier, loading]);
}