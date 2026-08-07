import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Retrigger: the live deployment of this function had drifted to an old
// stub ("No AI provider available") that predates the real OpenAI
// tool-calling loop below — AgentPage.tsx now actually invokes this
// function after queueing a task, so it needs to be the real thing.

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

// Extracted from the OpenAI tool-calling loop so the same 5 tool
// implementations can also be called directly from the MCP tools/call
// path below — one implementation, two callers, instead of duplicating
// the create_quest/award_xp/etc. logic.
async function executeNaviTool(
  toolName: string,
  args: Record<string, any>,
  userId: string,
  sb: any,
): Promise<{ resultText: string; actionRecord: Record<string, unknown> | null }> {
  if (toolName === "create_quest" || toolName === "create_or_update_quest") {
    const { data: existing } = await sb.from("quests")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", args.name)
      .maybeSingle();

    if (existing) {
      await sb.from("quests").update({
        description: args.description,
        type: args.type ?? "Side",
        total: args.total ?? 1,
        xp_reward: args.xp_reward ?? 50,
      }).eq("id", existing.id);
      return { resultText: `Quest updated: ${args.name}`, actionRecord: { type: "update_quest", name: args.name } };
    }
    const { data: q } = await sb.from("quests").insert({
      user_id: userId,
      name: args.name,
      description: args.description,
      type: args.type ?? "Side",
      total: args.total ?? 1,
      xp_reward: args.xp_reward ?? 50,
    }).select("id").single();
    return {
      resultText: q ? `Quest created: ${args.name}` : "Failed to create quest",
      actionRecord: { type: "create_quest", name: args.name },
    };
  }

  if (toolName === "award_xp") {
    const { data: profile } = await sb.from("profiles")
      .select("operator_xp, xp_total")
      .eq("id", userId)
      .single();
    if (!profile) return { resultText: "Failed to award XP: profile not found", actionRecord: null };
    await sb.from("profiles").update({
      operator_xp: ((profile as any).operator_xp ?? 0) + args.amount,
      xp_total:    ((profile as any).xp_total ?? 0) + args.amount,
    }).eq("id", userId);
    return {
      resultText: `Awarded ${args.amount} XP${args.reason ? ` for: ${args.reason}` : ""}`,
      actionRecord: { type: "award_xp", amount: args.amount },
    };
  }

  if (toolName === "create_journal") {
    const { data: j } = await sb.from("journal_entries").insert({
      user_id:    userId,
      title:      args.title,
      content:    args.content,
      category:   args.category ?? "personal",
      importance: args.importance ?? "medium",
    }).select("id").single();
    return {
      resultText: j ? `Journal entry created: ${args.title}` : "Failed to create journal entry",
      actionRecord: { type: "create_journal", title: args.title },
    };
  }

  if (toolName === "create_skill") {
    const { data: s } = await sb.from("skills").insert({
      user_id:     userId,
      name:        args.name,
      description: args.description,
      category:    args.category ?? "General",
    }).select("id").single();
    return {
      resultText: s ? `Skill created: ${args.name}` : "Failed to create skill",
      actionRecord: { type: "create_skill", name: args.name },
    };
  }

  return { resultText: `Unknown tool: ${toolName}`, actionRecord: null };
}

// ── MCP (Model Context Protocol) server ─────────────────────────────────────
// Exposes the same 5 tools the OpenAI loop above already uses, over
// standard JSON-RPC 2.0 (initialize/tools/list/tools/call), so any MCP
// client can call them directly with the user's own Supabase access
// token instead of only through AgentPage.tsx's own queued-task flow.

const MCP_PROTOCOL_VERSION = "2026-07-28";

function mcpJson(data: unknown): Response {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleMcpRequest(
  body: Record<string, unknown>,
  userId: string,
  sb: any,
): Promise<Response> {
  const { method, params, id } = body as { method: string; params?: Record<string, unknown>; id?: unknown };

  if (method === "initialize") {
    return mcpJson({
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "navi-companion", version: "1.0.0" },
      },
    });
  }

  if (method === "notifications/initialized") {
    return new Response(null, { status: 202, headers: corsHeaders });
  }

  if (method === "tools/list") {
    return mcpJson({ jsonrpc: "2.0", id, result: { tools: NAVI_TOOLS.map((t) => ({ name: t.function.name, description: t.function.description, inputSchema: t.function.parameters })) } });
  }

  if (method === "tools/call") {
    const toolName = String(params?.name ?? "");
    const args = (params?.arguments ?? {}) as Record<string, any>;
    if (!NAVI_TOOLS.some((t) => t.function.name === toolName)) {
      return mcpJson({ jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${toolName}` } });
    }
    try {
      const { resultText } = await executeNaviTool(toolName, args, userId, sb);
      return mcpJson({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: resultText }] } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return mcpJson({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Error: ${msg}` }], isError: true } });
    }
  }

  return mcpJson({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });
}

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

    const body = await req.json();

    // ── MCP (Model Context Protocol) requests ──────────────────────────────
    // Auth (user) is already resolved above, so this reuses the exact same
    // trust boundary as the existing queued-task path below.
    if (body?.jsonrpc === "2.0" && typeof body?.method === "string") {
      return await handleMcpRequest(body, user.id, sb);
    }

    const { task_id } = body;
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

      // Execute each tool call — reuses executeNaviTool, the same
      // implementation the MCP tools/call path below calls.
      for (const tc of msg.tool_calls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments ?? "{}"); } catch { /* ignore */ }

        const { resultText, actionRecord } = await executeNaviTool(tc.function.name, args, user.id, sb);
        if (actionRecord) actionsExecuted.push(actionRecord);

        messages.push({ role: "tool", tool_call_id: tc.id, content: resultText });
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
