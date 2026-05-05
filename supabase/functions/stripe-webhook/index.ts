import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed:", e);
    return new Response(`Webhook signature verification failed: ${e}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ── Helpers ──────────────────────────────────────────────────────────────────

  async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null;
  }

  // Map Stripe price ID → subscription tier.
  // Reads STRIPE_CORE_PRICE_ID and STRIPE_ELITE_PRICE_ID env vars.
  function tierFromPriceId(priceId: string | null | undefined): "core" | "elite" {
    const eliteId = Deno.env.get("STRIPE_ELITE_PRICE_ID");
    if (eliteId && priceId === eliteId) return "elite";
    return "core"; // default — any paid subscription that isn't elite is core
  }

  // Determine the tier from a subscription object.
  function tierFromSubscription(sub: Stripe.Subscription): "core" | "elite" {
    const priceId = sub.items.data[0]?.price?.id ?? null;
    return tierFromPriceId(priceId);
  }

  async function setTier(userId: string, tier: "free" | "core" | "elite") {
    // Never downgrade an admin.
    const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: userId });
    if (adminCheck) return;

    await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
    console.log(`[stripe-webhook] set tier=${tier} for user=${userId}`);
  }

  async function upsertSubscription(
    userId: string,
    sub: Stripe.Subscription,
    customerId: string
  ) {
    const tier = tierFromSubscription(sub);
    const status = sub.status;
    const priceId = sub.items.data[0]?.price?.id ?? null;
    const productId = sub.items.data[0]?.price?.product as string ?? null;

    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customerId,
        product_id: productId,
        price_id: priceId,
        status,
        tier,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        environment: "live",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" }
    );
  }

  // ── Event handling ───────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // Subscription created → activate tier
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (!userId) break;
        const tier = tierFromSubscription(sub);
        if (sub.status === "active" || sub.status === "trialing") {
          await setTier(userId, tier);
        }
        await upsertSubscription(userId, sub, sub.customer as string);
        break;
      }

      // Subscription updated → handle upgrades, downgrades, cancellations
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (!userId) break;
        const tier = tierFromSubscription(sub);
        if (sub.status === "active" || sub.status === "trialing") {
          await setTier(userId, tier);
        } else if (sub.status === "canceled" || sub.status === "unpaid") {
          await setTier(userId, "free");
        }
        await upsertSubscription(userId, sub, sub.customer as string);
        break;
      }

      // Subscription cancelled
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (userId) await setTier(userId, "free");
        await upsertSubscription(userId ?? "", sub, sub.customer as string);
        break;
      }

      // Successful payment — ensure tier is active (covers renewals)
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = (invoice as any).subscription as string | null;
        if (!subscriptionId) break;
        const userId = await getUserIdFromCustomer(customerId);
        if (!userId) break;
        // Retrieve full subscription to get price details
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const tier = tierFromSubscription(sub);
        await setTier(userId, tier);
        await upsertSubscription(userId, sub, customerId);
        break;
      }

      // Failed payment — leave tier as-is until subscription is fully canceled
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId) {
          console.warn(`[stripe-webhook] payment_failed for user=${userId} — tier unchanged until subscription cancels`);
        }
        break;
      }

      // Checkout completed (backup path — subscription events are more reliable)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;
        const requestedTier = (session.metadata?.tier ?? "core") as "core" | "elite";
        await setTier(userId, requestedTier);
        break;
      }

      default:
        // Ignore all other events
        break;
    }
  } catch (e) {
    console.error("[stripe-webhook] processing error:", e);
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
