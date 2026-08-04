import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

  let event: Stripe.Event;
  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" });
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  async function setTier(userId: string, tier: "free" | "core" | "elite") {
    await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
  }

  async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null;
  }

  // Every event handler below used to hardcode "core" regardless of which
  // tier was actually purchased — Elite subscribers were always downgraded
  // to Core on every lifecycle event. create-checkout-session now stamps
  // tier onto subscription_data.metadata at creation time (in addition to
  // the checkout session's own metadata), so it survives for the life of
  // the subscription across renewal/update/payment events, not just the
  // initial checkout.session.completed. Subscriptions created before this
  // fix won't have this metadata — default to "core" for those, matching
  // the previous (already-live) behavior rather than silently downgrading
  // existing subscribers.
  function tierFromSubscription(sub: Stripe.Subscription): "core" | "elite" {
    return sub.metadata?.tier === "elite" ? "elite" : "core";
  }

  // Single source of truth for subscription status/renewal/cancel-flag,
  // used by the "Manage Subscription" billing-portal button. stripe-webhook
  // previously only ever touched profiles.subscription_tier — this table
  // was populated by a completely separate, unused Stripe integration path,
  // so the portal button had no real data to work with for any actual
  // subscriber. Upserts by stripe_subscription_id since that's the only
  // stable identifier available across all these event types.
  async function upsertSubscriptionRow(sub: Stripe.Subscription, userId: string) {
    const price = sub.items.data[0]?.price;
    const row = {
      user_id: userId,
      stripe_customer_id: sub.customer as string,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: price?.id ?? "",
      product_id: (price?.product as string) ?? "",
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      environment: secretKey.startsWith("sk_live_") ? "live" : "test",
    };
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("subscriptions").update(row).eq("id", existing.id);
    } else {
      await supabase.from("subscriptions").insert(row);
    }
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (userId) {
          await upsertSubscriptionRow(sub, userId);
          if (sub.status === "active" || sub.status === "trialing") await setTier(userId, tierFromSubscription(sub));
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const obj = event.data.object as any;
        const customerId = obj.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId && typeof obj.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(obj.subscription);
          await setTier(userId, tierFromSubscription(sub));
        } else if (userId) {
          await setTier(userId, "core");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (userId) {
          await upsertSubscriptionRow(sub, userId);
          await setTier(userId, "free");
        }
        break;
      }
      case "invoice.payment_failed": {
        const obj = event.data.object as any;
        const customerId = obj.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setTier(userId, "free");
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (userId) {
          const tier = session.metadata?.tier === "elite" ? "elite" : "core";
          await setTier(userId, tier);
          if (typeof session.subscription === "string") {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            await upsertSubscriptionRow(sub, userId);
          }
        }
        break;
      }
    }
  } catch (e) {
    console.error("Webhook processing error:", e);
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
