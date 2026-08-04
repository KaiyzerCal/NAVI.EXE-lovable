// Owner-only admin API. All privileged reads/writes for the admin panel run
// here behind requireOwner(), using the service role. The client never gets
// broad table access.
import { corsHeadersFor, handlePreflight } from "../_shared/cors.ts";
import { requireOwner, serviceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const owner = await requireOwner(req);
  if (!owner) return json({ error: "Forbidden" }, 403);

  const db = serviceClient();

  try {
    const { action, payload } = (await req.json()) as {
      action: string;
      payload?: Record<string, unknown>;
    };

    switch (action) {
      case "list": {
        const [users, feedback, reported] = await Promise.all([
          db.from("profiles")
            .select("id, display_name, subscription_tier, beta_tester, operator_level, created_at")
            .order("created_at", { ascending: false }),
          db.from("beta_feedback").select("*").order("created_at", { ascending: false }).limit(100),
          db.from("reported_content").select("*").order("created_at", { ascending: false }).limit(100),
        ]);
        return json({
          users: users.data ?? [],
          feedback: feedback.data ?? [],
          reported: reported.data ?? [],
        });
      }

      case "toggle_beta": {
        const userId = String(payload?.userId ?? "");
        const value = Boolean(payload?.value);
        if (!userId) return json({ error: "userId required" }, 400);
        const { error } = await db.from("profiles").update({ beta_tester: value }).eq("id", userId);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "review_report": {
        const id = String(payload?.id ?? "");
        const actionTaken = String(payload?.action ?? "dismissed");
        if (!id) return json({ error: "id required" }, 400);
        const { error } = await db
          .from("reported_content")
          .update({ reviewed: true, action_taken: actionTaken })
          .eq("id", id);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      case "ban_user": {
        const userId = String(payload?.userId ?? "");
        if (!userId) return json({ error: "userId required" }, 400);
        if (userId === owner.id) return json({ error: "Cannot ban yourself" }, 400);
        const { error } = await db.auth.admin.deleteUser(userId);
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (e) {
    console.error("[admin] error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
