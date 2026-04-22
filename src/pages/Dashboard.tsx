import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Swords, Star, BookOpen, Activity, TrendingUp, Zap, MessageSquare, Wifi, Heart, Loader2 } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { getNaviCharacter } from "@/components/navi-characters";
import NaviErrorBoundary from "@/components/NaviErrorBoundary";

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } };
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/navi-skins`;

// XP needed per level (simple linear scale)
const xpForLevel = (level: number) => level * 500;

export default function Dashboard() {
  const { profile, profileLoading, quests, questsLoading, questStats: stats, entries, journalLoading } = useAppData();
  const navigate = useNavigate();

  const loading = profileLoading || questsLoading || journalLoading;

  const skinUrl = `${STORAGE_BASE}/${profile.equipped_skin.toLowerCase()}.png`;
  const NaviCharComponent = getNaviCharacter(profile.equipped_skin);
  const bondAvg = Math.round((profile.bond_affection + profile.bond_trust + profile.bond_loyalty) / 3);
  const operatorXp = profile.operator_xp ?? profile.xp_total ?? 0;
  const operatorLevel = profile.operator_level ?? 1;

  const activeQuests = quests.filter((q) => !q.completed).slice(0, 4);

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
            {NaviCharComponent ? (
              <NaviErrorBoundary size={100}>
                <Suspense fallback={<div className="w-24 h-24" />}>
                  <NaviCharComponent size={100} animated />
                </Suspense>
              </NaviErrorBoundary>
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
          <div className="flex items-center gap-2 text-xs font-mono">
            <Heart size={10} className="text-neon-purple" />
            <span className="text-muted-foreground">Bond</span>
            <span className="text-primary">{bondAvg}%</span>
            <span className="text-muted-foreground mx-1">·</span>
            <span className="text-muted-foreground">Streak</span>
            <span className="text-neon-amber">{profile.current_streak}d</span>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "ACTIVE QUESTS",   value: stats.active,            icon: <Swords size={16} />,   color: "text-neon-amber" },
          { label: "QUESTS DONE",     value: stats.completed,         icon: <Star size={16} />,     color: "text-neon-purple" },
          { label: "JOURNAL ENTRIES", value: entries.length,          icon: <BookOpen size={16} />, color: "text-neon-green" },
          { label: "STREAK",          value: `${profile.current_streak}d`, icon: <Activity size={16} />, color: "text-neon-cyan" },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeIn} transition={{ delay: i * 0.05 }}>
            <HudCard title={stat.label} icon={stat.icon}>
              <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </HudCard>
          </motion.div>
        ))}
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
