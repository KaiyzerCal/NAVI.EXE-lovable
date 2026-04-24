import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStripeEnvironment } from "@/lib/stripe";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

function computeIsActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const stillInPeriod = !periodEnd || periodEnd > new Date();
  if (["active", "trialing", "past_due"].includes(sub.status) && stillInPeriod) return true;
  if (sub.status === "canceled" && periodEnd && periodEnd > new Date()) return true;
  return false;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const env = getStripeEnvironment();
    const { data } = await supabase
      .from("subscriptions" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as unknown as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Realtime: refetch on any subscriptions change for this user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const isActive = computeIsActive(subscription);
  const tier: "free" | "core" = isActive ? "core" : "free";

  return { subscription, isActive, tier, loading, refetch };
}