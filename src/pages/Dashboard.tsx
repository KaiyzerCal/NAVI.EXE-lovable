import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Swords, Star, BookOpen, Activity, TrendingUp, Zap, MessageSquare, Wifi, Heart, Loader2, Snowflake, Shield, X, Coins, Cpu } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useNavigate } from "react-router-dom";
import { Suspense, useState } from "react";
import { getNaviCharacter } from "@/components/navi-characters";
import { useNaviRenderMode } from "@/hooks/useNaviRenderMode";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/navi-skins`;

// XP needed per level (simple linear scale)
const xpForLevel = (level: number) => level * 500;

export default function Dashboard() {
  const { profile, profileLoading, quests, questsLoading, questStats: stats, entries, journalLoading, refetchProfile } = useAppData();
  const navigate = useNavigate();
  const [naviRenderMode] = useNaviRenderMode();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [usingFreeze, setUsingFreeze] = useState(false);
  const [briefingDismissed, setBriefingDismissed] = useState(
    () => sessionStorage.getItem("navi_briefing_dismissed") === "true"
  );

  const handleUseFreeze = async () => {
    setUsingFreeze(true);
    try {
      const token = session?.access_token;
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/navi-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ actions: [{ type: "use_streak_freeze", params: {} }] }),
      });
      await refetchProfile();
      toast({ title: "Streak Freeze Used", description: "Your streak is protected for today." });
    } finally {
      setUsingFreeze(false);
    }
  };

  const loading = profileLoading || questsLoading || journalLoading;

  const skinUrl = `${STORAGE_BASE}/${profile.equipped_skin.toLowerCase()}.png`;
  const NaviCharComponent = getNaviCharacter(profile.equipped_skin);
  const bondAvg = Math.round((profile.bond_affection + profile.bond_trust + profile.bond_loyalty) / 3);
  const operatorXp = profile.operator_xp ?? profile.xp_total ?? 0;
  const operatorLevel = profile.operator_level ?? 1;

  const activeQuests = quests.filter((q) => !q.completed).slice(0, 4);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "MORNING" : hour < 18 ? "AFTERNOON" : "EVENING";

  const dismissBriefing = () => {
    sessionStorage.setItem("navi_briefing_dismissed", "true");
    setBriefingDismissed(true);
  };

  // Build recent activity from real data — latest journal entries + recently completed quests
  const recentActivity = [
    ...entries.slice(0, 3).map((e) => ({
      action: `Journal entry: ${e.title}`,
      time: new Date(e.created_at).toLocaleDateString(),
      xp: `+${e.xp_earned} XP`,
    })),
    ...quests
      .filter((q) => q.completed)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .map((q) => ({
        action: `Completed quest: ${q.name}`,
        time: new Date(q.updated_at).toLocaleDateString(),
        xp: `+${q.xp_reward} XP`,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="ml-3 text-xs font-mono text-muted-foreground">Syncing operator data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Currency HUD */}
      <motion.div
        {...fadeIn}
        className="mb-4 cursor-pointer"
        onClick={() => navigate("/upgrade")}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/5 text-amber-400 text-xs font-mono">
            <Coins size={13} />
            <span>{(profile.cali_coins ?? 0).toLocaleString()} CALI</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-400/5 text-purple-400 text-xs font-mono">
            <Cpu size={13} />
            <span>{(profile.codex_points ?? 0).toLocaleString()} CODEX</span>
          </div>
        </div>
        <p className="text-[10px] font-mono text-muted-foreground mt-1.5">EARN BY COMPLETING QUESTS</p>
      </motion.div>

      {/* Daily Briefing */}
      {!briefingDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4"
        >
          <button
            onClick={dismissBriefing}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss briefing"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <MessageSquare size={16} className="text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-primary font-bold mb-2">
                GOOD {timeOfDay}, {(profile.display_name || "OPERATOR").toUpperCase()}.
              </p>
              <ul className="space-y-1">
                {profile.current_streak > 0 && (
                  <li className="text-xs font-mono text-muted-foreground">
                    🔥 {profile.current_streak}-day streak active. Keep it going.
                  </li>
                )}
                {stats.active > 0 ? (
                  <li className="text-xs font-mono text-muted-foreground">
                    ⚔ {stats.active} active quest{stats.active !== 1 ? "s" : ""}. Ready to advance.
                  </li>
                ) : (
                  <li className="text-xs font-mono text-muted-foreground">
                    No active quests. Tell NAVI what you want to achieve.
                  </li>
                )}
                {entries.length === 0 && (
                  <li className="text-xs font-mono text-muted-foreground">
                    No journal entries yet. Start logging your progress.
                  </li>
                )}
              </ul>
              <button
                onClick={() => navigate("/mavis")}
                className="mt-3 px-3 py-1 rounded border border-primary/40 bg-primary/10 text-primary text-[11px] font-mono hover:bg-primary/20 transition-colors"
              >
                TALK TO NAVI
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero: Navi Partner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6 rounded-lg overflow-hidden border border-primary/20 border-glow"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-card to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col items-center py-10 px-6">
          <button
            onClick={() => navigate("/navi")}
            className="w-32 h-32 rounded-full bg-primary/5 border-2 border-primary/30 flex items-center justify-center glow-cyan mb-4 relative overflow-hidden cursor-pointer hover:border-primary/60 transition-all group"
          >
            {naviRenderMode === "SVG" && NaviCharComponent ? (
              <Suspense fallback={<div className="w-24 h-24" />}>
                <NaviCharComponent size={100} animated />
              </Suspense>
            ) : (
              <img src={skinUrl} alt="NAVI" className="w-24 h-24 object-contain group-hover:scale-105 transition-transform" />
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
              <Wifi size={8} className="text-background" />
            </div>
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center">
              <MessageSquare size={20} className="text-primary opacity-0 group-hover:opacity-70 transition-opacity" />
            </div>
          </button>
          <h2 className="font-display text-xl text-primary font-bold text-glow-cyan mb-1">
            {profile.navi_name || "NAVI.EXE"}
          </h2>
          <p className="text-xs font-mono text-muted-foreground mb-1">
            LVL {profile.navi_level} // {profile.equipped_skin} // BOND {bondAvg}%
          </p>
          <div className="flex items-center gap-2 text-xs font-mono mb-4">
            <Heart size={10} className="text-neon-purple" />
            <span className="text-muted-foreground">Streak</span>
            <span className="text-neon-amber">{profile.current_streak}d</span>
            {profile.navi_personality && (
              <>
                <span className="text-muted-foreground mx-1">·</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/20 text-muted-foreground border border-muted/30">
                  {profile.navi_personality.toUpperCase()}
                </span>
              </>
            )}
          </div>
          {/* Bond breakdown bars */}
          <div className="w-full max-w-xs space-y-2">
            {[
              { label: "AFFECTION", value: profile.bond_affection, color: "bg-neon-purple", textColor: "text-neon-purple" },
              { label: "TRUST",     value: profile.bond_trust,     color: "bg-cyan-400",    textColor: "text-cyan-400" },
              { label: "LOYALTY",   value: profile.bond_loyalty,   color: "bg-neon-green",  textColor: "text-neon-green" },
            ].map(({ label, value, color, textColor }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
                  <span className={`text-[10px] font-mono ${textColor}`}>{value ?? 0}%</span>
                </div>
                <div className="h-0.5 rounded-full bg-muted/20 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(value ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Operator XP Bar */}
      <motion.div {...fadeIn} className="bg-card border border-primary/20 rounded p-4 mb-6 border-glow">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Zap className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm text-primary font-bold">{profile.display_name || "OPERATOR"}</span>
              <span className="text-xs font-mono text-muted-foreground">// LVL {operatorLevel}</span>
              {profile.character_class && (
                <span className="text-[10px] font-mono bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">
                  {profile.character_class.toUpperCase()}
                </span>
              )}
              {profile.subclass && (
                <span className="text-[10px] font-mono bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded">
                  {profile.subclass}
                </span>
              )}
            </div>
            <ProgressBar value={operatorXp} max={xpForLevel(operatorLevel + 1)} variant="cyan" label={`${operatorXp.toLocaleString()} / ${xpForLevel(operatorLevel + 1).toLocaleString()} XP`} size="md" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display text-2xl text-primary font-bold text-glow-cyan">{operatorLevel}</p>
            <p className="text-[10px] font-mono text-muted-foreground">LEVEL</p>
          </div>
        </div>
      </motion.div>

      {/* Streak Freeze */}
      {((profile as any).streak_freeze_count > 0 || profile.current_streak > 0) && (
        <motion.div {...fadeIn} className="bg-card border border-blue-400/20 rounded p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Snowflake size={18} className="text-blue-400" />
              <div>
                <p className="text-[10px] font-mono text-blue-400 leading-none">STREAK FREEZE</p>
                <p className="font-display text-xl font-bold text-blue-400">{(profile as any).streak_freeze_count ?? 0}</p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-muted-foreground">Protects your streak if you miss a day. Earned every 7-day milestone.</p>
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">Earn 1 freeze every 7 days</p>
            </div>
            <button
              onClick={handleUseFreeze}
              disabled={usingFreeze || ((profile as any).streak_freeze_count ?? 0) === 0}
              className="shrink-0 px-3 py-1.5 rounded border border-blue-400/40 bg-blue-400/10 text-blue-400 text-[11px] font-mono hover:bg-blue-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Shield size={12} />
              {usingFreeze ? "USING..." : "USE FREEZE"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "ACTIVE QUESTS",   value: stats.active,            icon: <Swords size={16} />,   color: "text-neon-amber" },
          { label: "QUESTS DONE",     value: stats.completed,         icon: <Star size={16} />,     color: "text-neon-purple" },
          { label: "JOURNAL ENTRIES", value: entries.length,          icon: <BookOpen size={16} />, color: "text-neon-green" },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
        <motion.div {...fadeIn} transition={{ delay: 3 * 0.05 }}>
          <HudCard title="STREAK" icon={<Activity size={16} />}>
            <p className="font-display text-2xl font-bold text-neon-cyan">{profile.current_streak}d</p>
            {(profile as any).streak_freeze_count > 0 && (
              <span className="text-[9px] font-mono text-blue-400 mt-1 block">
                {(profile as any).streak_freeze_count} FREEZE{(profile as any).streak_freeze_count !== 1 ? "S" : ""} AVAILABLE
              </span>
            )}
          </HudCard>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          <HudCard title="ACTIVE QUESTS" icon={<Swords size={14} />} glow>
            {activeQuests.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No active quests — <button onClick={() => navigate("/quests")} className="text-primary hover:underline">create one</button></p>
            ) : (
              <div className="space-y-3">
                {activeQuests.map((quest) => (
                  <div key={quest.id} className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                      quest.type === "Main" ? "bg-accent/10 text-accent" :
                      quest.type === "Side" ? "bg-neon-purple/10 text-neon-purple" :
                      "bg-neon-amber/10 text-neon-amber"
                    }`}>{quest.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body truncate">{quest.name}</p>
                      <ProgressBar value={quest.progress} max={quest.total} variant={quest.progress === quest.total ? "green" : "amber"} showValue={false} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{quest.progress}/{quest.total}</span>
                  </div>
                ))}
              </div>
            )}
          </HudCard>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <HudCard title="RECENT ACTIVITY" icon={<TrendingUp size={14} />} glow>
            {recentActivity.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground">No activity yet. Complete quests or write journal entries.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body truncate">{item.action}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{item.time}</p>
                    </div>
                    {item.xp && <span className="text-xs font-mono text-neon-green shrink-0">{item.xp}</span>}
                  </div>
                ))}
              </div>
            )}
          </HudCard>
        </motion.div>
      </div>
    </div>
  );
}
