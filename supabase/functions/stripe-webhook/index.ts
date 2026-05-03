import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });
    event = stripe.webhooks.constructEvent(body, signature ?? "", webhookSecret);
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  async function setTier(userId: string, tier: "free" | "core") {
    await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
  }

  async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null;
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "invoice.payment_succeeded": {
        const obj = event.data.object as any;
        const customerId = obj.customer as string;
        const userId = await getUserIdFromCustomer(customerId);
        if (userId) await setTier(userId, "core");
        break;
      }
      case "customer.subscription.deleted":
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
        if (userId) await setTier(userId, "core");
        break;
      }
    }
  } catch (e) {
    console.error("Webhook processing error:", e);
    return new Response("Processing error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
