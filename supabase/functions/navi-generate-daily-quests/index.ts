import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Profile {
  id: string;
  display_name: string | null;
  navi_name: string;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number;
  current_streak: number;
  xp_total: number;
  operator_xp: number;
  last_active: string | null;
}

interface Quest {
  name: string;
  description: string | null;
  updated_at: string;
}

interface JournalEntry {
  title: string;
  content: string;
}

interface GeneratedQuest {
  name: string;
  description: string;
  xp_reward: number;
  total: number;
}

interface Stats {
  processed: number;
  generated: number;
  skipped: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 50;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_DAILY_QUESTS_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp a number to [min, max] and ensure it is an integer.
 */
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * Truncate a string to maxLen characters.
 */
function truncate(value: unknown, maxLen: number, fallback: string): string {
  const s = typeof value === "string" ? value : fallback;
  return s.slice(0, maxLen);
}

/**
 * Build the journal context snippet — first 200 chars of combined titles + preview.
 */
function buildJournalSnippet(entries: JournalEntry[]): string {
  if (entries.length === 0) return "No recent journal entries.";
  return entries
    .map((e) => {
      const preview = (e.content ?? "").slice(0, 80).replace(/\n+/g, " ").trim();
      return `"${e.title}"${preview ? `: ${preview}` : ""}`;
    })
    .join(" | ");
}

/**
 * Parse GPT response text into exactly 3 GeneratedQuest objects.
 * Throws if the JSON is invalid or does not contain an array of >=3 items.
 */
function parseGptResponse(raw: string): GeneratedQuest[] {
  // Strip any accidental markdown code fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed) || parsed.length < 3) {
    throw new Error(`Expected array of 3 quests, got: ${JSON.stringify(parsed).slice(0, 200)}`);
  }

  return parsed.slice(0, 3).map((item: Record<string, unknown>, idx: number) => ({
    name: truncate(item.name, 60, `Daily Quest ${idx + 1}`),
    description: truncate(item.description, 150, ""),
    xp_reward: clampInt(item.xp_reward, 30, 100, 50),
    total: 1,
  }));
}

// ---------------------------------------------------------------------------
// GPT call
// ---------------------------------------------------------------------------

async function generateQuestsViaGPT(
  profile: Profile,
  completedQuests: Quest[],
  activeQuests: Quest[],
  journalEntries: JournalEntry[],
  openAiKey: string,
): Promise<GeneratedQuest[]> {
  const recentCompleted = completedQuests.map((q) => q.name).join(", ") || "None";
  const activeQuestNames = activeQuests.map((q) => q.name).join(", ") || "None";
  const journalSnippet = buildJournalSnippet(journalEntries);

  const prompt = `Operator: ${profile.display_name ?? "Unknown"} | Class: ${profile.character_class ?? "Unset"} | MBTI: ${profile.mbti_type ?? "Unknown"} | Level: ${profile.operator_level} | Streak: ${profile.current_streak} days
Recent completed quests: ${recentCompleted}
Active quests: ${activeQuestNames}
Recent journal themes: ${journalSnippet}

Generate 3 personalized Daily quests for today. Mix: 1 physical/health, 1 work/productivity, 1 personal growth. Match the operator's level and history.
Return a JSON array of exactly 3 quest objects with: name (string, max 60 chars), description (string, max 150 chars), xp_reward (number 30-100), total (1).
Only return valid JSON array, no markdown.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are NAVI, an AI companion in a gamified productivity app. You generate concise, motivating daily quests tailored to each operator's profile. Always respond with valid JSON only — no markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "(unreadable)");
    throw new Error(`OpenAI API error ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  if (!content) throw new Error("OpenAI returned empty content");

  return parseGptResponse(content);
}

// ---------------------------------------------------------------------------
// Per-operator processing
// ---------------------------------------------------------------------------

