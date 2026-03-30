import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Guild {
  id: string;
  name: string;
  description: string;
  tag: string;
  banner_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GuildMember {
  id: string;
  guild_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

export interface CreateGuildInput {
  name: string;
  tag: string;
  description?: string;
  banner_color?: string;
}

export function useGuild(guildId: string | null | undefined) {
  const { user } = useAuth();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<(Guild & { member_count: number })[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchGuild = useCallback(async () => {
    if (!guildId) { setGuild(null); setMembers([]); setLoading(false); return; }
    setLoading(true);
    const [guildRes, membersRes] = await Promise.all([
      supabase.from("guilds").select("*").eq("id", guildId).single(),
      supabase.from("guild_members").select("*").eq("guild_id", guildId),
    ]);
    if (guildRes.data) setGuild(guildRes.data as Guild);
    if (membersRes.data) setMembers(membersRes.data as GuildMember[]);
    setLoading(false);
  }, [guildId]);

  useEffect(() => { fetchGuild(); }, [fetchGuild]);

  const createGuild = useCallback(async (input: CreateGuildInput): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase.from("guilds").insert({
      name: input.name,
      tag: input.tag,
      description: input.description || "",
      banner_color: input.banner_color || "#6366f1",
      created_by: user.id,
    } as any).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return null; }
    const newGuild = data as Guild;
    // Add creator as leader
    await supabase.from("guild_members").insert({ guild_id: newGuild.id, user_id: user.id, role: "leader" } as any);
    // Update profile guild_id
    await supabase.from("profiles").update({ guild_id: newGuild.id } as any).eq("id", user.id);
    toast({ title: "Guild Founded", description: `[${input.tag}] ${input.name} created!` });
    return newGuild.id;
  }, [user]);

  const joinGuild = useCallback(async (targetGuildId: string): Promise<boolean> => {
    if (!user) return false;
    const { error } = await supabase.from("guild_members").insert({ guild_id: targetGuildId, user_id: user.id, role: "member" } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await supabase.from("profiles").update({ guild_id: targetGuildId } as any).eq("id", user.id);
    toast({ title: "Joined Guild" });
    return true;
  }, [user]);

  const leaveGuild = useCallback(async (): Promise<boolean> => {
    if (!user || !guildId) return false;
    await supabase.from("guild_members").delete().eq("guild_id", guildId).eq("user_id", user.id);
    await supabase.from("profiles").update({ guild_id: null } as any).eq("id", user.id);
    setGuild(null); setMembers([]);
    toast({ title: "Left Guild" });
    return true;
  }, [user, guildId]);

  const updateGuild = useCallback(async (updates: Partial<CreateGuildInput>): Promise<boolean> => {
    if (!guildId) return false;
    const { error } = await supabase.from("guilds").update(updates as any).eq("id", guildId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return false; }
    await fetchGuild();
    toast({ title: "Guild Updated" });
    return true;
  }, [guildId, fetchGuild]);

  const disbandGuild = useCallback(async (): Promise<boolean> => {
    if (!guildId || !user) return false;
    // Clear guild_id for all members
    const memberIds = members.map(m => m.user_id);
    if (memberIds.length > 0) {
      await supabase.from("profiles").update({ guild_id: null } as any).in("id", memberIds);
    }
    await supabase.from("guilds").delete().eq("id", guildId);
    setGuild(null); setMembers([]);
    toast({ title: "Guild Disbanded" });
    return true;
  }, [guildId, user, members]);

  const searchGuilds = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("guilds").select("*").or(`name.ilike.%${query}%,tag.ilike.%${query}%`).limit(10);
    if (data) {
      // Get member counts
      const results = await Promise.all((data as Guild[]).map(async (g) => {
        const { count } = await supabase.from("guild_members").select("*", { count: "exact", head: true }).eq("guild_id", g.id);
        return { ...g, member_count: count || 0 };
      }));
      setSearchResults(results);
    }
    setSearching(false);
  }, []);

  const myRole = members.find(m => m.user_id === user?.id)?.role || null;

  return { guild, members, loading, myRole, createGuild, joinGuild, leaveGuild, updateGuild, disbandGuild, searchGuilds, searchResults, searching, refetch: fetchGuild };
}
