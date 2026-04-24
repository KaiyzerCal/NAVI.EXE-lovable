import { motion } from "framer-motion";
import { Lock, CheckCircle, Zap } from "lucide-react";
import { NAVI_SKILL_UNLOCKS, getUnlockedSkills, getNextUnlock } from "@/lib/naviSkillUnlocks";
import HudCard from "@/components/HudCard";

interface Props {
  naviLevel: number;
  compact?: boolean;
}

export default function NaviMilestones({ naviLevel, compact = false }: Props) {
  const unlocked = new Set(getUnlockedSkills(naviLevel).map((s) => s.level));
  const next = getNextUnlock(naviLevel);

  if (compact) {
    return (
      <div className="space-y-1.5">
        {NAVI_SKILL_UNLOCKS.map((skill) => {
          const isUnlocked = unlocked.has(skill.level);
          const isCurrent = isUnlocked && (!next || skill.level < next.level) &&
            NAVI_SKILL_UNLOCKS.filter((s) => s.level <= naviLevel).at(-1)?.level === skill.level;
          return (
            <div
              key={skill.level}
              className={`flex items-center gap-2 text-xs font-mono transition-opacity ${isUnlocked ? "opacity-100" : "opacity-30"}`}
            >
              {isUnlocked ? (
                <CheckCircle size={10} className="text-neon-green shrink-0" />
              ) : (
                <Lock size={10} className="text-muted-foreground shrink-0" />
              )}
              <span className={isUnlocked ? "text-foreground" : "text-muted-foreground"}>
                {skill.skillName}
              </span>
              <span className="text-muted-foreground/60 ml-auto">LV.{skill.level}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <HudCard title="NAVI SKILL TREE" icon={<Zap size={14} />}>
      {next && (
        <div className="mb-4 p-2 rounded border border-primary/20 bg-primary/5">
          <p className="text-[10px] font-mono text-muted-foreground">NEXT UNLOCK AT LV.{next.level}</p>
          <p className="text-xs font-display text-primary font-bold mt-0.5">{next.skillName}</p>
          <p className="text-[10px] font-body text-muted-foreground">{next.description}</p>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (naviLevel / next.level) * 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-[9px] font-mono text-muted-foreground mt-1">
            LV.{naviLevel} / LV.{next.level}
          </p>
        </div>
      )}

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-3">
          {NAVI_SKILL_UNLOCKS.map((skill, i) => {
            const isUnlocked = unlocked.has(skill.level);
            const isLatestUnlocked =
              isUnlocked &&
              NAVI_SKILL_UNLOCKS.filter((s) => s.level <= naviLevel).at(-1)?.level === skill.level;

            return (
              <motion.div
                key={skill.level}
                className="flex gap-3 relative"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Node */}
                <div className={`
                  relative z-10 w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center border
                  ${isLatestUnlocked
                    ? "bg-primary border-primary shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    : isUnlocked
                    ? "bg-neon-green/20 border-neon-green"
                    : "bg-muted/40 border-border"
                  }
                `}>
                  {isUnlocked ? (
                    <CheckCircle size={10} className={isLatestUnlocked ? "text-black" : "text-neon-green"} />
                  ) : (
                    <Lock size={8} className="text-muted-foreground/50" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-1 ${!isUnlocked ? "opacity-40" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-display font-bold ${isLatestUnlocked ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {skill.skillName}
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground/60 ml-auto">LV.{skill.level}</span>
                    {isLatestUnlocked && (
                      <span className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground leading-snug">{skill.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </HudCard>
  );
}