async function processOperator(
  supabase: ReturnType<typeof createClient>,
  profile: Profile,
  openAiKey: string,
  todayMidnightISO: string,
  stats: Stats,
): Promise<void> {
  const userId = profile.id;
  const naviName = profile.navi_name ?? "NAVI";

  try {
    // ---- 1. Skip if already has enough daily quests today ----
    const { data: todayQuests, error: todayErr } = await supabase
      .from("quests")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "Daily")
      .gte("created_at", todayMidnightISO)
      .limit(MIN_DAILY_QUESTS_THRESHOLD);

    if (todayErr) {
      console.error(`[navi-generate-daily-quests] Error checking today's quests for ${userId}:`, todayErr.message);
      stats.errors++;
      return;
    }

    if ((todayQuests?.length ?? 0) >= MIN_DAILY_QUESTS_THRESHOLD) {
      console.log(`[navi-generate-daily-quests] Skipping ${userId} — already has ${todayQuests!.length} daily quests today`);
      stats.skipped++;
      return;
    }

    // ---- 2. Fetch last 5 completed quests ----
    const { data: completedQuests, error: completedErr } = await supabase
      .from("quests")
      .select("name, description, updated_at")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (completedErr) {
      console.error(`[navi-generate-daily-quests] Error fetching completed quests for ${userId}:`, completedErr.message);
    }

    // ---- 3. Fetch last 3 active incomplete quests ----
    const { data: activeQuests, error: activeErr } = await supabase
      .from("quests")
      .select("name, description, updated_at")
      .eq("user_id", userId)
      .eq("completed", false)
      .order("updated_at", { ascending: false })
      .limit(3);

    if (activeErr) {
      console.error(`[navi-generate-daily-quests] Error fetching active quests for ${userId}:`, activeErr.message);
    }

    // ---- 4. Fetch last 2 journal entries ----
    const { data: journalEntries, error: journalErr } = await supabase
      .from("journal_entries")
      .select("title, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (journalErr) {
      console.error(`[navi-generate-daily-quests] Error fetching journal for ${userId}:`, journalErr.message);
    }

    // ---- 5. Call GPT ----
    let generatedQuests: GeneratedQuest[];
    try {
      generatedQuests = await generateQuestsViaGPT(
        profile,
        (completedQuests as Quest[]) ?? [],
        (activeQuests as Quest[]) ?? [],
        (journalEntries as JournalEntry[]) ?? [],
        openAiKey,
      );
    } catch (gptError) {
      const msg = gptError instanceof Error ? gptError.message : String(gptError);
      console.error(`[navi-generate-daily-quests] GPT error for ${userId}: ${msg}`);
      stats.errors++;
      return;
    }

    // ---- 6. Insert quests ----
    const questInserts = generatedQuests.map((q) => ({
      user_id: userId,
      name: q.name,
      description: q.description || null,
      type: "Daily",
      completed: false,
      progress: 0,
      total: 1,
      xp_reward: q.xp_reward,
      loot_description: "",
    }));

    const { error: insertQuestErr } = await supabase.from("quests").insert(questInserts);
    if (insertQuestErr) {
      console.error(`[navi-generate-daily-quests] Quest insert error for ${userId}:`, insertQuestErr.message);
      stats.errors++;
      return;
    }

    // ---- 7. Insert notification ----
    const { error: insertNotifErr } = await supabase.from("notifications").insert({
      user_id: userId,
      type: "QUEST_DUE",
      title: "Daily quests ready",
      body: `${naviName} generated 3 daily quests for you`,
      metadata: {},
    });

    if (insertNotifErr) {
      // Non-fatal — quests were already created; just log the notification failure
      console.error(`[navi-generate-daily-quests] Notification insert error for ${userId}:`, insertNotifErr.message);
    }

    console.log(`[navi-generate-daily-quests] ✓ Generated 3 daily quests for operator ${userId} (${profile.display_name ?? "Unknown"})`);
    stats.generated += 3;
    stats.processed++;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[navi-generate-daily-quests] Unexpected error for operator ${userId}: ${msg}`);
    stats.errors++;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (_req) => {
  const openAiKey = Deno.env.get("OPENAI_API") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!openAiKey) {
    console.error("[navi-generate-daily-quests] OPENAI_API env var is not set");
    return new Response(JSON.stringify({ error: "Missing OPENAI_API env var" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  // Today midnight UTC (start of current day)
  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setUTCHours(0, 0, 0, 0);
  const todayMidnightISO = todayMidnight.toISOString();

  // 7-day activity cutoff
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();

  const stats: Stats = { processed: 0, generated: 0, skipped: 0, errors: 0 };

  // Fetch all active operators (last_active within 7 days)
  const { data: profiles, error: profilesErr } = await supabase
    .from("profiles")
    .select(
      "id, display_name, navi_name, character_class, mbti_type, operator_level, current_streak, xp_total, operator_xp, last_active",
    )
    .gte("last_active", sevenDaysAgo)
    .not("last_active", "is", null);

  if (profilesErr) {
    console.error("[navi-generate-daily-quests] Failed to fetch profiles:", profilesErr.message);
    return new Response(JSON.stringify({ error: "Failed to fetch profiles", detail: profilesErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const operators = (profiles as Profile[]) ?? [];
  console.log(`[navi-generate-daily-quests] Processing ${operators.length} active operators in batches of ${BATCH_SIZE}`);

  // Process in batches of BATCH_SIZE with a BATCH_DELAY_MS pause between batches
  for (let batchStart = 0; batchStart < operators.length; batchStart += BATCH_SIZE) {
    const batch = operators.slice(batchStart, batchStart + BATCH_SIZE);

    await Promise.all(
      batch.map((profile) =>
        processOperator(supabase, profile, openAiKey, todayMidnightISO, stats)
      ),
    );

    // Delay between batches (skip delay after the last batch)
    if (batchStart + BATCH_SIZE < operators.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("[navi-generate-daily-quests] Done.", JSON.stringify(stats));

  return new Response(JSON.stringify(stats), {
    headers: { "Content-Type": "application/json" },
  });
});
