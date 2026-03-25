import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Swords, Star, BookOpen, Activity, TrendingUp, Zap, MessageSquare, Wifi, Heart } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { getNaviCharacter } from "@/components/navi-characters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/navi-skins`;

function getXpForLevel(level: number): number {
  return Math.floor(50 * level * level + 50 * level);
}

interface ActivityItem {
  id: string;
  event_type: string;
  description: string;
  xp_amount: number;
  created_at: string;
}

export default function Dashboard() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const skinUrl = `${STORAGE_BASE}/${profile.equipped_skin.toLowerCase()}.png`;
  const NaviCharComponent = getNaviCharacter(profile.equipped_skin);
  const bondAvg = Math.round((profile.bond_affection + profile.bond_trust + profile.bond_loyalty) / 3);

  const [activeQuests, setActiveQuests] = useState<{ name: string; progress: number; total: number; type: string }[]>([]);
  const [questCount, setQuestCount] = useState(0);
  const [journalCount, setJournalCount] = useState(0);
  const [achievementCount, setAchievementCount] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("quests").select("name, progress, total, type, completed").eq("user_id", user.id),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("achievements").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("unlocked", true),
      supabase.from("skills" as any).select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("activity_log" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]).then(([questsRes, journalRes, achieveRes, skillsRes, activityRes]) => {
      const allQuests = questsRes.data || [];
      const active = allQuests.filter((q: any) => !q.completed);
      setActiveQuests(active.slice(0, 4) as any);
      setQuestCount(active.length);
      setJournalCount(journalRes.count || 0);
      setAchievementCount(achieveRes.count || 0);
      setSkillsCount(skillsRes.count || 0);
      setRecentActivity((activityRes.data || []) as ActivityItem[]);
    });
  }, [user]);

  let operatorLevel = 1;
  while (operatorLevel < 100 && profile.xp_total >= getXpForLevel(operatorLevel)) operatorLevel++;
  const xpCurrent = profile.xp_total - (operatorLevel > 1 ? getXpForLevel(operatorLevel - 1) : 0);
  const xpNeeded = getXpForLevel(operatorLevel) - (operatorLevel > 1 ? getXpForLevel(operatorLevel - 1) : 0);

  return (
    <div>
      {/* Hero: Navi Partner Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6 rounded-lg overflow-hidden border border-primary/20 border-glow"
      >
        <div className="absolute inset-0 bg-transparent" />
        <div className="relative flex flex-col items-center py-10 px-6">
          <button
            onClick={() => navigate("/mavis")}
            className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-transparent border-2 border-primary/15 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all group mb-5"
            title="Chat with your Navi"
          >
            {NaviCharComponent ? (
              <Suspense fallback={<div className="w-40 h-40 md:w-48 md:h-48" />}>
                <NaviCharComponent size={192} animated />
              </Suspense>
            ) : (
              <motion.img
                src={skinUrl}
                alt="NAVI companion"
                className="w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-[0_0_24px_hsl(185,100%,50%,0.4)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-neon-green border-2 border-background flex items-center justify-center">
              <Wifi size={11} className="text-background" />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
              <MessageSquare size={32} className="text-primary opacity-0 group-hover:opacity-70 transition-opacity" />
            </div>
          </button>

          <h2 className="font-display text-xl md:text-2xl text-primary font-bold text-glow-cyan tracking-wider">
            {profile.navi_name}.EXE
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            LVL {profile.navi_level}/100 // {profile.navi_personality} // SKIN: {profile.equipped_skin}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Heart size={12} className="text-secondary" />
            <div className="w-40">
              <ProgressBar value={bondAvg} max={100} variant="purple" showValue={false} />
            </div>
            <span className="text-[10px] font-mono text-secondary">{bondAvg}% BOND</span>
          </div>

          <p className="text-[10px] font-mono text-primary/60 mt-2 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/mavis")}>
            ▶ TAP YOUR NAVI TO START A CONVERSATION
          </p>
        </div>
      </motion.div>

      {/* Operator Status */}
      <motion.div {...fadeIn} className="bg-card border border-primary/20 rounded p-4 mb-6 border-glow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Zap className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm text-primary font-bold">{profile.display_name || "OPERATOR"}</span>
              <span className="text-xs font-mono text-muted-foreground">// LVL {operatorLevel}</span>
              {profile.mbti_type && (
                <span className="text-[10px] font-mono bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">{profile.mbti_type}</span>
              )}
              {profile.character_class && (
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{profile.character_class}</span>
              )}
            </div>
            <ProgressBar value={xpCurrent} max={xpNeeded} variant="cyan" label={`${profile.xp_total} XP TOTAL`} size="md" />
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
          { label: "ACTIVE QUESTS", value: String(questCount), icon: <Swords size={16} />, color: "text-neon-amber" },
          { label: "SKILLS", value: String(skillsCount), icon: <Star size={16} />, color: "text-neon-purple" },
          { label: "JOURNAL ENTRIES", value: String(journalCount), icon: <BookOpen size={16} />, color: "text-neon-green" },
          { label: "STREAK", value: `${profile.current_streak}d`, icon: <Activity size={16} />, color: "text-neon-cyan" },
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
            <div className="space-y-3">
              {activeQuests.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground">No active quests. Start one from the Quests tab.</p>
              ) : (
                activeQuests.map((quest) => (
                  <div key={quest.name} className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      quest.type === "Epic" ? "bg-neon-purple/10 text-neon-purple" : "bg-neon-amber/10 text-neon-amber"
                    }`}>
                      {quest.type}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-body">{quest.name}</p>
                      <ProgressBar value={quest.progress} max={quest.total} variant={quest.progress === quest.total ? "green" : "amber"} showValue={false} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{quest.progress}/{quest.total}</span>
                  </div>
                ))
              )}
            </div>
          </HudCard>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <HudCard title="RECENT ACTIVITY" icon={<TrendingUp size={14} />} glow>
            <div className="space-y-2">
              {recentActivity.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground">No recent activity yet.</p>
              ) : (
                recentActivity.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground truncate mr-2">{item.description}</span>
                    {item.xp_amount > 0 && <span className="text-neon-green shrink-0">+{item.xp_amount} XP</span>}
                  </div>
                ))
              )}
            </div>
          </HudCard>
        </motion.div>
      </div>
    </div>
  );
}
