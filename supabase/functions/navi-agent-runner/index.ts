import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_SYSTEM_PROMPT = `You are NAVI, an autonomous agent executing a task on behalf of the operator.
Think step-by-step. Use the tools available to you to complete the task.
After completing all actions, summarize what you did in plain English for the operator.
Be concise. If you cannot complete part of the task, explain why.`;

const NAVI_TOOLS = [
  {
    type: "function",
    function: {
      name: "create_quest",
      description: "Create a new quest for the operator",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string" },
          description: { type: "string" },
          type:        { type: "string", enum: ["Daily","Weekly","Main","Side","Minor","Epic"] },
          total:       { type: "integer", description: "Total steps required" },
          xp_reward:   { type: "integer" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "award_xp",
      description: "Award XP to the operator",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "integer" },
          reason: { type: "string" },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_journal",
      description: "Create a journal entry for the operator",
      parameters: {
        type: "object",
        properties: {
          title:      { type: "string" },
          content:    { type: "string" },
          category:   { type: "string", enum: ["personal","business","legal","evidence","achievement"] },
          importance: { type: "string", enum: ["low","medium","high","critical"] },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_skill",
      description: "Create a new skill for the operator",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string" },
          description: { type: "string" },
          category:    { type: "string", enum: ["General","Combat","Knowledge","Social","Fitness","Creative","Technical"] },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_or_update_quest",
      description: "Idempotently create a quest or update an existing one matched by name",
      parameters: {
        type: "object",
        properties: {
          name:        { type: "string" },
          description: { type: "string" },
          type:        { type: "string" },
          xp_reward:   { type: "integer" },
          total:       { type: "integer" },
        },
        required: ["name"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const OPENAI_API_KEY    = Deno.env.get("OPENAI_API") ?? Deno.env.get("OPENAI_API_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await userClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { task_id } = await req.json();
    if (!task_id) {
      return new Response(JSON.stringify({ error: "Missing task_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: task, error: taskError } = await sb
      .from("agent_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("user_id", user.id)
      .single();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark in-progress
    await sb.from("agent_tasks").update({ status: "in_progress" }).eq("id", task_id);

    if (!OPENAI_API_KEY) {
      await sb.from("agent_tasks").update({ status: "failed", result: { error: "no openai key" } }).eq("id", task_id);
      return new Response(JSON.stringify({ error: "no openai key" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const messages: any[] = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      { role: "user",   content: `Task: ${(task as any).title}\n\n${(task as any).description ?? ""}` },
    ];

    const actionsExecuted: any[] = [];
    let finalSummary = "";

    // Agentic loop — up to 5 tool call rounds
    for (let i = 0; i < 5; i++) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, tools: NAVI_TOOLS, tool_choice: "auto" }),
      });

      if (!res.ok) break;
      const data = await res.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;

      if (!msg) break;
      messages.push(msg);

      if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
        finalSummary = msg.content ?? "Task complete.";
        break;
      }

      // Execute each tool call
      for (const tc of msg.tool_calls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments ?? "{}"); } catch { /* ignore */ }

        let toolResult = "";

        if (tc.function.name === "create_quest" || tc.function.name === "create_or_update_quest") {
          // Check for existing quest by name first
          const { data: existing } = await sb.from("quests")
            .select("id")
            .eq("user_id", user.id)
            .ilike("name", args.name)
            .maybeSingle();

          if (existing) {
            await sb.from("quests").update({
              description: args.description,
              type: args.type ?? "Side",
              total: args.total ?? 1,
              xp_reward: args.xp_reward ?? 50,
            }).eq("id", existing.id);
            toolResult = `Quest updated: ${args.name}`;
            actionsExecuted.push({ type: "update_quest", name: args.name });
          } else {
            const { data: q } = await sb.from("quests").insert({
              user_id: user.id,
              name: args.name,
              description: args.description,
              type: args.type ?? "Side",
              total: args.total ?? 1,
              xp_reward: args.xp_reward ?? 50,
            }).select("id").single();
            toolResult = q ? `Quest created: ${args.name}` : "Failed to create quest";
            actionsExecuted.push({ type: "create_quest", name: args.name });
          }
        }

        else if (tc.function.name === "award_xp") {
          const { data: profile } = await sb.from("profiles")
            .select("operator_xp, xp_total")
            .eq("id", user.id)
            .single();
          if (profile) {
            await sb.from("profiles").update({
              operator_xp: ((profile as any).operator_xp ?? 0) + args.amount,
              xp_total:    ((profile as any).xp_total ?? 0) + args.amount,
            }).eq("id", user.id);
            toolResult = `Awarded ${args.amount} XP${args.reason ? ` for: ${args.reason}` : ""}`;
            actionsExecuted.push({ type: "award_xp", amount: args.amount });
          }
        }

        else if (tc.function.name === "create_journal") {
          const { data: j } = await sb.from("journal_entries").insert({
            user_id:    user.id,
            title:      args.title,
            content:    args.content,
            category:   args.category ?? "personal",
            importance: args.importance ?? "medium",
          }).select("id").single();
          toolResult = j ? `Journal entry created: ${args.title}` : "Failed to create journal entry";
          actionsExecuted.push({ type: "create_journal", title: args.title });
        }

        else if (tc.function.name === "create_skill") {
          const { data: s } = await sb.from("skills").insert({
            user_id:     user.id,
            name:        args.name,
            description: args.description,
            category:    args.category ?? "General",
          }).select("id").single();
          toolResult = s ? `Skill created: ${args.name}` : "Failed to create skill";
          actionsExecuted.push({ type: "create_skill", name: args.name });
        }

        else {
          toolResult = `Unknown tool: ${tc.function.name}`;
        }

        messages.push({ role: "tool", tool_call_id: tc.id, content: toolResult });
      }
    }

    await sb.from("agent_tasks").update({
      status:       "completed",
      completed_at: new Date().toISOString(),
      result:       { summary: finalSummary, actions: actionsExecuted },
    }).eq("id", task_id);

    return new Response(JSON.stringify({ ok: true, summary: finalSummary, actions: actionsExecuted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[navi-agent-runner] error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { task_id } = await (req.clone().json().catch(() => ({ task_id: null })));
      if (task_id) await sb.from("agent_tasks").update({ status: "failed", result: { error: errMsg } }).eq("id", task_id);
    } catch { /* ignore cleanup errors */ }
    return new Response(JSON.stringify({ error: errMsg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
