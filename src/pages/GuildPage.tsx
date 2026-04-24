import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Shield, Users, Plus, Loader2, Check, Crown, Sword } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

interface Guild {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  banner_color: string;
  member_count: number;
  created_at: string;
}

interface GuildMember {
  user_id: string;
  role: string;
  display_name: string | null;
  operator_level: number;
}

export default function GuildPage() {
  const { user } = useAuth();
  const { profile } = useAppData();
  const [loading, setLoading] = useState(true);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [members, setMembers] = useState<GuildMember[]>([]);
  const [allGuilds, setAllGuilds] = useState<Guild[]>([]);
  const [tab, setTab] = useState<"guild" | "browse">("guild");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    // Check if user is in a guild
    const { data: memberRow } = await supabase
      .from("guild_members")
      .select("guild_id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (memberRow) {
      const { data: guild } = await supabase
        .from("guilds")
        .select("*")
        .eq("id", memberRow.guild_id)
        .single();
      setMyGuild(guild);

      // Load members with profile info
      const { data: gMembers } = await supabase
        .from("guild_members")
        .select("user_id, role, profiles(display_name, operator_level)")
        .eq("guild_id", memberRow.guild_id);

      setMembers((gMembers ?? []).map((m: any) => ({
        user_id: m.user_id,
        role: m.role,
        display_name: m.profiles?.display_name ?? null,
        operator_level: m.profiles?.operator_level ?? 1,
      })));
    }

    // Load all guilds for browsing
    const { data: guilds } = await supabase
      .from("guilds")
      .select("*")
      .order("member_count", { ascending: false })
      .limit(20);
    setAllGuilds(guilds ?? []);
    setLoading(false);
  }

  async function createGuild() {
    if (!newName.trim() || !user) return;
    setCreating(true);
    const { data: guild, error } = await supabase
      .from("guilds")
      .insert({ name: newName.trim(), description: newDesc.trim() || null, owner_id: user.id })
      .select()
      .single();

    if (!error && guild) {
      await supabase.from("guild_members").insert({ guild_id: guild.id, user_id: user.id, role: "owner" });
      setMyGuild(guild);
      setNewName("");
      setNewDesc("");
    }
    setCreating(false);
  }

  async function joinGuild(guildId: string) {
    if (!user) return;
    setJoining(guildId);
    await supabase.from("guild_members").insert({ guild_id: guildId, user_id: user.id, role: "member" });
    await supabase.from("guilds").update({ member_count: allGuilds.find((g) => g.id === guildId)!.member_count + 1 }).eq("id", guildId);
    await loadData();
    setJoining(null);
    setTab("guild");
  }

  async function leaveGuild() {
    if (!myGuild || !user) return;
    await supabase.from("guild_members").delete().eq("guild_id", myGuild.id).eq("user_id", user.id);
    setMyGuild(null);
    setMembers([]);
    await loadData();
  }

  const roleIcon = (role: string) =>
    role === "owner" ? <Crown size={10} className="text-primary" /> :
    role === "officer" ? <Shield size={10} className="text-secondary" /> :
    <Sword size={10} className="text-muted-foreground" />;

  return (
    <div>
      <PageHeader title="GUILD" subtitle="// OPERATE IN FORMATION" />

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : myGuild ? (
        <div className="space-y-4">
          {/* Guild header */}
          <div
            className="p-5 rounded-lg border relative overflow-hidden"
            style={{ borderColor: `${myGuild.banner_color}40`, background: `${myGuild.banner_color}08` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: myGuild.banner_color }} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono text-muted-foreground mb-1">// GUILD</p>
                <h2 className="text-xl font-display font-bold text-foreground">{myGuild.name}</h2>
                {myGuild.description && (
                  <p className="text-xs font-body text-muted-foreground mt-1">{myGuild.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <Users size={10} />
                {members.length}
              </div>
            </div>
          </div>

          {/* Members */}
          <HudCard title="ROSTER" icon={<Users size={14} />}>
            <div className="space-y-2">
              {members
                .sort((a, b) => {
                  const r = { owner: 0, officer: 1, member: 2 };
                  return (r[a.role as keyof typeof r] ?? 3) - (r[b.role as keyof typeof r] ?? 3);
                })
                .map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2">
                    {roleIcon(m.role)}
                    <span className="text-xs font-body flex-1">{m.display_name ?? "Operator"}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">LV.{m.operator_level}</span>
                    {m.user_id === user?.id && (
                      <span className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">YOU</span>
                    )}
                  </div>
                ))}
            </div>

            {myGuild.owner_id !== user?.id && (
              <button
                onClick={leaveGuild}
                className="mt-4 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors"
              >
                Leave Guild
              </button>
            )}
          </HudCard>
        </div>
      ) : (
        <div>
          {/* Tabs */}
          <div className="flex gap-0 mb-5 border-b border-border">
            {(["guild", "browse"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                {t === "guild" ? "CREATE" : "BROWSE"}
              </button>
            ))}
          </div>

          {tab === "guild" ? (
            <HudCard title="FOUND A GUILD" icon={<Plus size={14} />}>
              <div className="space-y-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Guild name..."
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-mono text-foreground outline-none focus:border-primary/40"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Guild description (optional)..."
                  rows={3}
                  className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 resize-none"
                />
                <button
                  onClick={createGuild}
                  disabled={creating || !newName.trim()}
                  className="w-full py-2.5 rounded border border-primary/50 bg-primary/10 text-primary text-sm font-mono hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  FOUND GUILD
                </button>
              </div>
            </HudCard>
          ) : (
            <div className="space-y-3">
              {allGuilds.map((guild) => (
                <motion.div
                  key={guild.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${guild.banner_color}20`, border: `1px solid ${guild.banner_color}40` }}>
                    <Shield size={16} style={{ color: guild.banner_color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-display font-bold">{guild.name}</p>
                    {guild.description && <p className="text-xs font-body text-muted-foreground">{guild.description}</p>}
                    <p className="text-[10px] font-mono text-muted-foreground">{guild.member_count} MEMBERS</p>
                  </div>
                  <button
                    onClick={() => joinGuild(guild.id)}
                    disabled={joining === guild.id}
                    className="px-3 py-1.5 text-xs font-mono rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                  >
                    {joining === guild.id ? <Loader2 size={10} className="animate-spin" /> : "JOIN"}
                  </button>
                </motion.div>
              ))}
              {allGuilds.length === 0 && (
                <p className="text-center text-xs font-mono text-muted-foreground py-8">No guilds yet. Be the first to found one.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
