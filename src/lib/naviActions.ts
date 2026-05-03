import { supabase } from "@/integrations/supabase/client";
import { levelFromTotalXp, xpRequiredForLevel } from "@/lib/xpSystem";

export interface NaviAction {
  type: string;
  params: Record<string, any>;
}

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

const SUPPORTED_ROUTES = new Set([
  "/", "/navi", "/mavis", "/character", "/quests", "/journal", "/stats",
  "/party", "/settings", "/games", "/guild", "/social", "/inbox",
  "/agents", "/search", "/notifications", "/upgrade",
]);

const TAB_TO_ROUTE: Record<string, string> = {
  home: "/", dashboard: "/", index: "/",
  navi: "/navi", mavis: "/mavis", chat: "/mavis",
  character: "/character", profile: "/character",
  quests: "/quests", journal: "/journal", vault: "/journal",
  stats: "/stats", party: "/party", settings: "/settings",
  games: "/games", guild: "/guild", social: "/social",
  inbox: "/inbox", messages: "/inbox", agents: "/agents",
  search: "/search", notifications: "/notifications", upgrade: "/upgrade",
};

const VALID_REFRESH_SECTIONS = new Set([
  "profile", "quests", "skills", "journal", "equipment",
  "buffs", "activity_log", "achievements", "all",
]);

const DASHBOARD_DB_FIELDS: Record<string, string> = {
  display_name: "display_name", navi_name: "navi_name",
  current_streak: "current_streak", xp_total: "xp_total",
  operator_level: "operator_level", navi_level: "navi_level",
};

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
      return { cleanText: stripJsonNoise(cleanText).trim(), actions };
    } catch (e) {
      console.error("Failed to parse actions block JSON:", jsonStr, e);
      return { cleanText: stripJsonNoise(cleanText).trim(), actions: [] };
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

  return { cleanText: stripJsonNoise(cleanText).trim(), actions };
}

// Strip stray ```json ... ``` blocks that look like raw action payloads from user-visible text.
function stripJsonNoise(text: string): string {
  return text.replace(/```json\s*\{[\s\S]*?\}\s*```/gi, "").replace(/```actions[\s\S]*?```/gi, "");
}

async function logActivity(userId: string, eventType: string, description: string, xpAmount: number) {
  const { error } = await supabase.from("activity_log").insert({
    user_id: userId, event_type: eventType, description, xp_amount: xpAmount,
  });
  if (error) console.error("logActivity error:", error);
}

function fail(type: string, message: string, error?: string): NaviActionResult {
  return { type, success: false, message, error: error ?? message };
}
function ok(type: string, message: string, extra: Partial<NaviActionResult> = {}): NaviActionResult {
  return { type, success: true, message, ...extra };
}

// One canonical XP application path used by every action that grants XP.
async function applyXpToProfile(
  userId: string,
  amount: number
): Promise<{ ok: true; levelBefore: number; levelAfter: number; xpTotal: number } | { ok: false; error: string }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("xp_total, operator_xp, operator_level, navi_level")
    .eq("id", userId)
    .maybeSingle();
  if (error || !profile) return { ok: false, error: error?.message ?? "Profile not found" };

  const xpBefore = (profile as any).xp_total || 0;
  const levelBefore = levelFromTotalXp(xpBefore);
  const newTotal = xpBefore + amount;
  const levelAfter = levelFromTotalXp(newTotal);

  // operator_xp / level kept in sync via the canonical xpSystem formula.
  // Fallback (legacy): if formula returns Infinity at L100 we still cap.
  const updates: any = {
    xp_total: newTotal,
    operator_level: levelAfter,
    operator_xp: newTotal,
  };
  const { error: upErr } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (upErr) return { ok: false, error: upErr.message };
  // Touch xpRequiredForLevel so tree-shakers keep it (and to validate formula presence at runtime).
  void xpRequiredForLevel(levelAfter);
  return { ok: true, levelBefore, levelAfter, xpTotal: newTotal };
}

