import { useState } from "react";
import { Check, Loader2, Lock, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";

const FEATURES = [
  { free: "3 active quests", core: "Unlimited quests" },
  { free: "15 AI messages / day", core: "Unlimited AI conversations" },
  { free: "Starter Navi skins only", core: "All 60+ Navi skins unlocked" },
  { free: "Basic memory", core: "Long-term memory + omni-sync" },
  { free: "—", core: "Priority sync + early features" },
  { free: "—", core: "Beta channel access" },
];

export default function UpgradePage() {
  const { user } = useAuth();
  const { isActive, subscription, refetch } = useSubscription();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [portalLoading, setPortalLoading] = useState(false);

  const priceId = billing === "monthly" ? "navi_core_monthly" : "navi_core_annual";

  const handleUpgrade = () => {
    if (!user) return;
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/upgrade`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed");
      window.open(data.url as string, "_blank");
    } catch (e) {
      toast({
        title: "Could not open billing portal",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (isOpen && checkoutElement) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <PageHeader title="COMPLETE PURCHASE" subtitle="NAVI CORE — secure checkout" />
        {checkoutElement}
        <Button variant="ghost" onClick={closeCheckout} className="w-full">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <PageHeader
        title="UPGRADE OPERATOR"
        subtitle={isActive ? "NAVI CORE: ACTIVE" : "Unlock the full NAVI.EXE experience"}
      />

      {isActive && subscription ? (
        <Card className="p-6 border-primary/40 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="text-primary" />
            <div>
              <div className="font-mono font-bold">NAVI CORE</div>
              <div className="text-xs text-muted-foreground">
                Status: <span className="text-primary">{subscription.status}</span>
                {subscription.cancel_at_period_end && " — cancels at period end"}
              </div>
            </div>
            <Badge variant="default" className="ml-auto">ACTIVE</Badge>
          </div>
          {subscription.current_period_end && (
            <div className="text-xs text-muted-foreground mb-4">
              Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
            </div>
          )}
          <Button onClick={handleManage} disabled={portalLoading} variant="outline" className="w-full">
            {portalLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
            Manage subscription
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-md w-fit mx-auto">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded text-xs font-mono ${
                billing === "monthly" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-2 rounded text-xs font-mono ${
                billing === "annual" ? "bg-background shadow" : "text-muted-foreground"
              }`}
            >
              ANNUAL <Badge variant="secondary" className="ml-1">SAVE 17%</Badge>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="text-5xl font-bold font-mono text-primary">
              ${billing === "monthly" ? "7.99" : "79.99"}
              <span className="text-sm text-muted-foreground font-normal">
                /{billing === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">NAVI CORE — full access</div>
          </div>

          <Button onClick={handleUpgrade} size="lg" className="w-full mb-6 font-mono">
            UPGRADE TO CORE
          </Button>

          <div className="space-y-2 text-sm">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50">
                <Check className="text-primary shrink-0 mt-0.5" size={16} />
                <div className="flex-1">
                  <div className="font-medium">{f.core}</div>
                  {f.free !== "—" && (
                    <div className="text-xs text-muted-foreground">Free: {f.free}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Lock size={12} />
        Secure checkout — cancel anytime from billing portal.
      </div>
    </div>
  );
}