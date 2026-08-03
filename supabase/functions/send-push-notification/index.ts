import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

webpush.setVapidDetails(
  `mailto:${Deno.env.get("VAPID_SUBJECT") ?? "admin@navi.exe"}`,
  Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
  Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
);

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

    try {
      await webpush.sendNotification(sub.subscription, payload);
    } catch (pushError: any) {
      // 404/410 = the browser revoked/expired this endpoint — clear it so
      // future reminders stop retrying a dead subscription.
      if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("user_id", user_id);
        return new Response(JSON.stringify({ sent: false, reason: "subscription_expired" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw pushError;
    }

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
