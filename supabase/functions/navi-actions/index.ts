import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type NaviAction = {
  type: string;
  params: Record<string, unknown>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*", // Allow everything
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400", // Tell the browser to remember this for 24 hours
};

// Canonical XP curve — mirrors src/lib/xpSystem.ts so client + edge agree.
// xpRequiredForLevel(L) = floor(50 * L * (L+1) / 2)
const xpForLevel = (lv: number) => {
  if (lv >= 100) return Number.POSITIVE_INFINITY;
  const l = Math.max(1, Math.min(100, lv));
  return Math.floor((50 * l * (l + 1)) / 2);
};

const profileAllowedKeys = [
  "display_name", "character_class", "mbti_type", "xp_total", "navi_level",
  "navi_name", "navi_personality", "equipped_skin", "bond_affection", "bond_trust",
  "bond_loyalty", "current_streak", "longest_streak", "subclass", "perception",
  "luck", "codex_points", "cali_coins", "operator_level", "operator_xp",
  "onboarding_done", "notification_settings", "user_navi_description", "last_active",
  "streak_freeze_count",
] as const;

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return value.split(",").map(p => p.trim()).filter(Boolean);
  return [];
}

async function logActivity(sb: ReturnType<typeof createClient>, userId: string, eventType: string, description: string, xpAmount: number) {
  const { error } = await sb.from("activity_log").insert({
    user_id: userId, event_type: eventType, description, xp_amount: xpAmount,
  });
  if (error) console.error("[navi-actions] logActivity error:", error);
}

async function awardXP(sb: ReturnType<typeof createClient>, userId: string, amount: number) {
  const { data: profile, error } = await sb
    .from("profiles").select("xp_total, operator_xp, operator_level").eq("id", userId).single();
  if (error || !profile) { console.error("[navi-actions] awardXP read error:", error); return; }
  const newXpTotal = (Number(profile.xp_total) || 0) + amount;
  let opXp = (Number(profile.operator_xp) || 0) + amount;
  let opLevel = Number(profile.operator_level) || 1;
  while (opXp >= xpForLevel(opLevel + 1)) { opXp -= xpForLevel(opLevel + 1); opLevel++; }
  const { error: updateError } = await sb.from("profiles").update({
    xp_total: newXpTotal, operator_xp: opXp, operator_level: opLevel,
  }).eq("id", userId);
  if (updateError) console.error("[navi-actions] awardXP update error:", updateError);
}

