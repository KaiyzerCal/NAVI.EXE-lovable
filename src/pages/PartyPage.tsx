import { useState } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { useParty } from "@/hooks/useParty";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Crown, LogOut, Trash2, Swords, Plus, CheckCircle } from "lucide-react";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

export default function PartyPage() {
  const { party, members, openParties, loading, myRole, createParty, joinParty, leaveParty, disbandParty, kickMember, completePartyQuest } = useParty();
  const { quests } = useAppData();
  const activeQuests = quests.filter(q => !q.completed);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [questId, setQuestId] = useState<string | null>(null);
  const [maxMembers, setMaxMembers] = useState(4);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setActionLoading(true);
    await createParty({ name, quest_id: questId, max_members: maxMembers });
    setActionLoading(false);
    setShowCreate(false);
    setName("");
    setQuestId(null);
    setMaxMembers(4);
  };

  const handleJoin = async (id: string) => {
    setActionLoading(true);
    await joinParty(id);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="PARTY" subtitle="// COOPERATIVE OPERATIONS" />

      {/* MY PARTY */}
      <HudCard title="MY PARTY" icon={<Users size={14} />} glow className="mb-6">
        {!party ? (
          <div className="space-y-3">
            <p className="text-[10px] font-mono text-muted-foreground">No active party. Form or join one.</p>
            {!showCreate ? (
              <Button variant="outline" size="sm" onClick={() => setShowCreate(true)} className="text-[10px] font-mono">
                <Plus size={10} className="mr-1" /> CREATE PARTY
              </Button>
            ) : (
              <div className="space-y-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Party name..."
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40" />
                <select value={questId || ""} onChange={(e) => setQuestId(e.target.value || null)}
                  className="w-full bg-muted border border-border rounded px-2 py-1.5 text-xs font-body text-foreground outline-none">
                  <option value="">No linked quest</option>
                  {activeQuests.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono text-muted-foreground">MAX MEMBERS</label>
                  <select value={maxMembers} onChange={(e) => setMaxMembers(parseInt(e.target.value))}
                    className="bg-muted border border-border rounded px-2 py-1 text-xs font-body text-foreground outline-none">
                    {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreate} disabled={actionLoading || !name.trim()} className="text-[10px] font-mono">
                    {actionLoading ? <Loader2 className="animate-spin" size={12} /> : "FORM PARTY"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[10px] font-mono">CANCEL</Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-foreground">{party.name}</h3>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                party.status === "open" ? "bg-neon-green/10 text-neon-green" : "bg-primary/10 text-primary"
              }`}>{party.status.toUpperCase()}</span>
            </div>

            {party.quest_id && (
              <p className="text-[10px] font-mono text-muted-foreground">
                <Swords size={10} className="inline mr-1" />
                LINKED QUEST: {quests.find(q => q.id === party.quest_id)?.name || "Unknown"}
              </p>
            )}

            <p className="text-[10px] font-mono text-accent">XP POOL: {party.xp_pool}</p>

            {/* Members */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-muted-foreground">MEMBERS ({members.length}/{party.max_members})</p>
              {members.map(m => (
                <motion.button key={m.id} whileTap={{ scale: 0.99 }} onClick={() => setActiveOperatorId(m.id)} className="w-full text-left flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2">
                    {m.role === "leader" && <Crown size={10} className="text-accent" />}
                    <div>
                      <p className="text-xs font-body">{m.display_name || "Unknown"}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{m.navi_name} · LV{m.operator_level}</p>
                    </div>
                  </div>
                  {myRole === "leader" && m.role !== "leader" && (
                    <button onClick={(e) => { e.stopPropagation(); kickMember(m.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={11} />
                    </button>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {myRole === "leader" && (
                <>
                  <Button size="sm" onClick={async () => { setActionLoading(true); await completePartyQuest(); setActionLoading(false); }}
                    disabled={actionLoading} className="text-[10px] font-mono">
                    <CheckCircle size={10} className="mr-1" /> COMPLETE QUEST
                  </Button>
                  <Button variant="destructive" size="sm" onClick={async () => { setActionLoading(true); await disbandParty(); setActionLoading(false); }}
                    disabled={actionLoading} className="text-[10px] font-mono">
                    <Trash2 size={10} className="mr-1" /> DISBAND
                  </Button>
                </>
              )}
              {myRole !== "leader" && (
                <Button variant="outline" size="sm" onClick={async () => { setActionLoading(true); await leaveParty(); setActionLoading(false); }}
                  disabled={actionLoading} className="text-[10px] font-mono">
                  <LogOut size={10} className="mr-1" /> LEAVE
                </Button>
              )}
            </div>
          </div>
        )}
      </HudCard>

      {/* OPEN PARTIES */}
      {!party && (
        <HudCard title="OPEN PARTIES" icon={<Swords size={14} />} glow>
          {openParties.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground">No open parties available. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {openParties.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-2">
                  <div>
                    <p className="text-xs font-body font-semibold">{p.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      <Users size={9} className="inline mr-0.5" />{p.member_count}/{p.max_members} · Leader: {p.leader_name}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleJoin(p.id)} disabled={actionLoading} className="text-[10px] font-mono">
                    JOIN
                  </Button>
                </div>
              ))}
            </div>
          )}
        </HudCard>
      )}

      <OperatorProfileSheet operatorId={activeOperatorId || ""} isOpen={Boolean(activeOperatorId)} onClose={() => setActiveOperatorId(null)} />
    </div>
  );
}
