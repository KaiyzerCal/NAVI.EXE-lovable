import { useAppData } from "@/contexts/AppDataContext";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription() {
  const { profile, updateProfile } = useAppData();
  const tier = (profile as any).subscription_tier ?? "free";
  const isPro = tier === "core" || tier === "power";
  const isFree = !isPro;
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

  return { tier, isPro, isFree, messageLimit, questLimit, checkMessageAllowed, incrementMessageCount, startCheckout };
}
