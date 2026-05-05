import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";
import { useOwner } from "@/hooks/useOwner";

export type SubscriptionTier = "free" | "core" | "elite";

export function useSubscription() {
  const { profile, updateProfile, isReady, refetchProfile } = useAppData() as any;
  const isOwner = useOwner();

  const rawTier = (profile as any).subscription_tier ?? "free";
  // Admins/owners are always treated as elite regardless of DB value.
  const tier: SubscriptionTier = isOwner ? "elite" : (rawTier as SubscriptionTier);

  const isElite = tier === "elite";
  const isCore  = tier === "core" || isElite;
  const isPro   = isCore; // backwards-compat alias
  const isFree  = !isCore;
  const isActive = isCore;

  const loading = !isReady;
  const messageLimit = isFree ? 15 : Infinity;
  const questLimit   = isFree ? 3  : Infinity;

  async function checkMessageAllowed(): Promise<boolean> {
    if (isOwner || !isFree) return true;
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = (profile as any).message_count_reset_date;
    const count = (profile as any).daily_message_count ?? 0;
    if (resetDate !== today) {
      await updateProfile({ daily_message_count: 0, message_count_reset_date: today } as any);
      return true;
    }
    return count < messageLimit;
  }

  async function incrementMessageCount() {
    if (isOwner || !isFree) return;
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = (profile as any).message_count_reset_date;
    const count = (profile as any).daily_message_count ?? 0;
    const newCount = resetDate === today ? count + 1 : 1;
    await updateProfile({ daily_message_count: newCount, message_count_reset_date: today } as any);
  }

  async function startCheckout(checkoutTier: "core" | "elite" = "core") {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not logged in");

    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { tier: checkoutTier },
    });
    if (error) throw error;

    // Admin bypass — no payment needed
    if (data?.error === "admin_bypass") return;

    if (data?.url) window.location.href = data.url;
  }

  async function openPortal() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not logged in");

    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { environment: "live", returnUrl: window.location.origin + "/upgrade" },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  }

  async function refetch() {
    if (typeof refetchProfile === "function") await refetchProfile();
  }

  return {
    tier,
    isElite,
    isCore,
    isPro,
    isFree,
    isActive,
    isOwner,
    loading,
    refetch,
    messageLimit,
    questLimit,
    checkMessageAllowed,
    incrementMessageCount,
    startCheckout,
    openPortal,
  };
}
