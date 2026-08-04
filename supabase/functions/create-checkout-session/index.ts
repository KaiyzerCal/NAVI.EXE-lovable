import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";

    // Previously this always built a hardcoded Core session regardless of
    // what the client asked for — the request body was never read at all,
    // so "Upgrade to Elite" silently charged and granted Core. Read and
    // validate the requested tier instead.
    const body = await req.json().catch(() => ({}));
    const requestedTier = body?.tier === "elite" ? "elite" : "core";

    const TIER_PRICING: Record<"core" | "elite", { name: string; description: string; unit_amount: number }> = {
      core: {
        name: "Core Operator",
        description: "Unlimited quests · Unlimited AI · All 64 skins · Push notifications",
        unit_amount: 799,
      },
      elite: {
        name: "Elite Operator",
        description: "Everything in Core · GPT-4o NAVI · Voice NAVI · Agent automation · 2× currency earn rate · Exclusive Elite skins",
        unit_amount: 1999,
      },
    };
    const pricing = TIER_PRICING[requestedTier];

    // Check if customer already exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name ?? user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: pricing.name,
            description: pricing.description,
          },
          unit_amount: pricing.unit_amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      success_url: `${appUrl}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade?cancelled=1`,
      metadata: { supabase_user_id: user.id, tier: requestedTier },
      // Subscription-level metadata (distinct from the checkout session's
      // own metadata above) so later lifecycle events — renewal,
      // invoice.payment_succeeded, customer.subscription.updated — can
      // still tell which tier this subscription is for, since those events
      // don't carry the originating checkout session's metadata.
      subscription_data: { metadata: { supabase_user_id: user.id, tier: requestedTier } },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
