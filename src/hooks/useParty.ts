import { useState, useEffect, useCallback } from "react";
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
  // joined display info
  display_name?: string;
  navi_name?: string;
  operator_level?: number;
}

export interface CreatePartyInput {
  name: string;
  quest_id?: string | null;
  max_members?: number;
}

export function useParty() {
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [openParties, setOpenParties] = useState<(Party & { member_count: number; leader_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyParty = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    // Find my party membership
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

    // Fetch party
    const { data: partyData } = await supabase
      .from("parties")
      .select("*")
      .eq("id", (myMembership as any).party_id)
      .single();

    if (partyData && (partyData as any).status !== "disbanded") {
      setParty(partyData as Party);
      // Fetch members with profile info
      const { data: membersData } = await supabase
        .from("party_members")
        .select("*")
        .eq("party_id", (partyData as any).id);

      if (membersData) {
        // Enrich with profile data
        const enriched = await Promise.all(
          (membersData as PartyMember[]).map(async (m) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, navi_name, operator_level")
              .eq("id", m.user_id)
              .single();
            return { ...m, display_name: profile?.display_name || "Unknown", navi_name: profile?.navi_name || "NAVI", operator_level: profile?.operator_level || 1 };
          })
        );
        setMembers(enriched);
      }
    } else {
      setParty(null);
      setMembers([]);
    }
    setLoading(false);
  }, [user]);

  const fetchOpenParties = useCallback(async () => {
    const { data } = await supabase
      .from("parties")
      .select("*")
      .eq("status", "open")
      .limit(20);

    if (data) {
      const enriched = await Promise.all(
        (data as Party[]).map(async (p) => {
          const { count } = await supabase.from("party_members").select("*", { count: "exact", head: true }).eq("party_id", p.id);
          const memberCount = count || 0;
          // Skip full parties
          if (memberCount >= p.max_members) return null;
          const { data: leaderProfile } = await supabase.from("profiles").select("display_name").eq("id", p.created_by).single();
          return { ...p, member_count: memberCount, leader_name: leaderProfile?.display_name || "Unknown" };
        })
      );
      setOpenParties(enriched.filter(Boolean) as any);
    }
  }, []);

  useEffect(() => { fetchMyParty(); fetchOpenParties(); }, [fetchMyParty, fetchOpenParties]);

  const createParty = useCallback(async (input: CreatePartyInput): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.from("parties").insert({
      name: input.name,
      quest_id: input.quest_id || null,
      created_by: user.id,
      max_members: input.max_members || 4,
    } as any).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    // Add creator as leader
    await supabase.from("party_members").insert({ party_id: (data as any).id, user_id: user.id, role: "leader" } as any);
    toast({ title: "Party Created", description: `${input.name} formed!` });
    await fetchMyParty();
    await fetchOpenParties();
    return true;
  }, [user, fetchMyParty, fetchOpenParties]);

  const joinParty = useCallback(async (partyId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("party_members").insert({ party_id: partyId, user_id: user.id, role: "member" } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    toast({ title: "Joined Party" });
    await fetchMyParty();
    await fetchOpenParties();
    return true;
  }, [user, fetchMyParty, fetchOpenParties]);

  const leaveParty = useCallback(async (): Promise<boolean> => {
    if (!user || !party) return false;
    await supabase.from("party_members").delete().eq("party_id", party.id).eq("user_id", user.id);
    toast({ title: "Left Party" });
    setParty(null);
    setMembers([]);
    await fetchOpenParties();
    return true;
  }, [user, party, fetchOpenParties]);

  const disbandParty = useCallback(async (): Promise<boolean> => {
    if (!party) return false;
    await supabase.from("parties").update({ status: "disbanded" } as any).eq("id", party.id);
    await supabase.from("party_members").delete().eq("party_id", party.id);
    toast({ title: "Party Disbanded" });
    setParty(null);
    setMembers([]);
    await fetchOpenParties();
    return true;
  }, [party, fetchOpenParties]);

  const kickMember = useCallback(async (memberId: string): Promise<void> => {
    if (!party) return;
    await supabase.from("party_members").delete().eq("id", memberId);
    toast({ title: "Member Kicked" });
    await fetchMyParty();
  }, [party, fetchMyParty]);

  const completePartyQuest = useCallback(async (): Promise<boolean> => {
    if (!party || !user) return false;
    const xpShare = Math.floor(party.xp_pool / Math.max(members.length, 1));
    // Award XP to each member
    for (const m of members) {
      const { data: profile } = await supabase.from("profiles").select("operator_xp, xp_total").eq("id", m.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({
          operator_xp: (profile.operator_xp || 0) + xpShare,
          xp_total: (profile.xp_total || 0) + xpShare,
        } as any).eq("id", m.user_id);
      }
    }
    // Complete linked quest if any
    if (party.quest_id) {
      await supabase.from("quests").update({ completed: true, progress: 1, total: 1 } as any).eq("id", party.quest_id);
    }
    // Mark party completed
    await supabase.from("parties").update({ status: "completed" } as any).eq("id", party.id);
    toast({ title: "Party Quest Complete!", description: `${xpShare} XP awarded to each member.` });
    setParty(null);
    setMembers([]);
    await fetchOpenParties();
    return true;
  }, [party, user, members, fetchOpenParties]);

  const myRole = members.find(m => m.user_id === user?.id)?.role || null;

  return {
    party, members, openParties, loading, myRole,
    createParty, joinParty, leaveParty, disbandParty, kickMember, completePartyQuest,
    refetch: async () => { await fetchMyParty(); await fetchOpenParties(); },
  };
}