export async function executeAction(userId: string, action: NaviAction): Promise<NaviActionResult> {
  const { type, params } = action || ({} as NaviAction);
  if (!type) return fail("unknown", "Action missing 'type'");
  if (!userId) return fail(type, "Missing user id");
  const p = params || {};

  try {
    switch (type) {
      // ───────── QUESTS ─────────
      case "create_quest": {
        if (!p.name) return fail(type, "Missing required param: name");
        const { data, error } = await supabase.from("quests").insert({
          user_id: userId,
          name: p.name,
          description: p.description ?? null,
          type: p.type || "Daily",
          total: p.total || 1,
          xp_reward: p.xp_reward ?? 50,
          linked_skill_id: p.linked_skill_id ?? null,
        }).select("id").maybeSingle();
        if (error) return fail(type, `Failed to create quest`, error.message);
        await logActivity(userId, "quest_created", `Quest created: ${p.name}`, 0);
        return ok(type, `Created quest "${p.name}".`, {
          affectedTables: ["quests", "activity_log"],
          affectedIds: { quest_id: data?.id ?? null },
        });
      }
      case "complete_quest": {
        if (!p.quest_id) return fail(type, "Missing required param: quest_id");
        const { data: quest, error: qErr } = await supabase
          .from("quests").select("xp_reward, name, total")
          .eq("id", p.quest_id).eq("user_id", userId).maybeSingle();
        if (qErr) return fail(type, "Quest lookup failed", qErr.message);
        if (!quest) return fail(type, `No quest found with id ${p.quest_id}`);
        const { error: upErr } = await supabase.from("quests")
          .update({ completed: true, progress: (quest as any).total })
          .eq("id", p.quest_id).eq("user_id", userId);
        if (upErr) return fail(type, "Failed to complete quest", upErr.message);
        const xpRes = await applyXpToProfile(userId, (quest as any).xp_reward || 0);
        await logActivity(userId, "quest_completed", `Quest completed: ${(quest as any).name}`, (quest as any).xp_reward || 0);
        return ok(type, `Completed "${(quest as any).name}" — awarded ${(quest as any).xp_reward || 0} XP.`, {
          affectedTables: ["quests", "profiles", "activity_log"],
          affectedIds: { quest_id: p.quest_id },
          xpAwarded: (quest as any).xp_reward || 0,
          levelBefore: xpRes.ok ? xpRes.levelBefore : undefined,
          levelAfter: xpRes.ok ? xpRes.levelAfter : undefined,
        });
      }
      case "complete_quest_by_name": {
        if (!p.quest_name) return fail(type, "Missing required param: quest_name");
        const { data: quests, error } = await supabase.from("quests")
          .select("id, name, xp_reward, total")
          .eq("user_id", userId).eq("completed", false).ilike("name", `%${p.quest_name}%`).limit(1);
        if (error) return fail(type, "Quest lookup failed", error.message);
        const quest = quests?.[0];
        if (!quest) return fail(type, `No active quest matching "${p.quest_name}".`);
        return executeAction(userId, { type: "complete_quest", params: { quest_id: (quest as any).id } });
      }
      case "update_quest_progress": {
        if (!p.quest_id) return fail(type, "Missing required param: quest_id");
        if (p.progress === undefined) return fail(type, "Missing required param: progress");
        const { error } = await supabase.from("quests")
          .update({ progress: p.progress })
          .eq("id", p.quest_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to update progress", error.message);
        return ok(type, `Updated quest progress to ${p.progress}.`, {
          affectedTables: ["quests"], affectedIds: { quest_id: p.quest_id },
        });
      }
      case "progress_quest": {
        // find by id or name
        let questId: string | null = p.quest_id ?? null;
        let quest: any = null;
        if (questId) {
          const { data } = await supabase.from("quests").select("id, name, progress, total, xp_reward, completed")
            .eq("id", questId).eq("user_id", userId).maybeSingle();
          quest = data;
        } else if (p.quest_name) {
          const { data } = await supabase.from("quests").select("id, name, progress, total, xp_reward, completed")
            .eq("user_id", userId).ilike("name", `%${p.quest_name}%`).limit(1);
          quest = data?.[0];
          questId = quest?.id ?? null;
        } else {
          return fail(type, "Missing required param: quest_id or quest_name");
        }
        if (!quest) return fail(type, "Quest not found");
        const newProgress = p.set_progress !== undefined
          ? Number(p.set_progress)
          : Math.min(quest.total, (quest.progress || 0) + Number(p.amount ?? 1));
        const shouldComplete = (p.complete_if_ready ?? true) && newProgress >= quest.total && !quest.completed;
        const updates: any = { progress: newProgress };
        if (shouldComplete) updates.completed = true;
        const { error } = await supabase.from("quests").update(updates).eq("id", questId).eq("user_id", userId);
        if (error) return fail(type, "Failed to progress quest", error.message);
        const tables = ["quests"];
        let xpAwarded = 0; let levelBefore: number | undefined; let levelAfter: number | undefined;
        if (shouldComplete) {
          xpAwarded = quest.xp_reward || 0;
          const xpRes = await applyXpToProfile(userId, xpAwarded);
          if (xpRes.ok) { levelBefore = xpRes.levelBefore; levelAfter = xpRes.levelAfter; tables.push("profiles"); }
          await logActivity(userId, "quest_completed", `Quest completed: ${quest.name}`, xpAwarded);
          tables.push("activity_log");
        }
        return ok(type, shouldComplete
          ? `Progressed and completed "${quest.name}" — +${xpAwarded} XP.`
          : `Progress: ${newProgress}/${quest.total} on "${quest.name}".`, {
          affectedTables: tables, affectedIds: { quest_id: questId },
          xpAwarded: shouldComplete ? xpAwarded : undefined, levelBefore, levelAfter,
        });
      }
      case "update_quest": {
        if (!p.quest_id) return fail(type, "Missing required param: quest_id");
        const updates: any = {};
        for (const key of ["name", "description", "type", "total", "xp_reward", "progress", "completed", "linked_skill_id", "loot_description"]) {
          if (p[key] !== undefined) updates[key] = p[key];
        }
        if (!Object.keys(updates).length) return fail(type, "No updatable fields provided");
        const { error } = await supabase.from("quests").update(updates).eq("id", p.quest_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to update quest", error.message);
        return ok(type, `Updated quest.`, {
          affectedTables: ["quests"], affectedIds: { quest_id: p.quest_id },
        });
      }
      case "delete_quest": {
        if (!p.quest_id) return fail(type, "Missing required param: quest_id");
        const { error } = await supabase.from("quests").delete().eq("id", p.quest_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to delete quest", error.message);
        await logActivity(userId, "quest_deleted", `Quest deleted`, 0);
        return ok(type, `Deleted quest.`, {
          affectedTables: ["quests", "activity_log"], affectedIds: { quest_id: p.quest_id },
        });
      }
      case "create_or_update_quest": {
        if (!p.name) return fail(type, "Missing required param: name");
        const { data: existing } = await supabase.from("quests")
          .select("id").eq("user_id", userId).ilike("name", p.name).limit(1);
        const payload: any = {
          user_id: userId,
          name: p.name,
          description: p.description ?? null,
          type: p.type || "Daily",
          total: p.total ?? 1,
          xp_reward: p.xp_reward ?? 50,
          linked_skill_id: p.linked_skill_id ?? null,
        };
        if (p.progress !== undefined) payload.progress = p.progress;
        if (existing && existing[0]) {
          const { error } = await supabase.from("quests").update(payload).eq("id", (existing[0] as any).id);
          if (error) return fail(type, "Failed to update quest", error.message);
          return ok(type, `Updated quest "${p.name}".`, {
            affectedTables: ["quests"], affectedIds: { quest_id: (existing[0] as any).id },
          });
        }
        const { data, error } = await supabase.from("quests").insert(payload).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create quest", error.message);
        return ok(type, `Created quest "${p.name}".`, {
          affectedTables: ["quests"], affectedIds: { quest_id: data?.id ?? null },
        });
      }

      // ───────── XP ─────────
      case "award_xp":
      case "apply_xp": {
        const amount = Number(p.amount ?? 0);
        if (!amount || Number.isNaN(amount)) return fail(type, "Missing or invalid param: amount");
        const xpRes = await applyXpToProfile(userId, amount);
        if (!xpRes.ok) return fail(type, "Failed to award XP", xpRes.error);
        const reason = p.reason || "Manual award";
        await logActivity(userId, "xp_gained", `+${amount} XP — ${reason}`, amount);
        const message = xpRes.levelAfter > xpRes.levelBefore
          ? `Applied ${amount} XP. Level ${xpRes.levelBefore}→${xpRes.levelAfter}.`
          : `Applied ${amount} XP.`;
        return ok(type, message, {
          affectedTables: ["profiles", "activity_log"],
          xpAwarded: amount,
          levelBefore: xpRes.levelBefore,
          levelAfter: xpRes.levelAfter,
          affectedIds: {
            linked_skill_id: p.linked_skill_id ?? null,
            linked_quest_id: p.linked_quest_id ?? null,
          },
        });
      }

      // ───────── SKILLS ─────────
      case "create_skill": {
        if (!p.name) return fail(type, "Missing required param: name");
        const { data, error } = await supabase.from("skills" as any).insert({
          user_id: userId,
          name: p.name,
          description: p.description || "",
          category: p.category || "General",
          max_level: p.max_level || 10,
          level: p.level ?? 1,
        }).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create skill", error.message);
        await logActivity(userId, "skill_created", `Skill created: ${p.name}`, 0);
        return ok(type, `Created skill "${p.name}".`, {
          affectedTables: ["skills", "activity_log"],
          affectedIds: { skill_id: (data as any)?.id ?? null },
        });
      }
      case "level_up_skill": {
        if (!p.skill_id) return fail(type, "Missing required param: skill_id");
        const { data: skill, error } = await supabase.from("skills" as any)
          .select("level, max_level, name").eq("id", p.skill_id).maybeSingle();
        if (error) return fail(type, "Skill lookup failed", error.message);
        if (!skill) return fail(type, "Skill not found");
        const s = skill as any;
        if (s.level >= s.max_level) return fail(type, `${s.name} already at max level (${s.max_level}).`);
        const { error: upErr } = await supabase.from("skills" as any).update({ level: s.level + 1 }).eq("id", p.skill_id);
        if (upErr) return fail(type, "Failed to level up skill", upErr.message);
        await logActivity(userId, "skill_levelup", `${s.name} leveled up to ${s.level + 1}`, 0);
        return ok(type, `${s.name} leveled up to ${s.level + 1}.`, {
          affectedTables: ["skills", "activity_log"], affectedIds: { skill_id: p.skill_id },
        });
      }
      case "progress_skill": {
        let skill: any = null; let skillId: string | null = p.skill_id ?? null;
        if (skillId) {
          const { data } = await supabase.from("skills" as any).select("id, name, level, max_level, xp")
            .eq("id", skillId).eq("user_id", userId).maybeSingle();
          skill = data;
        } else if (p.skill_name) {
          const { data } = await supabase.from("skills" as any).select("id, name, level, max_level, xp")
            .eq("user_id", userId).ilike("name", `%${p.skill_name}%`).limit(1);
          skill = (data as any)?.[0];
          skillId = skill?.id ?? null;
        } else {
          return fail(type, "Missing required param: skill_id or skill_name");
        }
        if (!skill) return fail(type, `Skill not found.`);
        const levelInc = Number(p.levels ?? 0);
        const xpInc = Number(p.xp_amount ?? 0);
        const newLevel = Math.min(skill.max_level, skill.level + (levelInc || 0));
        const newXp = (skill.xp || 0) + (xpInc || 0);
        const { error } = await supabase.from("skills" as any)
          .update({ level: newLevel, xp: newXp }).eq("id", skillId).eq("user_id", userId);
        if (error) return fail(type, "Failed to progress skill", error.message);
        const tables = ["skills"];
        let xpAwarded: number | undefined;
        let levelBefore: number | undefined; let levelAfter: number | undefined;
        if (xpInc > 0) {
          const r = await applyXpToProfile(userId, xpInc);
          if (r.ok) { tables.push("profiles"); levelBefore = r.levelBefore; levelAfter = r.levelAfter; xpAwarded = xpInc; }
        }
        await logActivity(userId, "skill_progress", `${skill.name}: ${p.reason || "progressed"}`, xpInc || 0);
        tables.push("activity_log");
        return ok(type, `${skill.name}: L${skill.level}→L${newLevel}${xpInc ? ` (+${xpInc} XP)` : ""}.`, {
          affectedTables: tables, affectedIds: { skill_id: skillId },
          xpAwarded, levelBefore, levelAfter,
        });
      }
      case "create_subskill": {
        if (!p.skill_id) return fail(type, "Missing required param: skill_id");
        if (!p.name) return fail(type, "Missing required param: name");
        const { data, error } = await supabase.from("subskills" as any).insert({
          user_id: userId,
          skill_id: p.skill_id,
          name: p.name,
          description: p.description || "",
        }).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create subskill", error.message);
        return ok(type, `Created subskill "${p.name}".`, {
          affectedTables: ["subskills"], affectedIds: { subskill_id: (data as any)?.id ?? null },
        });
      }
      case "update_skill": {
        if (!p.skill_id) return fail(type, "Missing required param: skill_id");
        const updates: any = {};
        for (const key of ["name", "description", "category", "level", "max_level", "xp"]) {
          if (p[key] !== undefined) updates[key] = p[key];
        }
        if (!Object.keys(updates).length) return fail(type, "No updatable fields provided");
        const { error } = await supabase.from("skills" as any).update(updates).eq("id", p.skill_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to update skill", error.message);
        return ok(type, `Updated skill.`, {
          affectedTables: ["skills"], affectedIds: { skill_id: p.skill_id },
        });
      }
      case "create_or_update_skill": {
        if (!p.name) return fail(type, "Missing required param: name");
        const { data: existing } = await supabase.from("skills" as any)
          .select("id").eq("user_id", userId).ilike("name", p.name).limit(1);
        const payload: any = {
          user_id: userId,
          name: p.name,
          description: p.description ?? "",
          category: p.category || "General",
          max_level: p.max_level || 10,
        };
        if (p.level !== undefined) payload.level = p.level;
        if (existing && (existing as any)[0]) {
          const id = (existing as any)[0].id;
          const { error } = await supabase.from("skills" as any).update(payload).eq("id", id);
          if (error) return fail(type, "Failed to update skill", error.message);
          return ok(type, `Updated skill "${p.name}".`, {
            affectedTables: ["skills"], affectedIds: { skill_id: id },
          });
        }
        const { data, error } = await supabase.from("skills" as any).insert(payload).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create skill", error.message);
        return ok(type, `Created skill "${p.name}".`, {
          affectedTables: ["skills"], affectedIds: { skill_id: (data as any)?.id ?? null },
        });
      }
      case "delete_skill": {
        if (!p.skill_id) return fail(type, "Missing required param: skill_id");
        const { error } = await supabase.from("skills" as any).delete().eq("id", p.skill_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to delete skill", error.message);
        await logActivity(userId, "skill_deleted", `Skill deleted`, 0);
        return ok(type, `Deleted skill.`, {
          affectedTables: ["skills", "activity_log"], affectedIds: { skill_id: p.skill_id },
        });
      }

      // ───────── PROFILE ─────────
      case "update_profile": {
        const allowed = ["display_name", "character_class", "mbti_type", "xp_total", "navi_level", "navi_name", "navi_personality", "equipped_skin", "bond_affection", "bond_trust", "bond_loyalty", "current_streak", "longest_streak", "subclass", "perception", "luck", "codex_points", "cali_coins", "operator_level", "operator_xp", "onboarding_done", "notification_settings", "user_navi_description"];
        const updates: any = {};
        for (const key of allowed) if (p[key] !== undefined) updates[key] = p[key];
        if (!Object.keys(updates).length) return fail(type, "No updatable profile fields provided");
        const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
        if (error) return fail(type, "Failed to update profile", error.message);
        await logActivity(userId, "profile_updated", `Profile updated: ${Object.keys(updates).join(", ")}`, 0);
        return ok(type, `Profile updated: ${Object.keys(updates).join(", ")}.`, {
          affectedTables: ["profiles", "activity_log"],
        });
      }

      // ───────── JOURNAL ─────────
      case "create_journal": {
        if (!p.title) return fail(type, "Missing required param: title");
        const xpEarned = p.xp_earned ?? 10;
        const { data, error } = await supabase.from("journal_entries").insert({
          user_id: userId,
          title: p.title,
          content: p.content || "",
          tags: p.tags || [],
          xp_earned: xpEarned,
          category: p.category || "personal",
          importance: p.importance || "medium",
        }).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create journal entry", error.message);
        const xpRes = await applyXpToProfile(userId, xpEarned);
        const xpResOk = xpRes.ok;
        await logActivity(userId, "journal_created", `Journal entry: ${p.title}`, xpEarned);
        return ok(type, `Saved entry "${p.title}" (+${xpEarned} XP).`, {
          affectedTables: ["journal_entries", "profiles", "activity_log"],
          affectedIds: { entry_id: data?.id ?? null },
          xpAwarded: xpEarned,
          levelBefore: xpResOk ? xpRes.levelBefore : undefined,
          levelAfter: xpResOk ? xpRes.levelAfter : undefined,
        });
      }
      case "update_journal": {
        if (!p.entry_id) return fail(type, "Missing required param: entry_id");
        const updates: any = {};
        for (const key of ["title", "content", "tags", "category", "importance"]) {
          if (p[key] !== undefined) updates[key] = p[key];
        }
        if (!Object.keys(updates).length) return fail(type, "No updatable fields provided");
        const { error } = await supabase.from("journal_entries").update(updates).eq("id", p.entry_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to update journal", error.message);
        return ok(type, `Updated journal entry.`, {
          affectedTables: ["journal_entries"], affectedIds: { entry_id: p.entry_id },
        });
      }
      case "delete_journal": {
        if (!p.entry_id) return fail(type, "Missing required param: entry_id");
        const { error } = await supabase.from("journal_entries").delete().eq("id", p.entry_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to delete journal", error.message);
        await logActivity(userId, "journal_deleted", `Journal entry deleted`, 0);
        return ok(type, `Deleted journal entry.`, {
          affectedTables: ["journal_entries", "activity_log"], affectedIds: { entry_id: p.entry_id },
        });
      }

      // ───────── EQUIPMENT ─────────
      case "create_equipment": {
        if (!p.name) return fail(type, "Missing required param: name");
        const { data, error } = await supabase.from("equipment" as any).insert({
          user_id: userId,
          name: p.name,
          description: p.description || "",
          slot: p.slot || "accessory",
          rarity: p.rarity || "common",
          stat_bonuses: p.stat_bonuses || {},
          obtained_from: p.obtained_from || "manual",
        }).select("id").maybeSingle();
        if (error) return fail(type, "Failed to create equipment", error.message);
        await logActivity(userId, "equipment_created", `Equipment created: ${p.name}`, 0);
        return ok(type, `Created equipment "${p.name}".`, {
          affectedTables: ["equipment", "activity_log"],
          affectedIds: { item_id: (data as any)?.id ?? null },
        });
      }
      case "equip_item": {
        let itemId = p.item_id ?? null;
        let item: any = null;
        if (itemId) {
          const { data } = await supabase.from("equipment" as any)
            .select("id, slot, name").eq("id", itemId).eq("user_id", userId).maybeSingle();
          item = data;
        } else if (p.name) {
          const { data } = await supabase.from("equipment" as any)
            .select("id, slot, name").eq("user_id", userId).ilike("name", p.name).limit(1);
          item = (data as any)?.[0];
          itemId = item?.id ?? null;
        } else {
          return fail(type, "Missing required param: item_id or name");
        }
        if (!item) return fail(type, "Item not found");
        const { error: e1 } = await supabase.from("equipment" as any)
          .update({ is_equipped: false }).eq("user_id", userId).eq("slot", item.slot).eq("is_equipped", true);
        if (e1) return fail(type, "Failed to swap equipment", e1.message);
        const { error: e2 } = await supabase.from("equipment" as any)
          .update({ is_equipped: true }).eq("id", itemId);
        if (e2) return fail(type, "Failed to equip item", e2.message);
        await logActivity(userId, "item_equipped", `Equipped: ${item.name}`, 0);
        return ok(type, `Equipped "${item.name}".`, {
          affectedTables: ["equipment", "activity_log"], affectedIds: { item_id: itemId },
        });
      }
      case "unequip_item": {
        if (p.item_id) {
          const { error } = await supabase.from("equipment" as any)
            .update({ is_equipped: false }).eq("id", p.item_id).eq("user_id", userId);
          if (error) return fail(type, "Failed to unequip", error.message);
          return ok(type, "Unequipped item.", { affectedTables: ["equipment"], affectedIds: { item_id: p.item_id } });
        }
        if (p.name) {
          const { error } = await supabase.from("equipment" as any)
            .update({ is_equipped: false }).eq("user_id", userId).ilike("name", p.name);
          if (error) return fail(type, "Failed to unequip", error.message);
          return ok(type, `Unequipped "${p.name}".`, { affectedTables: ["equipment"] });
        }
        return fail(type, "Missing required param: item_id or name");
      }
      case "delete_equipment": {
        if (!p.item_id) return fail(type, "Missing required param: item_id");
        const { error } = await supabase.from("equipment" as any).delete().eq("id", p.item_id).eq("user_id", userId);
        if (error) return fail(type, "Failed to delete equipment", error.message);
        await logActivity(userId, "equipment_deleted", `Equipment deleted`, 0);
        return ok(type, `Deleted equipment.`, {
          affectedTables: ["equipment", "activity_log"], affectedIds: { item_id: p.item_id },
        });
      }

      // ───────── BUFFS ─────────
      case "create_buff": {
        if (!p.name) return fail(type, "Missing required param: name");
        const expiresAt = p.duration_hours ? new Date(Date.now() + p.duration_hours * 3600000).toISOString() : null;
        const { data, error } = await supabase.from("buffs" as any).insert({
          user_id: userId,
          name: p.name,
          description: p.description || "",
          effect_type: p.effect_type || "buff",
          stat_affected: p.stat_affected || "",
          modifier_value: p.modifier_value || 0,
          duration_hours: p.duration_hours || null,
          source: p.source || "navi",
          expires_at: expiresAt,
        }).select("id").maybeSingle();
        if (error) return fail(type, "Failed to apply effect", error.message);
        await logActivity(userId, p.effect_type === "debuff" ? "debuff_applied" : "buff_applied",
          `${p.effect_type === "debuff" ? "Debuff" : "Buff"}: ${p.name}`, 0);
        return ok(type, `${p.effect_type === "debuff" ? "Debuff" : "Buff"} "${p.name}" applied.`, {
          affectedTables: ["buffs", "activity_log"], affectedIds: { buff_id: (data as any)?.id ?? null },
        });
      }
      case "remove_buff": {
        if (p.buff_id) {
          const { error } = await supabase.from("buffs" as any).delete().eq("id", p.buff_id).eq("user_id", userId);
          if (error) return fail(type, "Failed to remove buff", error.message);
          return ok(type, "Removed buff.", { affectedTables: ["buffs"], affectedIds: { buff_id: p.buff_id } });
        }
        if (p.name) {
          const { error } = await supabase.from("buffs" as any).delete().eq("user_id", userId).ilike("name", p.name);
          if (error) return fail(type, "Failed to remove buff", error.message);
          return ok(type, `Removed buff "${p.name}".`, { affectedTables: ["buffs"] });
        }
        return fail(type, "Missing required param: buff_id or name");
      }

      // ───────── NAVIGATION / REFRESH ─────────
      case "set_active_tab": {
        let route = p.route ?? null;
        if (!route && p.tab) {
          const key = String(p.tab).toLowerCase().trim();
          route = TAB_TO_ROUTE[key] ?? null;
        }
        if (!route) return fail(type, "Missing or unknown param: tab/route");
        if (!SUPPORTED_ROUTES.has(route)) return fail(type, `Route "${route}" is not a supported tab.`);
        return ok(type, `Switching to ${route}.`, { navigateTo: route });
      }
      case "refresh_app_data": {
        const sections: string[] = Array.isArray(p.sections) && p.sections.length > 0
          ? p.sections.filter((s: string) => VALID_REFRESH_SECTIONS.has(s))
          : ["all"];
        return ok(type, `Refreshing: ${sections.join(", ")}.`, { refreshSections: sections });
      }
      case "update_dashboard_section": {
        const section = p.section;
        if (!section) return fail(type, "Missing required param: section");
        const dbField = DASHBOARD_DB_FIELDS[section];
        if (!dbField) return fail(type, `Section "${section}" is display-only and cannot be mutated directly.`);
        if (p.value === undefined) return fail(type, "Missing required param: value");
        const { error } = await supabase.from("profiles").update({ [dbField]: p.value }).eq("id", userId);
        if (error) return fail(type, "Failed to update dashboard section", error.message);
        return ok(type, `Updated ${section}.`, { affectedTables: ["profiles"] });
      }

      default:
        return fail(type, `Unknown Navi action: ${type}`);
    }
  } catch (err: any) {
    return fail(type, "Action threw exception", err?.message ?? String(err));
  }
}