async function executeAction(sb: ReturnType<typeof createClient>, userId: string, action: NaviAction) {
  const params = action.params || {};
  console.log(`[navi-actions] Executing: ${action.type}`, JSON.stringify(params));

  switch (action.type) {
    case "create_quest": {
      const { data, error } = await sb.from("quests").insert({
        user_id: userId,
        name: String(params.name || "New Quest"),
        description: params.description ? String(params.description) : null,
        type: String(params.type || "Daily"),
        total: Number(params.total || 1),
        xp_reward: Number(params.xp_reward || 50),
        progress: Number(params.progress || 0),
        completed: Boolean(params.completed || false),
        linked_skill_id: params.linked_skill_id ? String(params.linked_skill_id) : null,
        loot_description: String(params.loot_description || ""),
        equipment_reward_id: params.equipment_reward_id ? String(params.equipment_reward_id) : null,
        buff_reward_id: params.buff_reward_id ? String(params.buff_reward_id) : null,
        debuff_penalty_id: params.debuff_penalty_id ? String(params.debuff_penalty_id) : null,
      }).select().single();
      if (error) throw error;
      console.log("[navi-actions] Quest created:", data?.id);
      await logActivity(sb, userId, "quest_created", `Quest created: ${String(params.name || "New Quest")}`, 0);
      return;
    }

    case "update_quest": {
      if (!params.quest_id) throw new Error("Missing quest_id");
      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "type", "total", "xp_reward", "progress", "completed", "linked_skill_id", "loot_description", "equipment_reward_id", "buff_reward_id", "debuff_penalty_id"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await sb.from("quests").update(updates).eq("id", String(params.quest_id)).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "quest_updated", `Quest updated: ${String(params.quest_id)}`, 0);
      return;
    }

    case "complete_quest": {
      if (!params.quest_id) throw new Error("Missing quest_id");
      const { data: quest, error } = await sb.from("quests")
        .select("xp_reward, name, total, type, linked_skill_id")
        .eq("id", String(params.quest_id)).eq("user_id", userId).single();
      if (error) throw error;
      if (!quest) throw new Error("Quest not found");
      const { error: qErr } = await sb.from("quests")
        .update({ completed: true, progress: quest.total })
        .eq("id", String(params.quest_id)).eq("user_id", userId);
      if (qErr) throw qErr;
      await awardXP(sb, userId, Number(quest.xp_reward || 0));

      // Award Codex Points + Cali Coins by quest type (replaces former Forge economy)
      const codexMap: Record<string, number> = { Daily: 10, Weekly: 30, Main: 50, Side: 20, Minor: 5, Epic: 100 };
      const caliMap:  Record<string, number> = { Daily: 2,  Weekly: 8,  Main: 12, Side: 5,  Minor: 1, Epic: 25  };
      const qType = String((quest as any).type || "Daily");
      const codexReward = codexMap[qType] ?? 10;
      const caliReward  = caliMap[qType] ?? 2;
      const { data: prof } = await sb.from("profiles").select("codex_points, cali_coins").eq("id", userId).single();
      if (prof) {
        await sb.from("profiles").update({
          codex_points: Number((prof as any).codex_points || 0) + codexReward,
          cali_coins:   Number((prof as any).cali_coins   || 0) + caliReward,
        }).eq("id", userId);
      }

      // (Forge economy removed — quest completions now grant codex points + cali coins above.)

      if (quest.linked_skill_id) {
        const { data: skill } = await sb.from("skills")
          .select("id, name, level, max_level, xp")
          .eq("id", quest.linked_skill_id).eq("user_id", userId).single();
        if (skill) {
          const currentXp = Number(skill.xp || 0) + Number(params.skill_xp || 25);
          let nextLevel = Number(skill.level || 1);
          let remainingXp = currentXp;
          const maxLevel = Number(skill.max_level || 10);
          while (nextLevel < maxLevel && remainingXp >= nextLevel * 100) {
            remainingXp -= nextLevel * 100; nextLevel += 1;
          }
          await sb.from("skills").update({ level: nextLevel, xp: remainingXp })
            .eq("id", quest.linked_skill_id).eq("user_id", userId);
        }
      }
      await logActivity(sb, userId, "quest_completed", `Quest completed: ${quest.name}`, Number(quest.xp_reward || 0));

      // Auto-post to operator feed (fire-and-forget)
      sb.from("profiles")
        .select("display_name, navi_name, character_class, mbti_type, operator_level")
        .eq("id", userId)
        .single()
        .then(({ data: prof }) => {
          if (!prof) return;
          sb.from("operator_feed").insert({
            operator_id: userId,
            display_name: prof.display_name ?? "Operator",
            navi_name: prof.navi_name ?? "NAVI",
            character_class: prof.character_class ?? null,
            mbti_type: prof.mbti_type ?? null,
            operator_level: prof.operator_level ?? 1,
            content_type: "QUEST_COMPLETE",
            content: `${prof.display_name ?? "Operator"} completed the quest: ${quest.name}`,
            metadata: { quest_name: quest.name, quest_type: quest.type, xp_earned: Number(quest.xp_reward || 0) },
            likes: [],
            is_public: true,
          }).then(() => {});
        });

      return;
    }

    case "update_quest_progress": {
      if (!params.quest_id) throw new Error("Missing quest_id");
      const { error } = await sb.from("quests")
        .update({ progress: Number(params.progress || 0) })
        .eq("id", String(params.quest_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "delete_quest": {
      if (!params.quest_id) throw new Error("Missing quest_id");
      const { error } = await sb.from("quests").delete().eq("id", String(params.quest_id)).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "quest_deleted", "Quest deleted", 0);
      return;
    }

    case "award_xp": {
      const amount = Number(params.amount || 0);
      await awardXP(sb, userId, amount);
      await logActivity(sb, userId, "xp_gained", `Gained ${amount} XP`, amount);
      return;
    }

    case "create_skill": {
      const { data, error } = await sb.from("skills").insert({
        user_id: userId,
        name: String(params.name || "New Skill"),
        description: String(params.description || ""),
        category: String(params.category || "General"),
        max_level: Number(params.max_level || 10),
        level: Number(params.level || 1),
        xp: Number(params.xp || 0),
      }).select().single();
      if (error) throw error;
      console.log("[navi-actions] Skill created:", data?.id);
      await logActivity(sb, userId, "skill_created", `Skill created: ${String(params.name || "New Skill")}`, 0);
      return;
    }

    case "update_skill": {
      if (!params.skill_id) throw new Error("Missing skill_id");
      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "category", "level", "max_level", "xp"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await sb.from("skills").update(updates).eq("id", String(params.skill_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "level_up_skill": {
      if (!params.skill_id) throw new Error("Missing skill_id");
      const { data: skill, error } = await sb.from("skills").select("level, max_level, name")
        .eq("id", String(params.skill_id)).eq("user_id", userId).single();
      if (error) throw error;
      if (skill && Number(skill.level) < Number(skill.max_level)) {
        const { error: ue } = await sb.from("skills").update({ level: Number(skill.level) + 1 })
          .eq("id", String(params.skill_id)).eq("user_id", userId);
        if (ue) throw ue;
        await logActivity(sb, userId, "skill_levelup", `${skill.name} leveled up to ${Number(skill.level) + 1}`, 0);
      }
      return;
    }

    case "delete_skill": {
      if (!params.skill_id) throw new Error("Missing skill_id");
      const { error } = await sb.from("skills").delete().eq("id", String(params.skill_id)).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "skill_deleted", "Skill deleted", 0);
      return;
    }

    case "create_subskill": {
      if (!params.skill_id) throw new Error("Missing skill_id");
      const { error } = await sb.from("subskills").insert({
        user_id: userId,
        skill_id: String(params.skill_id),
        name: String(params.name || "New Subskill"),
        description: String(params.description || ""),
        level: Number(params.level || 1),
      });
      if (error) throw error;
      return;
    }

    case "update_subskill": {
      if (!params.subskill_id) throw new Error("Missing subskill_id");
      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "level", "skill_id"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await sb.from("subskills").update(updates).eq("id", String(params.subskill_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "delete_subskill": {
      if (!params.subskill_id) throw new Error("Missing subskill_id");
      const { error } = await sb.from("subskills").delete().eq("id", String(params.subskill_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "update_profile": {
      const updates: Record<string, unknown> = {};
      for (const key of profileAllowedKeys) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      if (Object.keys(updates).length === 0) return;
      const { error } = await sb.from("profiles").update(updates).eq("id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "profile_updated", `Profile updated: ${Object.keys(updates).join(", ")}`, 0);
      return;
    }

    case "create_journal": {
      const title = String(params.title || "New Entry");
      const xpEarned = Number(params.xp_earned || 10);
      const { data, error } = await sb.from("journal_entries").insert({
        user_id: userId,
        title,
        content: String(params.content || ""),
        tags: asStringArray(params.tags),
        xp_earned: xpEarned,
        category: String(params.category || "personal"),
        importance: String(params.importance || "medium"),
      }).select().single();
      if (error) throw error;
      console.log("[navi-actions] Journal created:", data?.id);
      await awardXP(sb, userId, xpEarned);
      await logActivity(sb, userId, "journal_created", `Journal entry: ${title}`, xpEarned);
      return;
    }

    case "update_journal": {
      if (!params.entry_id) throw new Error("Missing entry_id");
      const updates: Record<string, unknown> = {};
      if (params.title !== undefined) updates.title = params.title;
      if (params.content !== undefined) updates.content = params.content;
      if (params.tags !== undefined) updates.tags = asStringArray(params.tags);
      if (params.category !== undefined) updates.category = params.category;
      if (params.importance !== undefined) updates.importance = params.importance;
      const { error } = await sb.from("journal_entries").update(updates).eq("id", String(params.entry_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "delete_journal": {
      if (!params.entry_id) throw new Error("Missing entry_id");
      const { error } = await sb.from("journal_entries").delete().eq("id", String(params.entry_id)).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "journal_deleted", "Journal entry deleted", 0);
      return;
    }

    case "create_equipment": {
      const { data, error } = await sb.from("equipment").insert({
        user_id: userId,
        name: String(params.name || "New Item"),
        description: String(params.description || ""),
        slot: String(params.slot || "accessory"),
        rarity: String(params.rarity || "common"),
        stat_bonuses: (params.stat_bonuses as Record<string, unknown>) || {},
        obtained_from: String(params.obtained_from || "manual"),
        buff_id: params.buff_id ? String(params.buff_id) : null,
        is_equipped: Boolean(params.is_equipped || false),
      }).select().single();
      if (error) throw error;
      console.log("[navi-actions] Equipment created:", data?.id);
      await logActivity(sb, userId, "equipment_created", `Equipment created: ${String(params.name || "New Item")}`, 0);
      return;
    }

    case "update_equipment": {
      if (!params.item_id) throw new Error("Missing item_id");
      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "slot", "rarity", "stat_bonuses", "obtained_from", "buff_id", "is_equipped"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await sb.from("equipment").update(updates).eq("id", String(params.item_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "equip_item": {
      let itemId = params.item_id ? String(params.item_id) : null;
      let slot: string | null = null;
      let name = "Item";
      if (itemId) {
        const { data: item, error } = await sb.from("equipment").select("id, slot, name")
          .eq("id", itemId).eq("user_id", userId).single();
        if (error) throw error;
        if (!item) throw new Error("Item not found");
        slot = item.slot as string; name = item.name as string;
      } else if (params.name) {
        const { data: item, error } = await sb.from("equipment").select("id, slot, name")
          .eq("user_id", userId).ilike("name", String(params.name)).single();
        if (error) throw error;
        if (!item) throw new Error("Item not found");
        itemId = item.id as string; slot = item.slot as string; name = item.name as string;
      }
      if (!itemId || !slot) throw new Error("No item to equip");
      await sb.from("equipment").update({ is_equipped: false }).eq("user_id", userId).eq("slot", slot).eq("is_equipped", true);
      const { error } = await sb.from("equipment").update({ is_equipped: true }).eq("id", itemId).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "item_equipped", `Equipped: ${name}`, 0);
      return;
    }

    case "unequip_item": {
      if (params.item_id) {
        const { error } = await sb.from("equipment").update({ is_equipped: false }).eq("id", String(params.item_id)).eq("user_id", userId);
        if (error) throw error;
      } else if (params.name) {
        const { error } = await sb.from("equipment").update({ is_equipped: false }).eq("user_id", userId).ilike("name", String(params.name));
        if (error) throw error;
      }
      return;
    }

    case "delete_equipment": {
      if (!params.item_id) throw new Error("Missing item_id");
      const { error } = await sb.from("equipment").delete().eq("id", String(params.item_id)).eq("user_id", userId);
      if (error) throw error;
      await logActivity(sb, userId, "equipment_deleted", "Equipment deleted", 0);
      return;
    }

    case "create_buff": {
      const expiresAt = params.duration_hours ? new Date(Date.now() + Number(params.duration_hours) * 3600000).toISOString() : null;
      const effectType = String(params.effect_type || "buff");
      const { data, error } = await sb.from("buffs").insert({
        user_id: userId,
        name: String(params.name || "Buff"),
        description: String(params.description || ""),
        effect_type: effectType,
        stat_affected: String(params.stat_affected || ""),
        modifier_value: Number(params.modifier_value || 0),
        duration_hours: params.duration_hours ? Number(params.duration_hours) : null,
        source: String(params.source || "navi"),
        expires_at: expiresAt,
      }).select().single();
      if (error) throw error;
      console.log("[navi-actions] Buff created:", data?.id);
      await logActivity(sb, userId, effectType === "debuff" ? "debuff_applied" : "buff_applied", `${effectType === "debuff" ? "Debuff" : "Buff"}: ${String(params.name || "Buff")}`, 0);
      return;
    }

    case "update_buff": {
      if (!params.buff_id) throw new Error("Missing buff_id");
      const updates: Record<string, unknown> = {};
      for (const key of ["name", "description", "effect_type", "stat_affected", "modifier_value", "duration_hours", "source", "expires_at"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await sb.from("buffs").update(updates).eq("id", String(params.buff_id)).eq("user_id", userId);
      if (error) throw error;
      return;
    }

    case "remove_buff": {
      if (params.buff_id) {
        const { error } = await sb.from("buffs").delete().eq("id", String(params.buff_id)).eq("user_id", userId);
        if (error) throw error;
      } else if (params.name) {
        const { error } = await sb.from("buffs").delete().eq("user_id", userId).ilike("name", String(params.name));
        if (error) throw error;
      }
      return;
    }

    case "use_streak_freeze": {
      const { data: p, error: pe } = await sb.from("profiles")
        .select("streak_freeze_count, current_streak")
        .eq("id", userId).single();
      if (pe || !p) throw new Error("Profile not found");
      const freezes = Number((p as any).streak_freeze_count ?? 0);
      if (freezes <= 0) throw new Error("No streak freezes available");
      await sb.from("profiles").update({
        streak_freeze_count: freezes - 1,
      }).eq("id", userId);
      await logActivity(sb, userId, "streak_freeze_used", "Streak freeze consumed — streak protected", 0);
      return;
    }

    case "award_streak_freeze": {
      const { data: p } = await sb.from("profiles").select("streak_freeze_count").eq("id", userId).single();
      const current = Number((p as any)?.streak_freeze_count ?? 0);
      await sb.from("profiles").update({ streak_freeze_count: current + 1 }).eq("id", userId);
      await logActivity(sb, userId, "streak_freeze_earned", "Streak freeze earned (7-day milestone)", 0);
      return;
    }

    default:
      console.warn(`[navi-actions] Unknown action type: ${action.type}`);
      return;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Read the body FIRST (can only be read once)
    const bodyText = await req.text();
    console.log("[navi-actions] Request received, body length:", bodyText.length);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("[navi-actions] No auth header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Try both key names - SUPABASE_ANON_KEY is auto-provided by Supabase runtime
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("[navi-actions] Auth check - hasAnonKey:", Boolean(Deno.env.get("SUPABASE_ANON_KEY")), "hasPublishableKey:", Boolean(Deno.env.get("SUPABASE_PUBLISHABLE_KEY")));

    // Validate user token using the token directly with getUser
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      console.error("[navi-actions] Auth failed:", userError?.message || "No user data");
      return new Response(JSON.stringify({ error: "Unauthorized", detail: userError?.message }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    console.log("[navi-actions] Authenticated user:", userId);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    let body: { actions?: NaviAction[] };
    try {
      body = JSON.parse(bodyText);
    } catch {
      console.error("[navi-actions] Invalid JSON body");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actions = Array.isArray(body?.actions) ? (body.actions as NaviAction[]) : [];
    console.log("[navi-actions] Actions to execute:", actions.length, actions.map(a => a.type));

    if (actions.length === 0) {
      return new Response(JSON.stringify({ ok: true, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ type: string; success: boolean; error?: string }> = [];
    for (const action of actions) {
      try {
        await executeAction(adminClient as any, userId, action);
        results.push({ type: action.type, success: true });
        console.log(`[navi-actions] ✓ ${action.type} succeeded`);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[navi-actions] ✗ ${action.type} failed:`, errMsg);
        results.push({ type: action.type, success: false, error: errMsg });
      }
    }

    console.log("[navi-actions] Final results:", JSON.stringify(results));
    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[navi-actions] Fatal error:", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
