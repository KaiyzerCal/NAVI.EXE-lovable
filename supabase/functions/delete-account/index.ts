import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Best-effort: remove this user's uploaded files. Uploads are namespaced
    // under `${user.id}/...` in this bucket, so listing that one folder is
    // safe and complete — unlike message-attachments, which is namespaced by
    // thread (shared with another user), so it's deliberately left alone.
    try {
      const { data: files } = await supabase.storage.from("mavis-media").list(userId);
      if (files && files.length > 0) {
        await supabase.storage.from("mavis-media").remove(files.map((f) => `${userId}/${f.name}`));
      }
    } catch {
      /* non-blocking — DB cleanup below is what actually matters */
    }

    // All user-owned rows across every table, in one transaction.
    const { error: dataError } = await supabase.rpc("delete_account_data", { p_user_id: userId });
    if (dataError) throw dataError;

    // Finally, the auth account itself — also invalidates all sessions.
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[delete-account] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
