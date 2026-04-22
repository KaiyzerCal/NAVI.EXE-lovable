import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalInput {
  title: string;
  content: string;
  tags: string[];
  xp_earned?: number;
}

export interface UpdateJournalInput extends Partial<CreateJournalInput> {}

export function useJournal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("[useJournal] load error:", error);
        else setEntries((data as JournalEntry[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  // ── Create ────────────────────────────────────────────────────────────────
  const createEntry = useCallback(
    async (input: CreateJournalInput): Promise<JournalEntry | null> => {
      if (!user) return null;
      const xp = input.xp_earned ?? 10;

      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: input.title.trim(),
          content: input.content.trim(),
          tags: input.tags,
          xp_earned: xp,
        })
        .select()
        .single();

      if (error) {
        console.error("[useJournal] create error:", error);
        toast({ title: "Error", description: "Failed to save journal entry.", variant: "destructive" });
        return null;
      }

      const entry = data as JournalEntry;
      setEntries((prev) => [entry, ...prev]);

      // Award XP atomically via RPC — no race condition
      const { error: xpErr } = await supabase.rpc("award_xp", { _amount: xp });
      if (xpErr) {
        console.error("[useJournal] XP award failed:", xpErr);
        toast({
          title: "Entry saved",
          description: `Entry saved, but ${xp} XP failed to apply.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Entry saved", description: `+${xp} XP earned.` });
      }
      return entry;
    },
    [user]
  );

  // ── Update ────────────────────────────────────────────────────────────────
  const updateEntry = useCallback(
    async (id: string, input: UpdateJournalInput): Promise<void> => {
      if (!user) return;
      // Optimistic
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...input } : e))
      );
      const { error } = await supabase
        .from("journal_entries")
        .update(input as any)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[useJournal] update error:", error);
        toast({ title: "Error", description: "Failed to update entry.", variant: "destructive" });
      }
    },
    [user]
  );

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteEntry = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;
      setEntries((prev) => prev.filter((e) => e.id !== id));
      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[useJournal] delete error:", error);
        toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
      }
    },
    [user]
  );

  // ── Refetch (for external mutations like Navi actions) ─────────────────
  const refetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setEntries(data as JournalEntry[]);
  }, [user]);

  return { entries, loading, createEntry, updateEntry, deleteEntry, refetch };
}
