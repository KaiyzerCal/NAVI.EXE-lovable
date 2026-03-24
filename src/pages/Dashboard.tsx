import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { motion } from "framer-motion";
import { Swords, Star, BookOpen, Activity, TrendingUp, Zap, MessageSquare, Wifi, Heart } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Suspense } from "react";
import { getNaviCharacter } from "@/components/navi-characters";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/navi-skins`;

export default function Dashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const skinUrl = `${STORAGE_BASE}/${profile.equipped_skin.toLowerCase()}.png`;
  const NaviCharComponent = getNaviCharacter(profile.equipped_skin);
  const bondAvg = Math.round((profile.bond_affection + profile.bond_trust + profile.bond_loyalty) / 3);

  return (
    <div>
      {/* Hero: Navi Partner Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-6 rounded-lg overflow-hidden border border-primary/20 border-glow"
      >
        {/* Transparent backdrop — navi lives in the system */}
        <div className="absolute inset-0 bg-transparent" />

        <div className="relative flex flex-col items-center py-10 px-6">
          {/* Navi Avatar — large, clickable */}
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
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
              <MessageSquare size={32} className="text-primary opacity-0 group-hover:opacity-70 transition-opacity" />
            </div>
          </button>

          {/* Navi Identity */}
          <h2 className="font-display text-xl md:text-2xl text-primary font-bold text-glow-cyan tracking-wider">
            NAVI.EXE
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            LVL {profile.navi_level}/50 // {profile.navi_personality} // SKIN: {profile.equipped_skin}
          </p>

          {/* Partner Bond Bar */}
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

      {/* Operator Status — compact row */}
      <motion.div {...fadeIn} className="bg-card border border-primary/20 rounded p-4 mb-6 border-glow">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Zap className="text-primary" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm text-primary font-bold">{profile.display_name || "OPERATOR"}</span>
              <span className="text-xs font-mono text-muted-foreground">// LVL 12</span>
              {profile.character_class && (
                <span className="text-[10px] font-mono bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">{profile.character_class.toUpperCase()}</span>
              )}
            </div>
            <ProgressBar value={2450} max={3000} variant="cyan" label="XP TO NEXT LEVEL" size="md" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-display text-2xl text-primary font-bold text-glow-cyan">12</p>
            <p className="text-[10px] font-mono text-muted-foreground">LEVEL</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "ACTIVE QUESTS", value: "7", icon: <Swords size={16} />, color: "text-neon-amber" },
          { label: "SKILLS UNLOCKED", value: "23", icon: <Star size={16} />, color: "text-neon-purple" },
          { label: "JOURNAL ENTRIES", value: "48", icon: <BookOpen size={16} />, color: "text-neon-green" },
          { label: "STREAK", value: "14d", icon: <Activity size={16} />, color: "text-neon-cyan" },
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
              {[
                { name: "Morning Routine Protocol", progress: 5, total: 7, type: "Daily" },
                { name: "Read 30 Pages", progress: 22, total: 30, type: "Daily" },
                { name: "Complete Side Project MVP", progress: 3, total: 10, type: "Epic" },
                { name: "Meditate 10 min", progress: 1, total: 1, type: "Daily" },
              ].map((quest) => (
                <div key={quest.name} className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    quest.type === "Epic" ? "bg-neon-purple/10 text-neon-purple" : "bg-neon-amber/10 text-neon-amber"
                  }`}>
                    {quest.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-body">{quest.name}</p>
                    <ProgressBar 
                      value={quest.progress} 
                      max={quest.total} 
                      variant={quest.progress === quest.total ? "green" : "amber"} 
                      showValue={false} 
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {quest.progress}/{quest.total}
                  </span>
                </div>
              ))}
            </div>
          </HudCard>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.25 }}>
          <HudCard title="RECENT ACTIVITY" icon={<TrendingUp size={14} />} glow>
            <div className="space-y-3">
              {[
                { action: "Completed quest: Morning Routine", time: "2h ago", xp: "+50 XP" },
                { action: "New journal entry: Reflection", time: "5h ago", xp: "+10 XP" },
                { action: "Skill leveled up: Focus", time: "1d ago", xp: "+100 XP" },
                { action: "Streak bonus unlocked!", time: "1d ago", xp: "+200 XP" },
                { action: "New quest started: Build MVP", time: "2d ago", xp: "" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body truncate">{item.action}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{item.time}</p>
                  </div>
                  {item.xp && (
                    <span className="text-xs font-mono text-neon-green shrink-0">{item.xp}</span>
                  )}
                </div>
              ))}
            </div>
          </HudCard>
        </motion.div>
      </div>
    </div>
  );
}
