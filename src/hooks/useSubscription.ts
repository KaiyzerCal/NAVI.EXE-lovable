import { useState, useEffect, useCallback } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionRecord {
  status: string;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const { profile, profileLoading, updateProfile, refetchProfile } = useAppData();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) { setSubscription(null); return; }
    const { data } = await supabase
      .from("subscriptions")
      .select("status, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data ?? null);
  }, [user]);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  const tier = (profile as any).subscription_tier ?? "free";
  const isPro = tier === "core" || tier === "power";
  const isFree = !isPro;
  // isActive derives from profile.subscription_tier (what the webhook sets on
  // checkout completion) — the `subscriptions` row above is only for display
  // (renewal date, cancel-at-period-end), not the access gate itself.
  // CheckoutReturn.tsx polls refetch() after a Stripe checkout to detect the
  // webhook landing.
  const isActive = isPro;
  const loading = profileLoading;
  const refetch = useCallback(async () => {
    await Promise.all([refetchProfile(), fetchSubscription()]);
  }, [refetchProfile, fetchSubscription]);
  const messageLimit = isFree ? 15 : Infinity;
  const questLimit = isFree ? 3 : Infinity;

  async function checkMessageAllowed(): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = (profile as any).message_count_reset_date;
    const count = (profile as any).daily_message_count ?? 0;

    if (resetDate !== today) {
      await updateProfile({ daily_message_count: 0, message_count_reset_date: today } as any);
      return true;
    }

    return isFree ? count < messageLimit : true;
  }

  async function incrementMessageCount() {
    const today = new Date().toISOString().slice(0, 10);
    const resetDate = (profile as any).message_count_reset_date;
    const count = (profile as any).daily_message_count ?? 0;
    const newCount = resetDate === today ? count + 1 : 1;
    await updateProfile({ daily_message_count: newCount, message_count_reset_date: today } as any);
  }

  async function startCheckout() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not logged in");

    const { data, error } = await supabase.functions.invoke("create-checkout-session", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  }

  return { tier, isPro, isFree, isActive, loading, refetch, subscription, messageLimit, questLimit, checkMessageAllowed, incrementMessageCount, startCheckout };
}
