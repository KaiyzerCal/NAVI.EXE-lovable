import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription() {
  const { profile, profileLoading, updateProfile, refetchProfile } = useAppData();
  const tier = (profile as any).subscription_tier ?? "free";
  const isPro = tier === "core" || tier === "power";
  const isFree = !isPro;
  // isActive/loading/refetch: subscription status lives on the profile row
  // (subscription_tier), so "is the subscription active" is just isPro, and
  // "refetch" means re-fetching that profile — there's no separate
  // subscription fetch of its own. CheckoutReturn.tsx polls refetch() after
  // a Stripe checkout to detect the webhook landing.
  const isActive = isPro;
  const loading = profileLoading;
  const refetch = refetchProfile;
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

  return { tier, isPro, isFree, isActive, loading, refetch, messageLimit, questLimit, checkMessageAllowed, incrementMessageCount, startCheckout };
}
