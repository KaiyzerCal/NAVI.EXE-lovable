import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // This function sends push content to an arbitrary user_id — it must only ever
    // be reachable server-to-server (currently: daily-reminders, on a service-role
    // client). Reject anything not carrying the service role key as its bearer
    // token, otherwise any signed-up user could push arbitrary content to any
    // other user's device by guessing a user_id.
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerToken = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!serviceRoleKey || callerToken !== serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, title, body, url } = await req.json();

    const vapidPublicKey  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject    = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:admin@navi.exe";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ sent: false, reason: "vapid_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(`mailto:${vapidSubject}`, vapidPublicKey, vapidPrivateKey);

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

    const payload = JSON.stringify({
      title: `NAVI.EXE — ${title}`,
      body,
      url: url ?? "/",
    });

    await webpush.sendNotification(sub.subscription, payload);

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    // 410 Gone = subscription expired, silently skip
    if (msg.includes("410") || msg.includes("Gone")) {
      return new Response(JSON.stringify({ sent: false, reason: "subscription_expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
