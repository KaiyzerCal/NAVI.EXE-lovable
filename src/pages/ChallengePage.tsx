import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Sword, Trophy, Plus, Search, Zap, Clock, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  operator_id: string;
  display_name: string;
  created_at: string;
  metadata: {
    challenger_id: string;
    challenger_name: string;
    challenged_id: string;
    challenged_name: string;
    type: "xp_race" | "quest_count" | "streak_battle";
    target: number;
    duration_days: number;
    status: "pending" | "active" | "completed" | "declined";
    winner_id?: string;
    ends_at: string;
  };
}

const TYPE_LABELS = {
  xp_race: "XP Race",
  quest_count: "Quest Battle",
  streak_battle: "Streak Battle",
};

const TYPE_TARGETS = {
  xp_race: [500, 1000, 2500],
  quest_count: [3, 5, 10],
  streak_battle: [7, 14, 30],
};

const TYPE_UNITS = {
  xp_race: "XP",
  quest_count: "quests",
  streak_battle: "days",
};

export default function ChallengePage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [challengeType, setChallengeType] = useState<"xp_race" | "quest_count" | "streak_battle">("xp_race");
  const [target, setTarget] = useState(1000);
  const [duration, setDuration] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"incoming" | "active" | "history">("incoming");

  useEffect(() => { if (user) loadChallenges(); }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("operator_feed")
      .select("id, operator_id, display_name, created_at, metadata")
      .eq("content_type", "CHALLENGE")
      .or(`operator_id.eq.${user.id},metadata->>challenged_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50);
    setChallenges((data ?? []) as Challenge[]);
    setLoading(false);
  };

  const searchOperators = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("public_profiles" as any)
      .select("id, display_name, operator_level, character_class")
      .ilike("display_name", `%${q}%`)
      .neq("id", user?.id ?? "")
      .limit(5);
    setSearchResults(data ?? []);
    setSearching(false);
  };

  useEffect(() => {
    const t = setTimeout(() => searchOperators(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const sendChallenge = async () => {
    if (!user || !selectedOpponent) return;
    setSubmitting(true);
    const { data: myProfile } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
    const ends_at = new Date(Date.now() + duration * 86400000).toISOString();
    await supabase.from("operator_feed").insert({
      operator_id: user.id,
      display_name: (myProfile as any)?.display_name ?? "Operator",
      content_type: "CHALLENGE",
      content: `Challenge: ${TYPE_LABELS[challengeType]} — ${target} ${TYPE_UNITS[challengeType]}`,
      metadata: {
        challenger_id: user.id,
        challenger_name: (myProfile as any)?.display_name ?? "Operator",
        challenged_id: selectedOpponent.id,
        challenged_name: selectedOpponent.display_name,
        type: challengeType,
        target,
        duration_days: duration,
        status: "pending",
        ends_at,
      },
      is_public: false,
      likes: [],
    });
    toast({ title: "Challenge sent!", description: `${selectedOpponent.display_name} has been challenged.` });
    setShowCreate(false);
    setSelectedOpponent(null);
    setSearchQuery("");
    setSubmitting(false);
    loadChallenges();
  };

  const respondToChallenge = async (challenge: Challenge, accept: boolean) => {
    await supabase.from("operator_feed").update({
      metadata: { ...challenge.metadata, status: accept ? "active" : "declined" },
    }).eq("id", challenge.id);
    toast({ title: accept ? "Challenge accepted!" : "Challenge declined" });
    loadChallenges();
  };

  const incoming = challenges.filter(c => c.metadata?.challenged_id === user?.id && c.metadata?.status === "pending");
  const active = challenges.filter(c => c.metadata?.status === "active");
  const history = challenges.filter(c => ["completed", "declined"].includes(c.metadata?.status));

  const ChallengeCard = ({ c }: { c: Challenge }) => {
    const m = c.metadata;
    const isChallenger = m?.challenger_id === user?.id;
    const myName = isChallenger ? m?.challenger_name : m?.challenged_name;
    const oppName = isChallenger ? m?.challenged_name : m?.challenger_name;
    const daysLeft = Math.max(0, Math.ceil((new Date(m?.ends_at).getTime() - Date.now()) / 86400000));

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border border-border bg-card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-block mb-1">{TYPE_LABELS[m?.type]}</p>
            <p className="text-sm font-body font-semibold">vs <span className="text-primary">{oppName}</span></p>
            <p className="text-[10px] font-mono text-muted-foreground">
              First to {m?.target} {TYPE_UNITS[m?.type]} · {daysLeft}d left
            </p>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            m?.status === "pending" ? "text-neon-amber border-neon-amber/30" :
            m?.status === "active"  ? "text-neon-green border-neon-green/30" :
            m?.status === "declined"? "text-destructive border-destructive/30" :
            "text-muted-foreground border-border"
          }`}>{(m?.status ?? "").toUpperCase()}</span>
        </div>
        {m?.status === "pending" && m?.challenged_id === user?.id && (
          <div className="flex gap-2">
            <button onClick={() => respondToChallenge(c, true)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-neon-green/30 bg-neon-green/10 text-neon-green text-[10px] font-mono hover:bg-neon-green/20 transition-colors">
              <CheckCircle size={10} /> ACCEPT
            </button>
            <button onClick={() => respondToChallenge(c, false)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded border border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-mono hover:bg-destructive/20 transition-colors">
              <XCircle size={10} /> DECLINE
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div>
      <PageHeader title="CHALLENGES" subtitle="// OPERATOR DUELS" />

      <div className="flex gap-2 mb-4 flex-wrap">
        {([["incoming", `INCOMING (${incoming.length})`], ["active", `ACTIVE (${active.length})`], ["history", "HISTORY"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-[10px] font-mono transition-colors ${tab === t ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`}>
            {label}
          </button>
        ))}
        <button onClick={() => setShowCreate(v => !v)}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
          <Plus size={10} />CHALLENGE
        </button>
      </div>

      {showCreate && (
        <HudCard title="SEND CHALLENGE" icon={<Sword size={14} />}>
          <div className="space-y-3">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelectedOpponent(null); }}
                placeholder="Search operator name..." className="w-full bg-muted border border-border rounded pl-8 pr-3 py-2 text-xs font-body text-foreground outline-none focus:border-primary/40" />
            </div>
            {searching && <Loader2 size={12} className="animate-spin text-primary" />}
            {searchResults.length > 0 && !selectedOpponent && (
              <div className="space-y-1 border border-border rounded overflow-hidden">
                {searchResults.map(op => (
                  <button key={op.id} onClick={() => { setSelectedOpponent(op); setSearchQuery(op.display_name); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2 hover:bg-primary/5 transition-colors flex items-center gap-2">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-xs font-body">{op.display_name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">Lvl {op.operator_level}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedOpponent && (
              <p className="text-xs font-mono text-neon-green">Challenging: {selectedOpponent.display_name}</p>
            )}
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1">CHALLENGE TYPE</p>
              <div className="flex gap-2 flex-wrap">
                {(["xp_race", "quest_count", "streak_battle"] as const).map(t => (
                  <button key={t} onClick={() => { setChallengeType(t); setTarget(TYPE_TARGETS[t][1]); }}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${challengeType === t ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1">TARGET</p>
              <div className="flex gap-2">
                {TYPE_TARGETS[challengeType].map(t => (
                  <button key={t} onClick={() => setTarget(t)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${target === t ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    {t} {TYPE_UNITS[challengeType]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground mb-1">DURATION</p>
              <div className="flex gap-2">
                {[1, 3, 7].map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className={`px-2.5 py-1.5 rounded text-[10px] font-mono border transition-all ${duration === d ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={sendChallenge} disabled={!selectedOpponent || submitting}
                className="px-4 py-2 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono hover:bg-primary/20 disabled:opacity-40 transition-colors">
                {submitting ? "SENDING..." : "SEND CHALLENGE"}
              </button>
              <button onClick={() => { setShowCreate(false); setSelectedOpponent(null); setSearchQuery(""); }}
                className="px-4 py-2 rounded bg-muted border border-border text-muted-foreground text-[10px] font-mono">CANCEL</button>
            </div>
          </div>
        </HudCard>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={20} /></div>
        ) : (
          <>
            {tab === "incoming" && (incoming.length === 0
              ? <p className="text-xs font-mono text-muted-foreground text-center py-12">No incoming challenges.</p>
              : incoming.map(c => <ChallengeCard key={c.id} c={c} />)
            )}
            {tab === "active" && (active.length === 0
              ? <p className="text-xs font-mono text-muted-foreground text-center py-12">No active challenges. Send one!</p>
              : active.map(c => <ChallengeCard key={c.id} c={c} />)
            )}
            {tab === "history" && (history.length === 0
              ? <p className="text-xs font-mono text-muted-foreground text-center py-12">No challenge history yet.</p>
              : history.map(c => <ChallengeCard key={c.id} c={c} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}
