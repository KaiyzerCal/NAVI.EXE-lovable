import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("OPENAI_API_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { task_id } = await req.json();
    if (!task_id) return new Response(JSON.stringify({ error: "Missing task_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: task, error: taskError } = await sb
      .from("agent_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) return new Response(JSON.stringify({ error: "Task not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await sb.from("profiles")
      .select("display_name, operator_level, character_class, current_streak, xp_total")
      .eq("id", user.id).single();

    const systemPrompt = `You are NAVI Agent, an autonomous AI assistant for ${(profile as any)?.display_name ?? "an operator"} (Level ${(profile as any)?.operator_level ?? 1} ${(profile as any)?.character_class ?? ""}, ${(profile as any)?.current_streak ?? 0}-day streak).

Execute tasks efficiently with clear, actionable output. Be concise and practical. Structure your response with:
1. A brief assessment of the task
2. The actual output/result (plans, research, analysis, etc.)
3. Recommended next actions for the operator`;

    const userPrompt = `Task Type: ${(task as any).agent_type}\nTask: ${(task as any).title}\n${(task as any).description ? `Details: ${(task as any).description}` : ""}`;

    let output = "Task analysis complete. No AI provider available to generate response.";

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
            max_tokens: 1024,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          output = aiData.choices?.[0]?.message?.content ?? output;
        } else {
          const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
              max_tokens: 1024,
            }),
          });
          if (fallbackRes.ok) {
            const d = await fallbackRes.json();
            output = d.choices?.[0]?.message?.content ?? output;
          }
        }
      } catch (e) {
        console.error("[navi-agent-runner] AI call error:", e);
      }
    }

    await sb.from("agent_tasks").update({
      status: "completed",
      result: { output },
      completed_at: new Date().toISOString(),
    }).eq("id", task_id);

    return new Response(JSON.stringify({ output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[navi-agent-runner] error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
