import { supabase } from "@/integrations/supabase/client";
import { levelFromTotalXp, totalXpForLevel } from "./xpSystem";

export interface NaviAction {
  type: string;
  params: Record<string, any>;
}

// Every action returns this contract — no void, no silent failures.
// Primary execution path: server edge function (navi-actions).
// Client executeAction is the fallback for specific action types.
export interface NaviActionResult {
  type: string;
  success: boolean;
  message: string;
  affectedTables?: string[];
  affectedIds?: Record<string, string | number | null>;
  xpAwarded?: number;
  levelBefore?: number;
  levelAfter?: number;
  navigateTo?: string;
  refreshSections?: string[];
  error?: string;
}

export function parseActions(text: string): { cleanText: string; actions: NaviAction[] } {
  // ── New format: ```actions ... ``` block ─────────────────────────────────
  const actionsBlockRegex = /```actions\s*([\s\S]*?)```/i;
  const blockMatch = actionsBlockRegex.exec(text);
  if (blockMatch) {
    const jsonStr = blockMatch[1].trim();
    const cleanText = text.slice(0, blockMatch.index) + text.slice(blockMatch.index + blockMatch[0].length);
    try {
      const parsed = JSON.parse(jsonStr) as { actions: NaviAction[] };
      const actions: NaviAction[] = Array.isArray(parsed.actions) ? parsed.actions : [];
      return { cleanText: cleanText.trim(), actions };
    } catch (e) {
      console.error("Failed to parse actions block JSON:", jsonStr, e);
      return { cleanText: cleanText.trim(), actions: [] };
    }
  }

  // ── Legacy fallback: :::ACTION{...}::: format ───────────────────────────
  const actions: NaviAction[] = [];
  let cleanText = text;
  const marker = ":::ACTION";

  let safety = 0;
  while (safety++ < 50) {
    const start = cleanText.indexOf(marker);
    if (start === -1) break;
    const jsonStart = start + marker.length;
    let depth = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < cleanText.length; i++) {
      if (cleanText[i] === "{") depth++;
      else if (cleanText[i] === "}") {
        depth--;
        if (depth === 0) { jsonEnd = i; break; }
      }
    }
    if (jsonEnd === -1) break;
    const jsonStr = cleanText.slice(jsonStart, jsonEnd + 1);
    const afterJson = cleanText.indexOf(":::", jsonEnd + 1);
    const removeEnd = afterJson !== -1 ? afterJson + 3 : jsonEnd + 1;
    try {
      actions.push(JSON.parse(jsonStr));
    } catch (e) {
      console.error("Failed to parse action JSON:", jsonStr, e);
    }
    cleanText = cleanText.slice(0, start) + cleanText.slice(removeEnd);
  }

  return { cleanText: cleanText.trim(), actions };
}

async function logActivity(userId: string, eventType: string, description: string, xpAmount: number): Promise<void> {
  const { error } = await supabase.from("activity_log").insert({ user_id: userId, event_type: eventType, description, xp_amount: xpAmount });
  if (error) console.error("logActivity error:", error);
}

// Single source of truth for XP award logic — uses xpSystem.ts formula
async function awardXPInternal(userId: string, amount: number): Promise<{ levelBefore: number; levelAfter: number; xpAwarded: number } | { error: string }> {
  const { data: profile, error: fetchErr } = await supabase.from("profiles").select("xp_total, operator_level").eq("id", userId).single();
  if (fetchErr || !profile) return { error: fetchErr?.message ?? "Profile not found" };

  const xpBefore = profile.xp_total || 0;
  const levelBefore = profile.operator_level || levelFromTotalXp(xpBefore);
  const newXpTotal = xpBefore + amount;
  const levelAfter = levelFromTotalXp(newXpTotal);
  const newOpXp = newXpTotal - totalXpForLevel(levelAfter);

  const { error: updateErr } = await supabase.from("profiles").update({
    xp_total: newXpTotal,
    operator_xp: newOpXp,
    operator_level: levelAfter,
  }).eq("id", userId);

  if (updateErr) return { error: updateErr.message };
  return { levelBefore, levelAfter, xpAwarded: amount };
}

const VALID_NAV_ROUTES = new Set([
  "/", "/navi", "/mavis", "/character", "/quests", "/journal",
  "/stats", "/party", "/settings", "/games", "/guild", "/social",
  "/inbox", "/agents", "/search", "/notifications", "/upgrade",
]);

