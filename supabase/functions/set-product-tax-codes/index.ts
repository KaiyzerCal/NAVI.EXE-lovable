// One-time bootstrap: assign tax codes to products so managed_payments works.
// Safe to call repeatedly — idempotent. Restricted to owner-role callers.
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { corsHeadersFor, handlePreflight } from "../_shared/cors.ts";
import { requireOwner } from "../_shared/auth.ts";

// SaaS — Software as a Service
const SAAS_TAX_CODE = "txcd_10103001";

async function tagProduct(env: StripeEnv) {
  const stripe = createStripeClient(env);
  // navi_core was created via batch_create_product. Find it via metadata.lovable_external_id.
  const products = await stripe.products.list({ limit: 100 });
  const navi = products.data.find(
    (p: any) => p.metadata?.lovable_external_id === "navi_core",
  );
  if (!navi) return { found: false };
  if (navi.tax_code === SAAS_TAX_CODE) return { found: true, updated: false, id: navi.id };
  await stripe.products.update(navi.id, { tax_code: SAAS_TAX_CODE });
  return { found: true, updated: true, id: navi.id };
}

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const owner = await requireOwner(req);
  if (!owner) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const sandbox = await tagProduct("sandbox");
    let live: any = { skipped: true };
    try {
      live = await tagProduct("live");
    } catch (e) {
      live = { error: (e as Error).message };
    }
    return new Response(JSON.stringify({ sandbox, live }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
