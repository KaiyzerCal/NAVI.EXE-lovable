import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { corsHeadersFor, handlePreflight } from "../_shared/cors.ts";
import { getAuthedUser } from "../_shared/auth.ts";

interface CheckoutBody {
  priceId: string;
  quantity?: number;
  returnUrl: string;
  environment: StripeEnv;
  extraMetadata?: Record<string, string>;
  // Identity fields (userId / customerEmail) are derived server-side from the
  // caller's JWT and intentionally NOT read from the request body.
}

async function createCheckoutSession(
  options: CheckoutBody,
  identity: { userId: string; customerEmail: string | null },
) {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.priceId)) throw new Error("Invalid priceId");
  const stripe = createStripeClient(options.environment);

  const prices = await stripe.prices.list({ lookup_keys: [options.priceId] });
  if (!prices.data.length) throw new Error("Price not found");
  const stripePrice = prices.data[0];
  const isRecurring = stripePrice.type === "recurring";

  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: stripePrice.id, quantity: options.quantity || 1 }],
    mode: isRecurring ? "subscription" : "payment",
    ui_mode: "embedded",
    return_url: options.returnUrl,
    managed_payments: { enabled: true },
    ...(identity.customerEmail && { customer_email: identity.customerEmail }),
    metadata: { userId: identity.userId, managed_payments: "true", ...(options.extraMetadata ?? {}) },
    ...(isRecurring && { subscription_data: { metadata: { userId: identity.userId } } }),
  });

  return session.client_secret;
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    // Require an authenticated caller; derive identity from the JWT.
    const user = await getAuthedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CheckoutBody;
    if (!body?.priceId || !body?.returnUrl || !body?.environment) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const clientSecret = await createCheckoutSession(body, {
      userId: user.id,
      customerEmail: user.email,
    });
    return new Response(JSON.stringify({ clientSecret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[create-checkout] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