const DB_BACKED_SECTIONS: Record<string, string> = {
  profile: "profiles",
  quests: "quests",
  skills: "skills",
  journal: "journal_entries",
  equipment: "equipment",
  buffs: "buffs",
  achievements: "achievements",
  activity_log: "activity_log",
};

export async function executeAction(userId: string, action: NaviAction): Promise<NaviActionResult> {
  const { type, params } = action;

  switch (type) {
    // ── Quest actions ────────────────────────────────────────────────────────
    case "create_quest": {
      if (!params.name) return { type, success: false, message: "Quest name is required", error: "Missing: name" };
      const { data, error } = await supabase.from("quests").insert({
        user_id: userId,
        name: params.name,
        description: params.description || null,
        type: params.type || "Daily",
        total: params.total || 1,
        xp_reward: params.xp_reward || 50,
      }).select("id").single();
      if (error) return { type, success: false, message: "Failed to create quest", error: error.message };
      await logActivity(userId, "quest_created", `Quest created: ${params.name}`, 0);
      return { type, success: true, message: `Quest "${params.name}" created`, affectedTables: ["quests"], affectedIds: { quest_id: data?.id ?? null } };
    }

    case "complete_quest": {
      if (!params.quest_id) return { type, success: false, message: "quest_id is required", error: "Missing: quest_id" };
      const { data: quest, error: fetchErr } = await supabase.from("quests").select("xp_reward, name, total").eq("id", params.quest_id).eq("user_id", userId).single();
      if (fetchErr || !quest) return { type, success: false, message: "Quest not found", error: fetchErr?.message ?? "Not found" };
      const { error: updateErr } = await supabase.from("quests").update({ completed: true, progress: quest.total }).eq("id", params.quest_id);
      if (updateErr) return { type, success: false, message: "Failed to complete quest", error: updateErr.message };
      const xpResult = await awardXPInternal(userId, quest.xp_reward);
      if ("error" in xpResult) return { type, success: false, message: "Quest completed but XP award failed", error: xpResult.error };
      await logActivity(userId, "quest_completed", `Quest completed: ${quest.name}`, quest.xp_reward);
      return { type, success: true, message: `Quest "${quest.name}" completed. +${quest.xp_reward} XP`, affectedTables: ["quests", "profiles"], xpAwarded: xpResult.xpAwarded, levelBefore: xpResult.levelBefore, levelAfter: xpResult.levelAfter };
    }

    case "update_quest_progress": {
      if (!params.quest_id) return { type, success: false, message: "quest_id is required", error: "Missing: quest_id" };
      const { error } = await supabase.from("quests").update({ progress: params.progress }).eq("id", params.quest_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to update progress", error: error.message };
      return { type, success: true, message: "Quest progress updated", affectedTables: ["quests"] };
    }

    case "update_quest": {
      if (!params.quest_id) return { type, success: false, message: "quest_id is required", error: "Missing: quest_id" };
      const updates: any = {};
      for (const key of ["name", "description", "type", "total", "xp_reward", "progress", "completed", "linked_skill_id", "loot_description"]) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      const { error } = await supabase.from("quests").update(updates).eq("id", params.quest_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to update quest", error: error.message };
      return { type, success: true, message: "Quest updated", affectedTables: ["quests"] };
    }

    case "delete_quest": {
      if (!params.quest_id) return { type, success: false, message: "quest_id is required", error: "Missing: quest_id" };
      const { error } = await supabase.from("quests").delete().eq("id", params.quest_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to delete quest", error: error.message };
      await logActivity(userId, "quest_deleted", "Quest deleted", 0);
      return { type, success: true, message: "Quest deleted", affectedTables: ["quests"] };
    }

    // ── XP actions ──────────────────────────────────────────────────────────
    case "award_xp": {
      const amount = params.amount || 0;
      const result = await awardXPInternal(userId, amount);
      if ("error" in result) return { type, success: false, message: "XP award failed", error: result.error };
      await logActivity(userId, "xp_gained", `Gained ${amount} XP`, amount);
      return { type, success: true, message: `Awarded ${amount} XP`, affectedTables: ["profiles", "activity_log"], xpAwarded: result.xpAwarded, levelBefore: result.levelBefore, levelAfter: result.levelAfter };
    }

    case "apply_xp": {
      if (params.amount === undefined || params.amount === null) return { type, success: false, message: "amount is required", error: "Missing: amount" };
      if (!params.reason) return { type, success: false, message: "reason is required", error: "Missing: reason" };
      const result = await awardXPInternal(userId, params.amount);
      if ("error" in result) return { type, success: false, message: "XP application failed", error: result.error };
      await logActivity(userId, "xp_gained", params.reason, params.amount);
      return { type, success: true, message: `Applied ${params.amount} XP: ${params.reason}${result.levelBefore !== result.levelAfter ? ` (Level ${result.levelBefore} → ${result.levelAfter})` : ""}`, affectedTables: ["profiles", "activity_log"], xpAwarded: result.xpAwarded, levelBefore: result.levelBefore, levelAfter: result.levelAfter };
    }

    // ── Skill actions ────────────────────────────────────────────────────────
    case "create_skill": {
      if (!params.name) return { type, success: false, message: "Skill name is required", error: "Missing: name" };
      const { data, error } = await supabase.from("skills" as any).insert({
        user_id: userId,
        name: params.name,
        description: params.description || "",
        category: params.category || "General",
        max_level: params.max_level || 10,
      }).select("id").single();
      if (error) return { type, success: false, message: "Failed to create skill", error: error.message };
      await logActivity(userId, "skill_created", `Skill created: ${params.name}`, 0);
      return { type, success: true, message: `Skill "${params.name}" created`, affectedTables: ["skills"], affectedIds: { skill_id: (data as any)?.id ?? null } };
    }

    case "level_up_skill": {
      if (!params.skill_id) return { type, success: false, message: "skill_id is required", error: "Missing: skill_id" };
      const { data: skill, error: fetchErr } = await supabase.from("skills" as any).select("level, max_level, name").eq("id", params.skill_id).single();
      if (fetchErr || !skill) return { type, success: false, message: "Skill not found", error: fetchErr?.message ?? "Not found" };
      if ((skill as any).level >= (skill as any).max_level) return { type, success: false, message: `${(skill as any).name} is already at max level`, error: "Already at max" };
      const { error: updateErr } = await supabase.from("skills" as any).update({ level: (skill as any).level + 1 }).eq("id", params.skill_id);
      if (updateErr) return { type, success: false, message: "Failed to level up skill", error: updateErr.message };
      await logActivity(userId, "skill_levelup", `${(skill as any).name} leveled up to ${(skill as any).level + 1}`, 0);
      return { type, success: true, message: `${(skill as any).name} leveled up to ${(skill as any).level + 1}`, affectedTables: ["skills"] };
    }

    case "create_subskill": {
      if (!params.skill_id) return { type, success: false, message: "skill_id is required", error: "Missing: skill_id" };
      const { error } = await supabase.from("subskills" as any).insert({
        user_id: userId,
        skill_id: params.skill_id,
        name: params.name || "New Subskill",
        description: params.description || "",
      });
      if (error) return { type, success: false, message: "Failed to create subskill", error: error.message };
      return { type, success: true, message: "Subskill created", affectedTables: ["skills"] };
    }

    case "update_skill": {
      if (!params.skill_id) return { type, success: false, message: "skill_id is required", error: "Missing: skill_id" };
      const updates: any = {};
      if (params.name) updates.name = params.name;
      if (params.description !== undefined) updates.description = params.description;
      if (params.category) updates.category = params.category;
      if (params.level !== undefined) updates.level = params.level;
      if (params.max_level) updates.max_level = params.max_level;
      const { error } = await supabase.from("skills" as any).update(updates).eq("id", params.skill_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to update skill", error: error.message };
      return { type, success: true, message: "Skill updated", affectedTables: ["skills"] };
    }

    case "delete_skill": {
      if (!params.skill_id) return { type, success: false, message: "skill_id is required", error: "Missing: skill_id" };
      const { error } = await supabase.from("skills" as any).delete().eq("id", params.skill_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to delete skill", error: error.message };
      await logActivity(userId, "skill_deleted", "Skill deleted", 0);
      return { type, success: true, message: "Skill deleted", affectedTables: ["skills"] };
    }

    case "progress_skill": {
      if (!params.skill_id && !params.skill_name) return { type, success: false, message: "skill_id or skill_name is required", error: "Missing: skill_id or skill_name" };
      let skillRow: any = null;
      if (params.skill_id) {
        const { data, error } = await supabase.from("skills" as any).select("id, level, max_level, name").eq("id", params.skill_id).eq("user_id", userId).single();
        if (error || !data) return { type, success: false, message: `Skill with ID "${params.skill_id}" not found`, error: error?.message ?? "Not found" };
        skillRow = data;
      } else {
        const { data, error } = await supabase.from("skills" as any).select("id, level, max_level, name").eq("user_id", userId).ilike("name", params.skill_name).limit(1).maybeSingle();
        if (error || !data) return { type, success: false, message: `No skill named "${params.skill_name}" found`, error: error?.message ?? "Not found" };
        skillRow = data;
      }
      const maxLevel = skillRow.max_level || 100;
      const levels = params.levels || 1;
      const newLevel = Math.min(skillRow.level + levels, maxLevel);
      const { error: updateErr } = await supabase.from("skills" as any).update({ level: newLevel }).eq("id", skillRow.id);
      if (updateErr) return { type, success: false, message: "Failed to progress skill", error: updateErr.message };
      let xpResult: { xpAwarded: number; levelBefore: number; levelAfter: number } | undefined;
      if (params.xp_amount) {
        const r = await awardXPInternal(userId, params.xp_amount);
        if (!("error" in r)) xpResult = r;
      }
      return { type, success: true, message: `${skillRow.name} progressed to level ${newLevel}${xpResult ? `. +${xpResult.xpAwarded} XP` : ""}`, affectedTables: ["skills", ...(xpResult ? ["profiles"] : [])], ...(xpResult ?? {}) };
    }

    case "create_or_update_skill": {
      if (!params.name) return { type, success: false, message: "name is required", error: "Missing: name" };
      const { data: existing } = await supabase.from("skills" as any).select("id").eq("user_id", userId).ilike("name", params.name).limit(1).maybeSingle();
      if (existing) {
        const updates: any = {};
        if (params.description !== undefined) updates.description = params.description;
        if (params.category) updates.category = params.category;
        if (params.level !== undefined) updates.level = params.level;
        if (params.max_level) updates.max_level = params.max_level;
        const { error } = await supabase.from("skills" as any).update(updates).eq("id", (existing as any).id);
        if (error) return { type, success: false, message: "Failed to update skill", error: error.message };
        return { type, success: true, message: `Skill "${params.name}" updated`, affectedTables: ["skills"], affectedIds: { skill_id: (existing as any).id } };
      } else {
        const { data, error } = await supabase.from("skills" as any).insert({
          user_id: userId,
          name: params.name,
          description: params.description || "",
          category: params.category || "General",
          level: params.level || 1,
          max_level: params.max_level || 10,
          xp: 0,
        }).select("id").single();
        if (error) return { type, success: false, message: "Failed to create skill", error: error.message };
        return { type, success: true, message: `Skill "${params.name}" created`, affectedTables: ["skills"], affectedIds: { skill_id: (data as any)?.id ?? null } };
      }
    }

    // ── Profile actions ──────────────────────────────────────────────────────
    case "update_profile": {
      const allowed = ["display_name", "character_class", "mbti_type", "xp_total", "navi_level", "navi_name", "navi_personality", "equipped_skin", "bond_affection", "bond_trust", "bond_loyalty", "current_streak", "longest_streak", "subclass", "perception", "luck", "codex_points", "cali_coins", "operator_level", "operator_xp", "onboarding_done", "notification_settings", "user_navi_description"];
      const updates: any = {};
      for (const key of allowed) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      if (Object.keys(updates).length === 0) return { type, success: false, message: "No valid profile fields provided", error: "Empty update" };
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) return { type, success: false, message: "Failed to update profile", error: error.message };
      await logActivity(userId, "profile_updated", `Profile updated: ${Object.keys(updates).join(", ")}`, 0);
      return { type, success: true, message: `Profile updated: ${Object.keys(updates).join(", ")}`, affectedTables: ["profiles"] };
    }

    // ── Journal actions ──────────────────────────────────────────────────────
    case "create_journal": {
      const { data, error } = await supabase.from("journal_entries").insert({
        user_id: userId,
        title: params.title || "New Entry",
        content: params.content || "",
        tags: params.tags || [],
        xp_earned: params.xp_earned || 10,
        category: params.category || "personal",
        importance: params.importance || "medium",
      }).select("id").single();
      if (error) return { type, success: false, message: "Failed to create journal entry", error: error.message };
      const xpResult = await awardXPInternal(userId, params.xp_earned || 10);
      await logActivity(userId, "journal_created", `Journal entry: ${params.title}`, params.xp_earned || 10);
      return { type, success: true, message: `Journal entry "${params.title}" created`, affectedTables: ["journal_entries", "profiles"], affectedIds: { entry_id: (data as any)?.id ?? null }, ...("xpAwarded" in xpResult ? xpResult : {}) };
    }

    case "update_journal": {
      if (!params.entry_id) return { type, success: false, message: "entry_id is required", error: "Missing: entry_id" };
      const updates: any = {};
      if (params.title) updates.title = params.title;
      if (params.content !== undefined) updates.content = params.content;
      if (params.tags) updates.tags = params.tags;
      const { error } = await supabase.from("journal_entries").update(updates).eq("id", params.entry_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to update journal entry", error: error.message };
      return { type, success: true, message: "Journal entry updated", affectedTables: ["journal_entries"] };
    }

    case "delete_journal": {
      if (!params.entry_id) return { type, success: false, message: "entry_id is required", error: "Missing: entry_id" };
      const { error } = await supabase.from("journal_entries").delete().eq("id", params.entry_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to delete journal entry", error: error.message };
      await logActivity(userId, "journal_deleted", "Journal entry deleted", 0);
      return { type, success: true, message: "Journal entry deleted", affectedTables: ["journal_entries"] };
    }

    // ── Equipment actions ────────────────────────────────────────────────────
    case "create_equipment": {
      const { data, error } = await supabase.from("equipment" as any).insert({
        user_id: userId,
        name: params.name || "New Item",
        description: params.description || "",
        slot: params.slot || "accessory",
        rarity: params.rarity || "common",
        stat_bonuses: params.stat_bonuses || {},
        obtained_from: params.obtained_from || "manual",
      }).select("id").single();
      if (error) return { type, success: false, message: "Failed to create equipment", error: error.message };
      await logActivity(userId, "equipment_created", `Equipment created: ${params.name}`, 0);
      return { type, success: true, message: `Equipment "${params.name}" created`, affectedTables: ["equipment"], affectedIds: { item_id: (data as any)?.id ?? null } };
    }

    case "equip_item": {
      if (!params.item_id && !params.name) return { type, success: false, message: "item_id or name is required", error: "Missing: item_id or name" };
      let itemRow: any = null;
      if (params.item_id) {
        const { data, error } = await supabase.from("equipment" as any).select("slot, name, id").eq("id", params.item_id).single();
        if (error || !data) return { type, success: false, message: "Item not found", error: error?.message ?? "Not found" };
        itemRow = data;
      } else {
        const { data, error } = await supabase.from("equipment" as any).select("slot, name, id").eq("user_id", userId).ilike("name", params.name).limit(1).maybeSingle();
        if (error || !data) return { type, success: false, message: `No item named "${params.name}" found`, error: error?.message ?? "Not found" };
        itemRow = data;
      }
      await supabase.from("equipment" as any).update({ is_equipped: false }).eq("user_id", userId).eq("slot", itemRow.slot).eq("is_equipped", true);
      const { error: equipErr } = await supabase.from("equipment" as any).update({ is_equipped: true }).eq("id", itemRow.id);
      if (equipErr) return { type, success: false, message: "Failed to equip item", error: equipErr.message };
      await logActivity(userId, "item_equipped", `Equipped: ${itemRow.name}`, 0);
      return { type, success: true, message: `Equipped "${itemRow.name}"`, affectedTables: ["equipment"] };
    }

    case "unequip_item": {
      if (!params.item_id && !params.name) return { type, success: false, message: "item_id or name is required", error: "Missing: item_id or name" };
      if (params.item_id) {
        const { error } = await supabase.from("equipment" as any).update({ is_equipped: false }).eq("id", params.item_id);
        if (error) return { type, success: false, message: "Failed to unequip item", error: error.message };
      } else {
        const { error } = await supabase.from("equipment" as any).update({ is_equipped: false }).eq("user_id", userId).ilike("name", params.name);
        if (error) return { type, success: false, message: "Failed to unequip item", error: error.message };
      }
      return { type, success: true, message: "Item unequipped", affectedTables: ["equipment"] };
    }

    case "delete_equipment": {
      if (!params.item_id) return { type, success: false, message: "item_id is required", error: "Missing: item_id" };
      const { error } = await supabase.from("equipment" as any).delete().eq("id", params.item_id).eq("user_id", userId);
      if (error) return { type, success: false, message: "Failed to delete equipment", error: error.message };
      await logActivity(userId, "equipment_deleted", "Equipment deleted", 0);
      return { type, success: true, message: "Equipment deleted", affectedTables: ["equipment"] };
    }

    // ── Buff / effect actions ────────────────────────────────────────────────
    case "create_buff": {
      const expiresAt = params.duration_hours ? new Date(Date.now() + params.duration_hours * 3600000).toISOString() : null;
      const { error } = await supabase.from("buffs" as any).insert({
        user_id: userId,
        name: params.name || "Buff",
        description: params.description || "",
        effect_type: params.effect_type || "buff",
        stat_affected: params.stat_affected || "",
        modifier_value: params.modifier_value || 0,
        duration_hours: params.duration_hours || null,
        source: params.source || "navi",
        expires_at: expiresAt,
      });
      if (error) return { type, success: false, message: "Failed to create buff", error: error.message };
      await logActivity(userId, params.effect_type === "debuff" ? "debuff_applied" : "buff_applied", `${params.effect_type === "debuff" ? "Debuff" : "Buff"}: ${params.name}`, 0);
      return { type, success: true, message: `${params.effect_type === "debuff" ? "Debuff" : "Buff"} "${params.name}" applied`, affectedTables: ["buffs"] };
    }

    case "remove_buff": {
      if (!params.buff_id && !params.name) return { type, success: false, message: "buff_id or name is required", error: "Missing: buff_id or name" };
      if (params.buff_id) {
        const { error } = await supabase.from("buffs" as any).delete().eq("id", params.buff_id).eq("user_id", userId);
        if (error) return { type, success: false, message: "Failed to remove buff", error: error.message };
      } else {
        const { error } = await supabase.from("buffs" as any).delete().eq("user_id", userId).ilike("name", params.name);
        if (error) return { type, success: false, message: "Failed to remove buff", error: error.message };
      }
      return { type, success: true, message: "Buff removed", affectedTables: ["buffs"] };
    }

    // ── Quest compound actions ───────────────────────────────────────────────
    case "progress_quest": {
      if (!params.quest_id && !params.quest_name) return { type, success: false, message: "quest_id or quest_name is required", error: "Missing: quest_id or quest_name" };
      let questRow: any = null;
      if (params.quest_id) {
        const { data, error } = await supabase.from("quests").select("id, name, progress, total, xp_reward, completed").eq("id", params.quest_id).eq("user_id", userId).single();
        if (error || !data) return { type, success: false, message: `Quest with ID "${params.quest_id}" not found`, error: error?.message ?? "Not found" };
        questRow = data;
      } else {
        const { data, error } = await supabase.from("quests").select("id, name, progress, total, xp_reward, completed").eq("user_id", userId).ilike("name", params.quest_name).limit(1).maybeSingle();
        if (error || !data) return { type, success: false, message: `No quest named "${params.quest_name}" found`, error: error?.message ?? "Not found" };
        questRow = data;
      }
      const newProgress = params.set_progress !== undefined ? params.set_progress : (questRow.progress + (params.amount || 1));
      const capped = Math.min(newProgress, questRow.total);
      const shouldComplete = (capped >= questRow.total) && (params.complete_if_ready !== false) && !questRow.completed;
      const { error: upErr } = await supabase.from("quests").update({ progress: capped, ...(shouldComplete ? { completed: true } : {}) }).eq("id", questRow.id);
      if (upErr) return { type, success: false, message: "Failed to update quest progress", error: upErr.message };
      let xpResult: any;
      if (shouldComplete) {
        xpResult = await awardXPInternal(userId, questRow.xp_reward);
        await logActivity(userId, "quest_completed", `Quest completed: ${questRow.name}`, questRow.xp_reward);
      }
      return { type, success: true, message: `Quest "${questRow.name}" progress: ${capped}/${questRow.total}${shouldComplete ? ` — Completed! +${questRow.xp_reward} XP` : ""}`, affectedTables: ["quests", ...(shouldComplete ? ["profiles"] : [])], ...(xpResult && !("error" in xpResult) ? { xpAwarded: xpResult.xpAwarded, levelBefore: xpResult.levelBefore, levelAfter: xpResult.levelAfter } : {}) };
    }

    case "complete_quest_by_name": {
      if (!params.quest_name) return { type, success: false, message: "quest_name is required", error: "Missing: quest_name" };
      const { data: questRow, error: fetchErr } = await supabase.from("quests").select("id, name, total, xp_reward, completed").eq("user_id", userId).eq("completed", false).ilike("name", params.quest_name).limit(1).maybeSingle();
      if (fetchErr || !questRow) return { type, success: false, message: `No active quest named "${params.quest_name}" found`, error: fetchErr?.message ?? "Not found" };
      const { error: upErr } = await supabase.from("quests").update({ completed: true, progress: questRow.total }).eq("id", questRow.id);
      if (upErr) return { type, success: false, message: "Failed to complete quest", error: upErr.message };
      const xpResult = await awardXPInternal(userId, questRow.xp_reward);
      await logActivity(userId, "quest_completed", `Quest completed: ${questRow.name}`, questRow.xp_reward);
      if ("error" in xpResult) return { type, success: true, message: `Quest "${questRow.name}" completed (XP award failed: ${xpResult.error})`, affectedTables: ["quests"] };
      return { type, success: true, message: `Quest "${questRow.name}" completed. +${questRow.xp_reward} XP${xpResult.levelBefore !== xpResult.levelAfter ? ` (Level ${xpResult.levelBefore} → ${xpResult.levelAfter})` : ""}`, affectedTables: ["quests", "profiles"], xpAwarded: xpResult.xpAwarded, levelBefore: xpResult.levelBefore, levelAfter: xpResult.levelAfter };
    }

    case "create_or_update_quest": {
      if (!params.name) return { type, success: false, message: "name is required", error: "Missing: name" };
      const { data: existing } = await supabase.from("quests").select("id").eq("user_id", userId).ilike("name", params.name).limit(1).maybeSingle();
      if (existing) {
        const updates: any = {};
        if (params.description !== undefined) updates.description = params.description;
        if (params.type) updates.type = params.type;
        if (params.total !== undefined) updates.total = params.total;
        if (params.progress !== undefined) updates.progress = params.progress;
        if (params.xp_reward !== undefined) updates.xp_reward = params.xp_reward;
        if (params.linked_skill_id !== undefined) updates.linked_skill_id = params.linked_skill_id;
        const { error } = await supabase.from("quests").update(updates).eq("id", (existing as any).id);
        if (error) return { type, success: false, message: "Failed to update quest", error: error.message };
        return { type, success: true, message: `Quest "${params.name}" updated`, affectedTables: ["quests"], affectedIds: { quest_id: (existing as any).id } };
      } else {
        const { data, error } = await supabase.from("quests").insert({
          user_id: userId,
          name: params.name,
          description: params.description || null,
          type: params.type || "Daily",
          total: params.total || 1,
          xp_reward: params.xp_reward || 50,
          progress: params.progress || 0,
          linked_skill_id: params.linked_skill_id || null,
        }).select("id").single();
        if (error) return { type, success: false, message: "Failed to create quest", error: error.message };
        return { type, success: true, message: `Quest "${params.name}" created`, affectedTables: ["quests"], affectedIds: { quest_id: (data as any)?.id ?? null } };
      }
    }

    // ── Navigation / meta actions ────────────────────────────────────────────
    case "set_active_tab": {
      const route = params.route || params.tab || "/";
      if (!VALID_NAV_ROUTES.has(route)) return { type, success: false, message: `Unknown route: ${route}`, error: `Invalid route "${route}"` };
      return { type, success: true, message: `Navigating to ${route}`, navigateTo: route };
    }

    case "refresh_app_data": {
      const sections: string[] = params.sections || [];
      return { type, success: true, message: sections.length > 0 ? `Refreshing: ${sections.join(", ")}` : "Refreshing all data", refreshSections: sections };
    }

    case "update_dashboard_section": {
      const section = params.section as string;
      if (!section || !DB_BACKED_SECTIONS[section]) {
        return { type, success: false, message: `Section "${section}" is not database-backed. Use a specific action type instead.`, error: `Invalid section "${section}"` };
      }
      return { type, success: false, message: `Use a specific action type to update ${section}. update_dashboard_section is a meta-action only.`, error: "Use specific action type" };
    }

    default:
      console.warn("Unknown Navi action:", type);
      return { type, success: false, message: `Unknown action type: ${type}`, error: `Unrecognized action: ${type}` };
  }
}
