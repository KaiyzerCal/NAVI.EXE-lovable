import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { removeStaleChannel } from "@/lib/realtimeChannel";

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
    const parties = data as Party[];
    if (parties.length === 0) { setOpenParties([]); return; }

    // Two queries total instead of 2 extra round-trips per party
    // (member-count + leader-name lookups inside Promise.all) — this ran on
    // every mount and on every realtime `parties` change.
    const partyIds = parties.map((p) => p.id);
    const leaderIds = [...new Set(parties.map((p) => p.created_by))];

    const [{ data: memberRows }, { data: leaders }] = await Promise.all([
      supabase.from("party_members").select("party_id").in("party_id", partyIds),
      supabase.from("profiles").select("id, display_name").in("id", leaderIds),
    ]);

    const memberCounts = new Map<string, number>();
    for (const row of (memberRows as { party_id: string }[] | null) ?? []) {
      memberCounts.set(row.party_id, (memberCounts.get(row.party_id) ?? 0) + 1);
    }
    const leaderNames = new Map<string, string>();
    for (const l of (leaders as { id: string; display_name: string | null }[] | null) ?? []) {
      leaderNames.set(l.id, l.display_name ?? "Unknown");
    }

    const enriched = parties
      .map((p) => {
        const memberCount = memberCounts.get(p.id) ?? 0;
        if (memberCount >= p.max_members) return null;
        return { ...p, member_count: memberCount, leader_name: leaderNames.get(p.created_by) ?? "Unknown" };
      })
      .filter(Boolean);
    setOpenParties(enriched as any);
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
    removeStaleChannel("open-parties-watch");
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

    const channelName = `party-members-${party.id}`;
    removeStaleChannel(channelName);
    const channel = supabase
      .channel(channelName)
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
    const { error } = await supabase.from("party_members").delete().eq("party_id", party.id).eq("user_id", user.id);
    if (error) {
      console.error("[useParty] leaveParty error:", error);
      toast({ title: "Error", description: "Failed to leave party.", variant: "destructive" });
      return false;
    }
    setParty(null);
    setMembers([]);
    return true;
  }, [user, party]);

  const disbandParty = useCallback(async (): Promise<boolean> => {
    if (!party) return false;
    // Runs as a SECURITY DEFINER RPC, not a direct delete: party_members
    // RLS only allows deleting your *own* row, so a plain
    // `.delete().eq("party_id", ...)` here only ever removed the leader's
    // own membership — every other member was left attached to a party
    // whose status flipped to 'disbanded'. See 20260804030000_*.sql.
    const { error } = await supabase.rpc("disband_party" as any, { p_party_id: party.id });
    if (error) {
      console.error("[useParty] disbandParty error:", error);
      toast({ title: "Error", description: error.message || "Failed to disband party.", variant: "destructive" });
      return false;
    }
    toast({ title: "Party Disbanded" });
    setParty(null);
    setMembers([]);
    return true;
  }, [party]);

  const kickMember = useCallback(async (memberId: string): Promise<void> => {
    // Runs as a SECURITY DEFINER RPC: party_members RLS only allows
    // deleting your own row, so a leader's plain `.delete().eq("id", ...)`
    // matched zero rows for anyone but the target themselves — the "kick"
    // button silently did nothing. See 20260804030000_*.sql.
    const { error } = await supabase.rpc("kick_party_member" as any, { p_member_id: memberId });
    if (error) {
      console.error("[useParty] kickMember error:", error);
      toast({ title: "Error", description: error.message || "Failed to remove member.", variant: "destructive" });
      return;
    }
    // Realtime DELETE event handles the state update
  }, []);

  const completePartyQuest = useCallback(async (): Promise<boolean> => {
    if (!party || !user) return false;
    // Server computes the per-member share from the party's own xp_pool and
    // member count, and awards every member atomically — a client can't
    // supply its own share or award to members it isn't validated against.
    const { data: xpShare, error } = await supabase.rpc("complete_party_quest" as any, { p_party_id: party.id });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to complete party quest.", variant: "destructive" });
      return false;
    }
    const share = xpShare ?? Math.floor(party.xp_pool / Math.max(members.length, 1));
    toast({ title: "Party Quest Complete!", description: `${share} XP awarded to each member.` });
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
