import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tier definitions — prices come from Stripe dashboard env vars.
// Fallback price_data is used only when env vars are not yet configured (dev/staging).
const TIERS = {
  core: {
    priceIdEnv: "STRIPE_CORE_PRICE_ID",
    name: "Core Operator",
    description: "Unlimited quests · Unlimited AI · All 64 skins · Push notifications",
    amount: 799,
  },
  elite: {
    priceIdEnv: "STRIPE_ELITE_PRICE_ID",
    name: "Elite Operator",
    description: "Everything in Core + GPT-4o · Voice NAVI · Agent automation · Priority AI",
    amount: 1999,
  },
} as const;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    // Admins never need to check out — they already have full access.
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: user.id });
    if (isAdmin) {
      return new Response(
        JSON.stringify({ error: "admin_bypass", message: "Admins have full access — no payment required." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let requestedTier: "core" | "elite" = "core";
    try {
      const body = await req.json();
      if (body?.tier === "elite") requestedTier = "elite";
    } catch { /* no body is fine — defaults to core */ }

    const tierConfig = TIERS[requestedTier];

    // Resolve Stripe Price ID (env var preferred, fallback to inline price_data)
    const priceId = Deno.env.get(tierConfig.priceIdEnv);

    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";

    // Find or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name ?? user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    } else {
      // Ensure metadata has user ID (may be missing on old customers)
      const existing = customers.data[0];
      if (!existing.metadata?.supabase_user_id) {
        await stripe.customers.update(customerId, { metadata: { supabase_user_id: user.id } });
      }
    }

    // Build line items — use saved Price ID when available, inline otherwise
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceId
      ? [{ price: priceId, quantity: 1 }]
      : [{
          price_data: {
            currency: "usd",
            product_data: { name: tierConfig.name, description: tierConfig.description },
            unit_amount: tierConfig.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: lineItems,
      success_url: `${appUrl}/upgrade?success=1&tier=${requestedTier}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade?cancelled=1`,
      metadata: { supabase_user_id: user.id, tier: requestedTier },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-checkout-session]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
