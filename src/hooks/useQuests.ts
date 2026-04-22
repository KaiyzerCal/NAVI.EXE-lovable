import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type QuestType = "Daily" | "Weekly" | "Main" | "Side" | "Minor" | "Epic";

export interface Quest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: QuestType;
  progress: number;
  total: number;
  xp_reward: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestInput {
  name: string;
  description?: string;
  type: QuestType;
  total: number;
  xp_reward: number;
}

export interface UpdateQuestInput extends Partial<CreateQuestInput> {
  progress?: number;
  completed?: boolean;
}

export function useQuests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[useQuests] load error:", error);
        else setQuests((data as Quest[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  // ── Create ────────────────────────────────────────────────────────────────
  const createQuest = useCallback(
    async (input: CreateQuestInput): Promise<Quest | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("quests")
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          type: input.type,
          total: input.total,
          xp_reward: input.xp_reward,
          progress: 0,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error("[useQuests] create error:", error);
        toast({ title: "Error", description: "Failed to save quest.", variant: "destructive" });
        return null;
      }
      const quest = data as Quest;
      setQuests((prev) => [quest, ...prev]);
      return quest;
    },
    [user]
  );

  // ── Update ────────────────────────────────────────────────────────────────
  const updateQuest = useCallback(
    async (id: string, input: UpdateQuestInput): Promise<void> => {
      if (!user) return;
      // Optimistic update
      setQuests((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...input } : q))
      );
      const { error } = await supabase
        .from("quests")
        .update(input as any)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[useQuests] update error:", error);
        toast({ title: "Error", description: "Failed to update quest.", variant: "destructive" });
        // Revert on error — re-fetch
        supabase
          .from("quests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .then(({ data }) => { if (data) setQuests(data as Quest[]); });
      }
    },
    [user]
  );

  // ── Toggle complete ───────────────────────────────────────────────────────
  const toggleQuest = useCallback(
    async (id: string): Promise<void> => {
      const quest = quests.find((q) => q.id === id);
      if (!quest) return;
      const nowCompleted = !quest.completed;
      await updateQuest(id, {
        completed: nowCompleted,
        progress: nowCompleted ? quest.total : quest.progress,
      });

      // Award XP to profile when completing
      if (nowCompleted && user) {
        // Atomic XP award via RPC — no race condition
        const { error: xpErr } = await supabase.rpc("award_xp", {
          _amount: quest.xp_reward,
        });
        if (xpErr) {
          console.error("[useQuests] XP award failed:", xpErr);
          toast({
            title: "XP not awarded",
            description: `Quest completed but ${quest.xp_reward} XP failed to save.`,
            variant: "destructive",
          });
        }
      }
    },
    [quests, updateQuest, user]
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteQuest = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      setQuests((prev) => prev.filter((q) => q.id !== id));
      const { error } = await supabase
        .from("quests")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[useQuests] delete error:", error);
        toast({ title: "Error", description: "Failed to delete quest.", variant: "destructive" });
      }
    },
    [user]
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = {
    total: quests.length,
    active: quests.filter((q) => !q.completed).length,
    completed: quests.filter((q) => q.completed).length,
    xpEarned: quests.filter((q) => q.completed).reduce((s, q) => s + q.xp_reward, 0),
  };

  // ── Refetch (for external mutations like Navi actions) ─────────────────
  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setQuests(data as Quest[]);
  }, [user]);

  return { quests, loading, stats, createQuest, updateQuest, toggleQuest, deleteQuest, refetch };
}
