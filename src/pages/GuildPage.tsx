import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import GuildPanel from "@/components/GuildPanel";
import { Shield, Users, Swords, Plus, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useGuild } from "@/hooks/useGuild";

interface GuildQuest {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_by: string;
  completed_by: string | null;
  created_at: string;
}

export default function GuildPage() {
  const { user } = useAuth();
  const { profile, updateProfile, refetchProfile } = useAppData();
  const guildId = (profile as any).guild_id ?? null;
  const { guild, members, myRole, loading, refetch } = useGuild(guildId);

  const [quests, setQuests] = useState<GuildQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (guild) loadQuests();
  }, [guild?.id]);

  async function loadQuests() {
    if (!guild) return;
    setQuestsLoading(true);
    const { data } = await supabase
      .from("guild_quests")
      .select("*")
      .eq("guild_id", guild.id)
      .order("created_at", { ascending: false });
    setQuests(data ?? []);
    setQuestsLoading(false);
  }

  async function addQuest() {
    if (!newQuestTitle.trim() || !guild || !user) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("guild_quests")
      .insert({
        guild_id: guild.id,
        title: newQuestTitle.trim(),
        description: newQuestDesc.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();
    if (data) setQuests((prev) => [data, ...prev]);
    setNewQuestTitle("");
    setNewQuestDesc("");
    setShowQuestForm(false);
    setSubmitting(false);
  }

  async function completeQuest(questId: string) {
    if (!user) return;
    await supabase
      .from("guild_quests")
      .update({ status: "completed", completed_by: user.id, completed_at: new Date().toISOString() } as any)
      .eq("id", questId);
    setQuests((prev) =>
      prev.map((q) => q.id === questId ? { ...q, status: "completed", completed_by: user.id } : q)
    );
  }

  return (
    <div>
      <PageHeader title="GUILD" subtitle="// OPERATE IN FORMATION" />

      {/* Guild panel handles create/join/search/edit/leave/disband */}
      <div className="mb-5">
        <GuildPanel guildId={guildId} onGuildChange={() => refetchProfile()} />
      </div>

      {guild && !loading && (
        <div className="space-y-5">
          {/* Roster */}
          <HudCard title={`ROSTER (${members.length})`} icon={<Users size={14} />}>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 py-1">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.role === "leader" ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  <span className="text-xs font-body flex-1 text-foreground">
                    {(m as any).display_name ?? "Operator"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">{m.role}</span>
                  {m.user_id === user?.id && (
                    <span className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">YOU</span>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs font-mono text-muted-foreground">No members loaded.</p>
              )}
            </div>
          </HudCard>

          {/* Guild Quests */}
          <HudCard title="GUILD QUESTS" icon={<Swords size={14} />}>
            {questsLoading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                {quests
                  .filter((q) => q.status === "active")
                  .map((quest) => (
                    <div key={quest.id} className="flex items-start gap-2 p-2 rounded border border-border bg-muted/10">
                      <div className="flex-1">
                        <p className="text-xs font-body text-foreground">{quest.title}</p>
                        {quest.description && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{quest.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => completeQuest(quest.id)}
                        className="shrink-0 text-muted-foreground hover:text-neon-green transition-colors mt-0.5"
                        title="Mark complete"
                      >
                        <CheckCircle size={14} />
                      </button>
                    </div>
                  ))}

                {quests.filter((q) => q.status === "completed").length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-[9px] font-mono text-muted-foreground mb-1">COMPLETED</p>
                    {quests
                      .filter((q) => q.status === "completed")
                      .map((quest) => (
                        <div key={quest.id} className="flex items-center gap-2 py-1 opacity-50">
                          <CheckCircle size={10} className="text-neon-green shrink-0" />
                          <p className="text-[10px] font-mono text-muted-foreground line-through">{quest.title}</p>
                        </div>
                      ))}
                  </div>
                )}

                {quests.length === 0 && !showQuestForm && (
                  <p className="text-xs font-mono text-muted-foreground">No active guild quests.</p>
                )}

                {showQuestForm ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <input
                      value={newQuestTitle}
                      onChange={(e) => setNewQuestTitle(e.target.value)}
                      placeholder="Quest title..."
                      className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary/40"
                    />
                    <input
                      value={newQuestDesc}
                      onChange={(e) => setNewQuestDesc(e.target.value)}
                      placeholder="Description (optional)..."
                      className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addQuest}
                        disabled={submitting || !newQuestTitle.trim()}
                        className="px-3 py-1.5 text-xs font-mono rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        {submitting ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                        ADD
                      </button>
                      <button
                        onClick={() => setShowQuestForm(false)}
                        className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowQuestForm(true)}
                    className="mt-2 flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Plus size={10} />
                    ADD QUEST
                  </button>
                )}
              </div>
            )}
          </HudCard>
        </div>
      )}
    </div>
  );
}
