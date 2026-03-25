import { supabase } from "@/integrations/supabase/client";

export interface NaviAction {
  type: string;
  params: Record<string, any>;
}

const ACTION_REGEX = /:::ACTION(\{.*?\}):::/gs;

export function parseActions(text: string): { cleanText: string; actions: NaviAction[] } {
  const actions: NaviAction[] = [];
  const cleanText = text.replace(ACTION_REGEX, (_, json) => {
    try {
      actions.push(JSON.parse(json));
    } catch {}
    return "";
  });
  return { cleanText: cleanText.trim(), actions };
}

async function logActivity(userId: string, eventType: string, description: string, xpAmount: number) {
  await supabase.from("activity_log" as any).insert({ user_id: userId, event_type: eventType, description, xp_amount: xpAmount });
}

async function awardXP(userId: string, amount: number) {
  const { data: profile } = await supabase.from("profiles").select("xp_total").eq("id", userId).single();
  if (profile) {
    await supabase.from("profiles").update({ xp_total: (profile.xp_total || 0) + amount }).eq("id", userId);
  }
}

export async function executeAction(userId: string, action: NaviAction): Promise<void> {
  const { type, params } = action;

  switch (type) {
    case "create_quest": {
      await supabase.from("quests").insert({
        user_id: userId,
        name: params.name || "New Quest",
        type: params.type || "Daily",
        total: params.total || 1,
        xp_reward: params.xp_reward || 50,
      });
      await logActivity(userId, "quest_created", `Quest created: ${params.name}`, 0);
      break;
    }
    case "complete_quest": {
      if (params.quest_id) {
        const { data: quest } = await supabase.from("quests").select("xp_reward, name, total").eq("id", params.quest_id).eq("user_id", userId).single();
        if (quest) {
          await supabase.from("quests").update({ completed: true, progress: quest.total }).eq("id", params.quest_id);
          await awardXP(userId, quest.xp_reward);
          await logActivity(userId, "quest_completed", `Quest completed: ${quest.name}`, quest.xp_reward);
        }
      }
      break;
    }
    case "update_quest_progress": {
      if (params.quest_id) {
        await supabase.from("quests").update({ progress: params.progress }).eq("id", params.quest_id).eq("user_id", userId);
      }
      break;
    }
    case "delete_quest": {
      if (params.quest_id) {
        await supabase.from("quests").delete().eq("id", params.quest_id).eq("user_id", userId);
        await logActivity(userId, "quest_deleted", `Quest deleted`, 0);
      }
      break;
    }
    case "award_xp": {
      const amount = params.amount || 0;
      await awardXP(userId, amount);
      await logActivity(userId, "xp_gained", `Gained ${amount} XP`, amount);
      break;
    }
    case "create_skill": {
      await supabase.from("skills" as any).insert({
        user_id: userId,
        name: params.name || "New Skill",
        description: params.description || "",
        category: params.category || "General",
        max_level: params.max_level || 10,
      });
      await logActivity(userId, "skill_created", `Skill created: ${params.name}`, 0);
      break;
    }
    case "level_up_skill": {
      if (params.skill_id) {
        const { data: skill } = await supabase.from("skills" as any).select("level, max_level, name").eq("id", params.skill_id).single();
        if (skill && (skill as any).level < (skill as any).max_level) {
          await supabase.from("skills" as any).update({ level: (skill as any).level + 1 }).eq("id", params.skill_id);
          await logActivity(userId, "skill_levelup", `${(skill as any).name} leveled up to ${(skill as any).level + 1}`, 0);
        }
      }
      break;
    }
    case "create_subskill": {
      if (params.skill_id) {
        await supabase.from("subskills" as any).insert({
          user_id: userId,
          skill_id: params.skill_id,
          name: params.name || "New Subskill",
          description: params.description || "",
        });
      }
      break;
    }
    case "update_skill": {
      if (params.skill_id) {
        const updates: any = {};
        if (params.name) updates.name = params.name;
        if (params.description !== undefined) updates.description = params.description;
        if (params.category) updates.category = params.category;
        if (params.level) updates.level = params.level;
        if (params.max_level) updates.max_level = params.max_level;
        await supabase.from("skills" as any).update(updates).eq("id", params.skill_id).eq("user_id", userId);
      }
      break;
    }
    case "update_profile": {
      const allowed = ["display_name", "character_class", "mbti_type", "xp_total", "navi_level", "navi_name", "navi_personality", "equipped_skin", "bond_affection", "bond_trust", "bond_loyalty", "current_streak", "longest_streak"];
      const updates: any = {};
      for (const key of allowed) {
        if (params[key] !== undefined) updates[key] = params[key];
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("id", userId);
        await logActivity(userId, "profile_updated", `Profile updated: ${Object.keys(updates).join(", ")}`, 0);
      }
      break;
    }
    case "create_journal": {
      await supabase.from("journal_entries").insert({
        user_id: userId,
        title: params.title || "New Entry",
        content: params.content || "",
        tags: params.tags || [],
        xp_earned: params.xp_earned || 10,
      });
      await awardXP(userId, params.xp_earned || 10);
      await logActivity(userId, "journal_created", `Journal entry: ${params.title}`, params.xp_earned || 10);
      break;
    }
    case "update_journal": {
      if (params.entry_id) {
        const updates: any = {};
        if (params.title) updates.title = params.title;
        if (params.content !== undefined) updates.content = params.content;
        if (params.tags) updates.tags = params.tags;
        await supabase.from("journal_entries").update(updates).eq("id", params.entry_id).eq("user_id", userId);
      }
      break;
    }
    case "delete_journal": {
      if (params.entry_id) {
        await supabase.from("journal_entries").delete().eq("id", params.entry_id).eq("user_id", userId);
        await logActivity(userId, "journal_deleted", `Journal entry deleted`, 0);
      }
      break;
    }
    default:
      console.warn("Unknown Navi action:", type);
  }
}
