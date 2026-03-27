import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

// ─── OPERATOR SKILLS (uses existing `skills` table) ───────────────────────────

export interface OperatorSkill {
  id: string;
  user_id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  xp_to_next: number;
  category: string;
  created_at: string;
  updated_at: string;
}

function mapSkillRow(row: any): OperatorSkill {
  return {
    ...row,
    xp_to_next: (row.level ?? 1) * 100,
  };
}

export function useOperatorSkills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<OperatorSkill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setSkills((data ?? []).map(mapSkillRow));
        setLoading(false);
      });
  }, [user]);

  const addSkill = useCallback(
    async (input: { name: string; description?: string; category?: string; level?: number }): Promise<OperatorSkill | null> => {
      if (!user) return null;
      const level = input.level ?? 1;
      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          description: input.description?.trim() ?? "",
          category: input.category ?? "General",
          level,
          xp: 0,
        })
        .select()
        .single();
      if (error) { console.error(error); return null; }
      const skill = mapSkillRow(data);
      setSkills((prev) => [...prev, skill]);
      return skill;
    },
    [user]
  );

  const updateSkill = useCallback(
    async (id: string, updates: Partial<Pick<OperatorSkill, "name" | "description" | "level" | "xp" | "category">>) => {
      if (!user) return;
      setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, xp_to_next: ((updates.level ?? s.level) * 100) } : s)));
      await supabase.from("skills").update(updates as any).eq("id", id).eq("user_id", user.id);
    },
    [user]
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      if (!user) return;
      setSkills((prev) => prev.filter((s) => s.id !== id));
      await supabase.from("skills").delete().eq("id", id).eq("user_id", user.id);
    },
    [user]
  );

  const levelUpByName = useCallback(
    async (name: string, levels = 1): Promise<boolean> => {
      const skill = skills.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!skill) return false;
      const newLevel = Math.min(skill.level + levels, 100);
      await updateSkill(skill.id, { level: newLevel });
      toast({ title: "⬆️ Skill Up!", description: `${skill.name} is now level ${newLevel}.` });
      return true;
    },
    [skills, updateSkill]
  );

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("skills").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    if (data) setSkills(data.map(mapSkillRow));
  }, [user]);

  return { skills, loading, addSkill, updateSkill, deleteSkill, levelUpByName, refetch };
}

// ─── EQUIPMENT (uses existing `equipment` table) ──────────────────────────────

export interface EquipmentItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  slot: string;
  rarity: string;
  effect: string | null;
  equipped: boolean;
  source: string;
  created_at: string;
}

function mapEquipRow(row: any): EquipmentItem {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description ?? "",
    slot: row.slot ?? "accessory",
    rarity: row.rarity ?? "common",
    effect: typeof row.stat_bonuses === "object" && row.stat_bonuses ? JSON.stringify(row.stat_bonuses) : null,
    equipped: row.is_equipped ?? false,
    source: row.obtained_from ?? "manual",
    created_at: row.obtained_at ?? row.created_at ?? new Date().toISOString(),
  };
}

export function useEquipment() {
  const { user } = useAuth();
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("equipment")
      .select("*")
      .eq("user_id", user.id)
      .order("obtained_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error) setItems((data ?? []).map(mapEquipRow));
        setLoading(false);
      });
  }, [user]);

  const addItem = useCallback(
    async (input: {
      name: string;
      description?: string;
      slot?: string;
      rarity?: string;
      effect?: string;
      equipped?: boolean;
      source?: string;
    }): Promise<EquipmentItem | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("equipment")
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          description: input.description?.trim() ?? "",
          slot: input.slot ?? "accessory",
          rarity: input.rarity ?? "common",
          stat_bonuses: input.effect ? { effect: input.effect } : {},
          is_equipped: input.equipped ?? false,
          obtained_from: input.source ?? "manual",
        })
        .select()
        .single();
      if (error) { console.error(error); return null; }
      const item = mapEquipRow(data);
      setItems((prev) => [...prev, item]);
      return item;
    },
    [user]
  );

  const equipItem = useCallback(
    async (id: string) => {
      if (!user) return;
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const sameSlot = items.filter((i) => i.slot === item.slot && i.equipped && i.id !== id);
      for (const other of sameSlot) {
        await supabase.from("equipment").update({ is_equipped: false }).eq("id", other.id);
      }
      await supabase.from("equipment").update({ is_equipped: true }).eq("id", id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, equipped: true } :
          i.slot === item.slot ? { ...i, equipped: false } : i
        )
      );
    },
    [items, user]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Pick<EquipmentItem, "name" | "description" | "slot" | "rarity" | "effect" | "equipped">>) => {
      if (!user) return;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.slot !== undefined) dbUpdates.slot = updates.slot;
      if (updates.rarity !== undefined) dbUpdates.rarity = updates.rarity;
      if (updates.equipped !== undefined) dbUpdates.is_equipped = updates.equipped;
      if (updates.effect !== undefined) dbUpdates.stat_bonuses = updates.effect ? { effect: updates.effect } : {};
      await supabase.from("equipment").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    },
    [user]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!user) return;
      setItems((prev) => prev.filter((i) => i.id !== id));
      await supabase.from("equipment").delete().eq("id", id).eq("user_id", user.id);
    },
    [user]
  );

  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("equipment").select("*").eq("user_id", user.id).order("obtained_at", { ascending: false });
    if (data) setItems(data.map(mapEquipmentRow));
  }, [user]);

  return { items, loading, addItem, equipItem, updateItem, deleteItem, refetch };
}

// ─── ACTIVE EFFECTS (uses existing `buffs` table) ─────────────────────────────

export interface ActiveEffect {
  id: string;
  user_id: string;
  name: string;
  description: string;
  effect_type: string;
  value: number | null;
  expires_at: string | null;
  source: string | null;
  created_at: string;
}

function mapBuffRow(row: any): ActiveEffect {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description ?? "",
    effect_type: row.effect_type ?? "buff",
    value: row.modifier_value ?? null,
    expires_at: row.expires_at ?? null,
    source: row.source ?? null,
    created_at: row.created_at,
  };
}

export function useActiveEffects() {
  const { user } = useAuth();
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("buffs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setEffects((data ?? []).map(mapBuffRow));
        setLoading(false);
      });
  }, [user]);

  const addEffect = useCallback(
    async (input: {
      name: string;
      description?: string;
      effect_type?: string;
      value?: number;
      expires_at?: string;
      source?: string;
    }): Promise<ActiveEffect | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("buffs")
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description ?? "",
          effect_type: input.effect_type ?? "buff",
          modifier_value: input.value ?? 0,
          expires_at: input.expires_at ?? null,
          source: input.source ?? "manual",
        })
        .select()
        .single();
      if (error) { console.error(error); return null; }
      const effect = mapBuffRow(data);
      setEffects((prev) => [effect, ...prev]);
      return effect;
    },
    [user]
  );

  const removeEffect = useCallback(
    async (id: string) => {
      if (!user) return;
      setEffects((prev) => prev.filter((e) => e.id !== id));
      await supabase.from("buffs").delete().eq("id", id).eq("user_id", user.id);
    },
    [user]
  );

  return { effects, loading, addEffect, removeEffect };
}
