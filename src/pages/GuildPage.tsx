import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import GuildPanel from "@/components/GuildPanel";
import { Shield, Users, Swords, Plus, Loader2, CheckCircle, Download, TrendingUp, Archive, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { useGuild } from "@/hooks/useGuild";
import { usePaywall } from "@/hooks/usePaywall";
import { UnlockWithCoreCard } from "@/components/UnlockWithCoreCard";

const GUILD_XP_PER_LEVEL = 500;
const GUILD_PERKS: Record<number, string[]> = {
  1: ["Basic guild chat"],
  2: ["Guild quests unlocked", "+5% XP for all members"],
  3: ["Guild vault unlocked", "+10% XP for all members"],
  5: ["Guild banner customization", "+15% XP for all members"],
  10: ["Elite guild tag", "+20% XP for all members"],
};

interface VaultItem { name: string; qty: number; deposited_by: string; }

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
  const paywall = usePaywall();
  const guildId = (profile as any).guild_id ?? null;
  const { guild, members, myRole, loading, refetch } = useGuild(guildId);

  const [quests, setQuests] = useState<GuildQuest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestDesc, setNewQuestDesc] = useState("");
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importQuestId, setImportQuestId] = useState("");
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositName, setDepositName] = useState("");
  const [depositQty, setDepositQty] = useState(1);
  const [depositingItem, setDepositingItem] = useState(false);

  const personalQuests = (useAppData() as any).quests as Array<any>;
  const activePersonalQuests = (personalQuests ?? []).filter((q) => !q.completed);

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
        status: "active",
      })
      .select()
      .single();
    if (data) setQuests((prev) => [data, ...prev]);
    setNewQuestTitle("");
    setNewQuestDesc("");
    setShowQuestForm(false);
    setSubmitting(false);
  }

  async function importPersonalQuest() {
    if (!importQuestId || !guild || !user) return;
    const personal = activePersonalQuests.find((q) => q.id === importQuestId);
    if (!personal) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("guild_quests")
      .insert({
        guild_id: guild.id,
        title: personal.name ?? "Quest",
        description: personal.description ?? null,
        created_by: user.id,
        status: "active",
      })
      .select()
      .single();
    if (data) setQuests((prev) => [data, ...prev]);
    setImportQuestId("");
    setShowImport(false);
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

  async function depositItem() {
    if (!depositName.trim() || !guild || !user) return;
    setDepositingItem(true);
    const current: VaultItem[] = (guild as any).vault_items ?? [];
    const next: VaultItem[] = [...current, { name: depositName.trim(), qty: depositQty, deposited_by: (profile as any).display_name ?? "Operator" }];
    await supabase.from("guilds" as any).update({ vault_items: next }).eq("id", guild.id);
    (guild as any).vault_items = next;
    setDepositName("");
    setDepositQty(1);
    setShowDepositForm(false);
    setDepositingItem(false);
    refetch();
  }

  async function removeVaultItem(idx: number) {
    if (!guild) return;
    const current: VaultItem[] = (guild as any).vault_items ?? [];
    const next = current.filter((_, i) => i !== idx);
    await supabase.from("guilds" as any).update({ vault_items: next }).eq("id", guild.id);
    refetch();
  }

  if (!paywall.loading && !paywall.hasFullAccess) {
    return (
      <div>
        <PageHeader title="GUILD" subtitle="// OPERATE IN FORMATION" />
        <UnlockWithCoreCard
          description="Join guilds, run cooperative quests, and operate with other players. Requires Core Operator."
          className="mt-4"
        />
      </div>
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
          {/* Guild Level */}
          {(() => {
            const gXp = (guild as any).guild_xp ?? 0;
            const gLevel = (guild as any).guild_level ?? 1;
            const xpIntoLevel = gXp % GUILD_XP_PER_LEVEL;
            const progress = Math.round((xpIntoLevel / GUILD_XP_PER_LEVEL) * 100);
            const perks = Object.entries(GUILD_PERKS)
              .filter(([lvl]) => Number(lvl) <= gLevel)
              .flatMap(([, p]) => p);
            return (
              <HudCard title="GUILD LEVEL" icon={<TrendingUp size={14} />}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-2xl font-bold text-primary">LVL {gLevel}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{xpIntoLevel} / {GUILD_XP_PER_LEVEL} XP</span>
                </div>
                <div className="h-2 bg-muted/40 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                {perks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-muted-foreground">ACTIVE PERKS</p>
                    {perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px] font-mono text-neon-green">
                        <span className="text-[8px]">✦</span> {perk}
                      </div>
                    ))}
                  </div>
                )}
              </HudCard>
            );
          })()}

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
                  .filter((q) => q.status === "active" || q.status === "open")
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
                ) : showImport ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-[10px] font-mono text-muted-foreground">IMPORT FROM YOUR ACTIVE QUESTS</p>
                    <select value={importQuestId} onChange={(e) => setImportQuestId(e.target.value)}
                      className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40">
                      <option value="">— Select a quest —</option>
                      {activePersonalQuests.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={importPersonalQuest}
                        disabled={submitting || !importQuestId}
                        className="px-3 py-1.5 text-xs font-mono rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1"
                      >
                        {submitting ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
                        IMPORT
                      </button>
                      <button
                        onClick={() => { setShowImport(false); setImportQuestId(""); }}
                        className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                      >
                        CANCEL
                      </button>
                    </div>
                    {activePersonalQuests.length === 0 && (
                      <p className="text-[10px] font-mono text-muted-foreground/70">No active personal quests to import.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3 mt-2">
                    <button
                      onClick={() => setShowQuestForm(true)}
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus size={10} />
                      ADD QUEST
                    </button>
                    <button
                      onClick={() => setShowImport(true)}
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Download size={10} />
                      IMPORT FROM MY QUESTS
                    </button>
                  </div>
                )}
              </div>
            )}
          </HudCard>
          {/* Vault */}
          {(() => {
            const vaultItems: VaultItem[] = (guild as any).vault_items ?? [];
            return (
              <HudCard title="GUILD VAULT" icon={<Archive size={14} />}>
                <p className="text-[10px] font-mono text-muted-foreground mb-3">Shared item storage for guild members</p>
                {vaultItems.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {vaultItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/10">
                        <Archive size={10} className="text-muted-foreground shrink-0" />
                        <span className="text-xs font-body text-foreground flex-1">{item.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">×{item.qty}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/60">by {item.deposited_by}</span>
                        {(myRole === "leader" || myRole === "officer") && (
                          <button onClick={() => removeVaultItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X size={10} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-muted-foreground mb-3">Vault is empty.</p>
                )}
                {showDepositForm ? (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <input value={depositName} onChange={e => setDepositName(e.target.value)}
                      placeholder="Item name..." className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary/40" />
                    <input type="number" min={1} value={depositQty} onChange={e => setDepositQty(Number(e.target.value))}
                      placeholder="Quantity" className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground outline-none focus:border-primary/40" />
                    <div className="flex gap-2">
                      <button onClick={depositItem} disabled={depositingItem || !depositName.trim()}
                        className="px-3 py-1.5 text-xs font-mono rounded border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1">
                        {depositingItem ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} DEPOSIT
                      </button>
                      <button onClick={() => setShowDepositForm(false)} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowDepositForm(true)}
                    className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors">
                    <Plus size={10} /> DEPOSIT ITEM
                  </button>
                )}
              </HudCard>
            );
          })()}
        </div>
      )}
    </div>
  );
}
