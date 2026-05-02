import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, Heart, Brain, Users, Coins, ChevronRight, Zap } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import PageHeader from "@/components/PageHeader";

// ─── Domain definitions ───────────────────────────────────────────────────────

interface DomainRoom {
  id: string;
  name: string;
  icon: React.ReactNode;
  keywords: string[];
  color: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  badgeColor: string;
}

const DOMAIN_ROOMS: DomainRoom[] = [
  {
    id: "career",
    name: "Career",
    icon: <Briefcase size={22} />,
    keywords: ["work", "job", "career", "business", "meeting", "project", "client", "revenue", "sales", "code", "build", "launch", "ship"],
    color: "cyan",
    borderColor: "border-cyan-500",
    glowColor: "shadow-cyan-500/40",
    textColor: "text-cyan-400",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  },
  {
    id: "health",
    name: "Health",
    icon: <Heart size={22} />,
    keywords: ["health", "fitness", "gym", "workout", "run", "sleep", "diet", "nutrition", "exercise", "training", "body", "weight"],
    color: "green",
    borderColor: "border-green-500",
    glowColor: "shadow-green-500/40",
    textColor: "text-green-400",
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/30",
  },
  {
    id: "mind",
    name: "Mind",
    icon: <Brain size={22} />,
    keywords: ["learn", "study", "read", "book", "course", "skill", "knowledge", "meditation", "mindset", "focus", "journal"],
    color: "purple",
    borderColor: "border-purple-500",
    glowColor: "shadow-purple-500/40",
    textColor: "text-purple-400",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "social",
    name: "Social",
    icon: <Users size={22} />,
    keywords: ["friend", "family", "relationship", "social", "network", "community", "team", "party", "event", "connection"],
    color: "amber",
    borderColor: "border-amber-500",
    glowColor: "shadow-amber-500/40",
    textColor: "text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "finance",
    name: "Finance",
    icon: <Coins size={22} />,
    keywords: ["money", "finance", "invest", "save", "budget", "income", "expense", "debt", "crypto", "stock"],
    color: "gold",
    borderColor: "border-amber-400",
    glowColor: "shadow-amber-400/40",
    textColor: "text-amber-400",
    badgeColor: "bg-amber-400/10 text-amber-300 border-amber-400/30",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

type EvolutionLevel = 0 | 1 | 2 | 3;

function getEvolutionLevel(score: number): EvolutionLevel {
  if (score < 2) return 0;
  if (score < 5) return 1;
  if (score < 10) return 2;
  return 3;
}

interface EvolutionStyle {
  border: string;
  shadow: string;
  label: string;
  labelColor: string;
}

function getEvolutionStyle(level: EvolutionLevel, room: DomainRoom): EvolutionStyle {
  switch (level) {
    case 0:
      return {
        border: "border-border",
        shadow: "",
        label: "DORMANT",
        labelColor: "text-muted-foreground",
      };
    case 1:
      return {
        border: `${room.borderColor} border-opacity-30`,
        shadow: "",
        label: "AWAKENING",
        labelColor: room.textColor,
      };
    case 2:
      return {
        border: room.borderColor,
        shadow: `shadow-lg ${room.glowColor}`,
        label: "ACTIVE",
        labelColor: room.textColor,
      };
    case 3:
      return {
        border: room.borderColor,
        shadow: `shadow-xl ${room.glowColor}`,
        label: "EVOLVED",
        labelColor: room.textColor,
      };
  }
}

// ─── Domain Room Card ─────────────────────────────────────────────────────────

interface DomainRoomCardProps {
  room: DomainRoom;
  questCount: number;
  entryCount: number;
  skillCount: number;
  index: number;
  onEnter: () => void;
}

function DomainRoomCard({
  room,
  questCount,
  entryCount,
  skillCount,
  index,
  onEnter,
}: DomainRoomCardProps) {
  const activityScore = questCount + entryCount * 0.5 + skillCount * 0.3;
  const evolutionLevel = getEvolutionLevel(activityScore);
  const style = getEvolutionStyle(evolutionLevel, room);

  const isPulsing = evolutionLevel === 3;
  const isDim = evolutionLevel === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      className={`
        relative bg-card border rounded-sm p-5 flex flex-col gap-4
        ${style.border} ${style.shadow}
        ${isPulsing ? "animate-pulse-border" : ""}
        transition-all duration-500
      `}
    >
      {/* Evolution pulse ring for level 3 */}
      {isPulsing && (
        <motion.div
          className={`absolute inset-0 rounded-sm border ${room.borderColor} pointer-events-none`}
          animate={{ opacity: [0.6, 0.15, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-sm flex items-center justify-center
              ${isDim ? "bg-muted/30 text-muted-foreground" : `bg-card border ${room.borderColor} ${room.textColor}`}
              transition-colors duration-500
            `}
          >
            {room.icon}
          </div>
          <div>
            <h3
              className={`font-display font-bold text-base tracking-wider ${isDim ? "text-muted-foreground" : room.textColor}`}
            >
              {room.name.toUpperCase()}
            </h3>
            <span
              className={`font-mono text-[10px] tracking-widest uppercase ${style.labelColor} opacity-70`}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Evolution level badge */}
        <div
          className={`
            text-[10px] font-mono font-bold tracking-widest px-2 py-1 rounded-sm border
            ${isDim ? "bg-muted/10 text-muted-foreground border-border" : room.badgeColor}
          `}
        >
          LVL {evolutionLevel}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <StatPill
          label="QUESTS"
          value={questCount}
          dim={isDim}
          color={room.textColor}
        />
        <StatPill
          label="ENTRIES"
          value={entryCount}
          dim={isDim}
          color={room.textColor}
        />
        <StatPill
          label="SKILLS"
          value={skillCount}
          dim={isDim}
          color={room.textColor}
        />
      </div>

      {/* Activity score bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Activity
          </span>
          <span className={`font-mono text-[10px] font-bold ${isDim ? "text-muted-foreground" : room.textColor}`}>
            {activityScore.toFixed(1)}
          </span>
        </div>
        <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isDim ? "bg-muted/40" : `bg-gradient-to-r from-transparent`}`}
            style={{
              background: isDim
                ? "hsl(var(--muted) / 0.4)"
                : undefined,
              backgroundImage: isDim
                ? undefined
                : `linear-gradient(to right, transparent, var(--tw-gradient-to))`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((activityScore / 10) * 100, 100)}%` }}
            transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: "easeOut" }}
          >
            {!isDim && (
              <div
                className={`h-full w-full rounded-full ${
                  room.color === "cyan"
                    ? "bg-cyan-500"
                    : room.color === "green"
                    ? "bg-green-500"
                    : room.color === "purple"
                    ? "bg-purple-500"
                    : room.color === "amber"
                    ? "bg-amber-500"
                    : "bg-amber-400"
                }`}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Enter button */}
      <button
        onClick={onEnter}
        className={`
          w-full flex items-center justify-center gap-2
          font-mono text-xs font-bold tracking-widest uppercase
          py-2.5 px-4 rounded-sm border
          transition-all duration-200
          ${
            isDim
              ? "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
              : `${room.borderColor} ${room.textColor} hover:bg-current/5`
          }
        `}
      >
        ENTER ROOM
        <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

interface StatPillProps {
  label: string;
  value: number;
  dim: boolean;
  color: string;
}

function StatPill({ label, value, dim, color }: StatPillProps) {
  return (
    <div className="flex flex-col items-center gap-1 bg-muted/10 rounded-sm py-2 px-1">
      <span
        className={`font-display font-bold text-lg leading-none ${dim ? "text-muted-foreground" : color}`}
      >
        {value}
      </span>
      <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AtlasPage() {
  const navigate = useNavigate();
  const { quests, entries, skills, profile } = useAppData();

  const totalActivity = quests.length + entries.length + skills.length;
  const isEmpty = totalActivity === 0;

  // Compute per-domain counts
  const domainStats = DOMAIN_ROOMS.map((room) => {
    const questCount = quests.filter((q) =>
      matchesKeywords(`${q.name} ${q.description ?? ""}`, room.keywords)
    ).length;

    const entryCount = entries.filter((e) =>
      matchesKeywords(`${e.title} ${e.content}`, room.keywords)
    ).length;

    const skillCount = skills.filter((s) =>
      matchesKeywords(`${s.name} ${s.description} ${s.category}`, room.keywords)
    ).length;

    return { room, questCount, entryCount, skillCount };
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <PageHeader title="ATLAS" subtitle="// VIRTUAL DOMAIN SPACES">
        {/* Operator level badge */}
        <div className="flex items-center gap-2 bg-card border border-primary/30 rounded-sm px-3 py-1.5">
          <Zap size={14} className="text-primary" />
          <span className="font-mono text-xs font-bold text-primary tracking-widest">
            OP LVL {profile?.operator_level ?? 1}
          </span>
        </div>
      </PageHeader>

      {/* Empty state */}
      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        >
          <div className="w-16 h-16 rounded-sm border border-border flex items-center justify-center text-muted-foreground">
            <Brain size={28} />
          </div>
          <div>
            <p className="font-display font-bold text-muted-foreground tracking-widest">
              INITIALIZING...
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 mt-1">
              Add quests, journal entries, or skills to activate domain rooms.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Subtitle bar */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              {totalActivity} data points mapped across 5 domains
            </span>
            <div className="h-px flex-1 bg-border" />
          </motion.div>

          {/* Domain room grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainStats.map(({ room, questCount, entryCount, skillCount }, index) => (
              <DomainRoomCard
                key={room.id}
                room={room}
                questCount={questCount}
                entryCount={entryCount}
                skillCount={skillCount}
                index={index}
                onEnter={() => navigate("/quests")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
