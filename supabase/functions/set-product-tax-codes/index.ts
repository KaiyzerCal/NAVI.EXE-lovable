// One-time bootstrap: assign tax codes to products so managed_payments works.
// Safe to call repeatedly — idempotent.
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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