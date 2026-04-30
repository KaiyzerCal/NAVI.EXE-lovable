import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { messages, profile } = body as {
      messages: Array<{ role: string; content: string }>;
      profile?: Record<string, any>;
    };

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return new Response(JSON.stringify({ error: "OpenAI key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build a condensed transcript (max 8000 chars)
    const transcript = messages
      .filter((m) => m.content?.trim())
      .map((m) => `${m.role === "user" ? "OPERATOR" : "NAVI"}: ${m.content.slice(0, 400)}`)
      .join("\n")
      .slice(0, 8000);

    const appContext = profile ? [
      `Operator Level: ${profile.operator_level ?? 1}`,
      `NAVI Level: ${profile.navi_level ?? 1}`,
      `Class: ${profile.character_class ?? "None"}`,
      `MBTI: ${profile.mbti_type ?? "Unknown"}`,
      `Streak: ${profile.current_streak ?? 0} days`,
      `Bond: Affection ${profile.bond_affection ?? 50} / Trust ${profile.bond_trust ?? 50} / Loyalty ${profile.bond_loyalty ?? 50}`,
    ].join(" | ") : "";

    // 1. AI compression — generate structured memory packet
    const compressionResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a memory compression engine for an AI companion system called NAVI.
Extract and compress the following conversation transcript into a structured memory packet.
Return ONLY valid JSON with this exact structure:
{
  "title": "one short memorable title for this session (max 10 words)",
  "summary": "2-3 sentence narrative summary of what happened — what the operator worked on, struggled with, decided, or revealed about themselves",
  "goals": ["list of explicit goals or intentions mentioned"],
  "insights": ["key things NAVI learned about this operator's personality, values, or patterns"],
  "struggles": ["things the operator is struggling with"],
  "decisions": ["important decisions the operator made"],
  "projects": ["specific projects or areas of focus mentioned"],
  "relationships": ["people mentioned and their relationship to the operator"],
  "mood": "dominant emotional tone of the session (one word)"
}
Only include arrays that have actual content. Empty arrays should still be included.
Context: ${appContext}`
          },
          { role: "user", content: `Compress this conversation:\n\n${transcript}` },
        ],
      }),
    });

    if (!compressionResp.ok) {
      const errText = await compressionResp.text();
      throw new Error(`OpenAI compression failed: ${errText}`);
    }

    const compressionData = await compressionResp.json();
    const rawPacket = JSON.parse(compressionData.choices[0].message.content);
    const title: string = rawPacket.title || "Memory Packet";
    const summary: string = rawPacket.summary || "Conversation compressed.";

    // 2. Generate embedding for semantic search
    let embedding: number[] | null = null;
    try {
      const embedText = `${title}. ${summary} ${(rawPacket.goals ?? []).join(". ")} ${(rawPacket.insights ?? []).join(". ")}`.slice(0, 3000);
      const embeddingResp = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({ model: "text-embedding-ada-002", input: embedText }),
      });
      if (embeddingResp.ok) {
        const embData = await embeddingResp.json();
        embedding = embData.data?.[0]?.embedding ?? null;
      }
    } catch (embErr) {
      console.error("[OmniSync] Embedding failed (non-fatal):", embErr);
    }

    // 3. Save to omni_memories
    const insertPayload: Record<string, any> = {
      user_id: user.id,
      title,
      summary,
      raw_packet: rawPacket,
    };
    if (embedding) insertPayload.embedding = JSON.stringify(embedding);

    const { data: memory, error: insertErr } = await supabase
      .from("omni_memories")
      .insert(insertPayload)
      .select("id, title, created_at")
      .single();

    if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`);

    return new Response(
      JSON.stringify({ success: true, memory }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[OmniSync] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
