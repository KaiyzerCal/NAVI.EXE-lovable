import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal web push implementation using VAPID
async function sendWebPush(subscription: any, payload: string, vapidKeys: { publicKey: string; privateKey: string; subject: string }) {
  // Use the web-push compatible endpoint directly
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys?.p256dh;
  const auth = subscription.keys?.auth;

  if (!endpoint || !p256dh || !auth) throw new Error("Invalid subscription");

  // For simplicity, use a fetch to a push proxy or the endpoint directly
  // In production use the web-push npm package via esm.sh
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": payload.length.toString(),
    },
    body: payload,
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user_id, title, body, url } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id)
      .single();

    if (!sub?.subscription) {
      return new Response(JSON.stringify({ sent: false, reason: "no_subscription" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title: `NAVI.EXE — ${title}`, body, url: url ?? "/" });

    await sendWebPush(sub.subscription, payload, {
      publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
      privateKey: Deno.env.get("VAPID_PRIVATE_KEY") ?? "",
      subject: `mailto:${Deno.env.get("VAPID_SUBJECT") ?? "admin@navi.exe"}`,
    });

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
