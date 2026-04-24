import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Party {
  id: string;
  name: string;
  quest_id: string | null;
  created_by: string;
  max_members: number;
  status: string;
  xp_pool: number;
  created_at: string;
}

export interface PartyMember {
  id: string;
  party_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
  navi_name?: string;
  operator_level?: number;
}

export interface CreatePartyInput {
  name: string;
  quest_id?: string | null;
  max_members?: number;
}

async function enrichMember(m: PartyMember): Promise<PartyMember> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, navi_name, operator_level")
    .eq("id", m.user_id)
    .single();
  return {
    ...m,
    display_name: profile?.display_name ?? "Unknown",
    navi_name: profile?.navi_name ?? "NAVI",
    operator_level: profile?.operator_level ?? 1,
  };
}

export function useParty() {
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [openParties, setOpenParties] = useState<(Party & { member_count: number; leader_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable ref so realtime callbacks don't capture stale party state
  const partyRef = useRef<Party | null>(null);
  partyRef.current = party;

  const fetchOpenParties = useCallback(async () => {
    const { data } = await supabase
      .from("parties")
      .select("*")
      .eq("status", "open")
      .limit(20);

    if (!data) return;

    const enriched = await Promise.all(
      (data as Party[]).map(async (p) => {
        const { count } = await supabase
          .from("party_members")
          .select("*", { count: "exact", head: true })
          .eq("party_id", p.id);
        const memberCount = count ?? 0;
        if (memberCount >= p.max_members) return null;
        const { data: leader } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", p.created_by)
          .single();
        return { ...p, member_count: memberCount, leader_name: leader?.display_name ?? "Unknown" };
      })
    );
    setOpenParties(enriched.filter(Boolean) as any);
  }, []);

  const fetchMyParty = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: myMembership } = await supabase
      .from("party_members")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!myMembership) {
      setParty(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: partyData } = await supabase
      .from("parties")
      .select("*")
      .eq("id", (myMembership as any).party_id)
      .single();

    if (partyData && (partyData as any).status !== "disbanded") {
      setParty(partyData as Party);
      const { data: membersData } = await supabase
        .from("party_members")
        .select("*")
        .eq("party_id", (partyData as any).id);

      if (membersData) {
        const enriched = await Promise.all((membersData as PartyMember[]).map(enrichMember));
        setMembers(enriched);
      }
    } else {
      setParty(null);
      setMembers([]);
    }
    setLoading(false);
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchMyParty();
    fetchOpenParties();
  }, [fetchMyParty, fetchOpenParties]);

  // Realtime: watch open parties list (any party INSERT/UPDATE/DELETE)
  useEffect(() => {
    const channel = supabase
      .channel("open-parties-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parties" },
        () => {
          fetchOpenParties();
          // If our current party's status changed, refresh it
          if (partyRef.current) fetchMyParty();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOpenParties, fetchMyParty]);

  // Realtime: watch party_members for the party we're in
  useEffect(() => {
    if (!party) return;

    const channel = supabase
      .channel(`party-members-${party.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "party_members",
          filter: `party_id=eq.${party.id}`,
        },
        async (payload) => {
          const newMember = payload.new as PartyMember;
          // Don't duplicate ourselves
          setMembers((prev) => {
            if (prev.some((m) => m.id === newMember.id)) return prev;
            // Add placeholder immediately, then enrich
            return [...prev, newMember];
          });
          const enriched = await enrichMember(newMember);
          setMembers((prev) =>
            prev.map((m) => (m.id === enriched.id ? enriched : m))
          );
          if (newMember.user_id !== user?.id) {
            toast({ title: `${enriched.display_name} joined the party` });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "party_members",
          filter: `party_id=eq.${party.id}`,
        },
        (payload) => {
          const removed = payload.old as PartyMember;
          setMembers((prev) => {
            const leaving = prev.find((m) => m.id === removed.id);
            if (leaving && leaving.user_id !== user?.id) {
              toast({ title: `${leaving.display_name ?? "A member"} left the party` });
            }
            return prev.filter((m) => m.id !== removed.id);
          });
          // If we were kicked, clear our party
          if (removed.user_id === user?.id) {
            setParty(null);
            setMembers([]);
            toast({ title: "You were removed from the party" });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [party?.id, user?.id]);

  const createParty = useCallback(async (input: CreatePartyInput): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from("parties")
      .insert({
        name: input.name,
        quest_id: input.quest_id ?? null,
        created_by: user.id,
        max_members: input.max_members ?? 4,
      } as any)
      .select()
      .single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await supabase.from("party_members").insert({ party_id: (data as any).id, user_id: user.id, role: "leader" } as any);
    toast({ title: "Party Created", description: `${input.name} formed!` });
    await fetchMyParty();
    return true;
  }, [user, fetchMyParty]);

  const joinParty = useCallback(async (partyId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("party_members").insert({ party_id: partyId, user_id: user.id, role: "member" } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetchMyParty();
    return true;
  }, [user, fetchMyParty]);

  const leaveParty = useCallback(async (): Promise<boolean> => {
    if (!user || !party) return false;
    await supabase.from("party_members").delete().eq("party_id", party.id).eq("user_id", user.id);
    setParty(null);
    setMembers([]);
    return true;
  }, [user, party]);

  const disbandParty = useCallback(async (): Promise<boolean> => {
    if (!party) return false;
    await supabase.from("parties").update({ status: "disbanded" } as any).eq("id", party.id);
    await supabase.from("party_members").delete().eq("party_id", party.id);
    toast({ title: "Party Disbanded" });
    setParty(null);
    setMembers([]);
    return true;
  }, [party]);

  const kickMember = useCallback(async (memberId: string): Promise<void> => {
    await supabase.from("party_members").delete().eq("id", memberId);
    // Realtime DELETE event handles the state update
  }, []);

  const completePartyQuest = useCallback(async (): Promise<boolean> => {
    if (!party || !user) return false;
    const xpShare = Math.floor(party.xp_pool / Math.max(members.length, 1));
    for (const m of members) {
      const { data: profile } = await supabase.from("profiles").select("operator_xp, xp_total").eq("id", m.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({
          operator_xp: (profile.operator_xp ?? 0) + xpShare,
          xp_total: (profile.xp_total ?? 0) + xpShare,
        } as any).eq("id", m.user_id);
      }
    }
    if (party.quest_id) {
      await supabase.from("quests").update({ completed: true, progress: 1, total: 1 } as any).eq("id", party.quest_id);
    }
    await supabase.from("parties").update({ status: "completed" } as any).eq("id", party.id);
    toast({ title: "Party Quest Complete!", description: `${xpShare} XP awarded to each member.` });
    setParty(null);
    setMembers([]);
    return true;
  }, [party, user, members]);

  const myRole = members.find((m) => m.user_id === user?.id)?.role ?? null;

  return {
    party, members, openParties, loading, myRole,
    createParty, joinParty, leaveParty, disbandParty, kickMember, completePartyQuest,
    refetch: async () => { await fetchMyParty(); await fetchOpenParties(); },
  };
}
