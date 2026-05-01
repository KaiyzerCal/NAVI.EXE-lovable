import { motion } from "framer-motion";
import { Briefcase, Heart, Brain, Users, Coins, Globe, Swords } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import ProgressBar from "@/components/ProgressBar";
import { useAppData } from "@/contexts/AppDataContext";
import type { Quest } from "@/hooks/useQuests";
import type { OperatorSkill } from "@/hooks/useSkillsAndEquipment";

// ─── Domain definitions ───────────────────────────────────────────────────────

type DomainKey = "CAREER" | "HEALTH" | "MIND" | "SOCIAL" | "FINANCE";

interface Domain {
  key: DomainKey;
  label: string;
  icon: React.ReactNode;
  color: string;          // text color
  border: string;         // border color
  bar: "cyan" | "green" | "purple" | "amber";
  keywords: string[];
}

const DOMAINS: Domain[] = [
  {
    key: "CAREER",
    label: "CAREER",
    icon: <Briefcase size={18} />,
    color: "text-blue-400",
    border: "border-blue-500/30",
    bar: "cyan",
    keywords: ["work", "career", "job", "business", "project", "client", "money", "income"],
  },
  {
    key: "HEALTH",
    label: "HEALTH",
    icon: <Heart size={18} />,
    color: "text-green-400",
    border: "border-green-500/30",
    bar: "green",
    keywords: ["fitness", "health", "gym", "workout", "run", "diet", "sleep", "wellness"],
  },
  {
    key: "MIND",
    label: "MIND",
    icon: <Brain size={18} />,
    color: "text-purple-400",
    border: "border-purple-500/30",
    bar: "purple",
    keywords: ["study", "learn", "read", "book", "course", "skill", "knowledge", "meditat"],
  },
  {
    key: "SOCIAL",
    label: "SOCIAL",
    icon: <Users size={18} />,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bar: "amber",
    keywords: ["friend", "family", "relationship", "party", "social", "network", "community"],
  },
  {
    key: "FINANCE",
    label: "FINANCE",
    icon: <Coins size={18} />,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bar: "amber",
    keywords: ["finance", "money", "budget", "invest", "save", "debt", "income", "expense"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchesDomain(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function questInDomain(quest: Quest, keywords: string[]): boolean {
  return (
    matchesDomain(quest.name, keywords) ||
    matchesDomain(quest.description ?? "", keywords)
  );
}

function skillInDomain(skill: OperatorSkill, keywords: string[]): boolean {
  return (
    matchesDomain(skill.name, keywords) ||
    matchesDomain(skill.description ?? "", keywords) ||
    matchesDomain(skill.category ?? "", keywords)
  );
}

// ─── Room Card ────────────────────────────────────────────────────────────────

interface RoomCardProps {
  domain: Domain;
  quests: Quest[];
  skills: OperatorSkill[];
  index: number;
}

function RoomCard({ domain, quests, skills, index }: RoomCardProps) {
  const domainQuests = quests.filter((q) => questInDomain(q, domain.keywords));
  const domainSkills = skills.filter((s) => skillInDomain(s, domain.keywords));

  const activeQuests = domainQuests.filter((q) => !q.completed);
  const completedQuests = domainQuests.filter((q) => q.completed);
  const totalQuests = domainQuests.length;
  const completionRate = totalQuests > 0 ? completedQuests.length : 0;

  const previewQuests = activeQuests.slice(0, 3);

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      className={`bg-card border ${domain.border} rounded p-4 flex flex-col gap-3`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={domain.color}>{domain.icon}</span>
        <h3 className={`font-display text-sm font-bold tracking-widest ${domain.color}`}>
          {domain.label}
        </h3>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {activeQuests.length} active · {completedQuests.length} done
        </span>
      </div>

      {/* Skill count badge */}
      {domainSkills.length > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground -mt-1">
          {domainSkills.length} skill{domainSkills.length !== 1 ? "s" : ""} linked
        </p>
      )}

      {/* Progress bar */}
      <div>
        <ProgressBar
          value={completionRate}
          max={Math.max(totalQuests, 1)}
          variant={domain.bar}
          showValue={false}
          size="sm"
        />
        <p className="text-[10px] font-mono text-muted-foreground mt-1">
          {completionRate}/{totalQuests} quests completed
        </p>
      </div>

      {/* Quest list */}
      <div className="space-y-1">
        {previewQuests.length === 0 ? (
          <p className="text-xs font-mono text-muted-foreground italic">
            No active quests in this domain.
          </p>
        ) : (
          previewQuests.map((q) => (
            <div key={q.id} className="flex items-start gap-2">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${domain.color.replace("text-", "bg-")}`} />
              <p className="text-xs font-body text-foreground/80 leading-tight">{q.name}</p>
            </div>
          ))
        )}
        {activeQuests.length > 3 && (
          <p className="text-[10px] font-mono text-muted-foreground pl-3.5">
            +{activeQuests.length - 3} more
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtlasPage() {
  const { profile, quests, skills, questStats } = useAppData();

  const operatorName = profile.display_name || "OPERATOR";
  const operatorLevel = profile.operator_level ?? 1;

  // Quests that match NO domain
  const classifiedQuestIds = new Set<string>();
  DOMAINS.forEach((d) => {
    quests.forEach((q) => {
      if (questInDomain(q, d.keywords)) classifiedQuestIds.add(q.id);
    });
  });
  const unclassifiedQuests = quests.filter((q) => !classifiedQuestIds.has(q.id) && !q.completed);

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <PageHeader
        title="ATLAS // OPERATOR WORLD"
        subtitle={`// ${operatorName} · LVL ${operatorLevel} · ${questStats.active} ACTIVE QUESTS`}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground border border-border rounded px-3 py-1.5 bg-card">
          <Globe size={12} className="text-primary" />
          <span>// 5 DOMAIN ROOMS ACTIVE</span>
        </div>
      </PageHeader>

      {/* Room grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {DOMAINS.map((domain, i) => (
          <RoomCard
            key={domain.key}
            domain={domain}
            quests={quests}
            skills={skills}
            index={i}
          />
        ))}
      </motion.div>

      {/* Unclassified section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        <HudCard
          title="UNCLASSIFIED"
          icon={<Swords size={14} />}
        >
          {unclassifiedQuests.length === 0 ? (
            <p className="text-xs font-mono text-muted-foreground">
              All active quests are classified into domain rooms.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-mono text-muted-foreground mb-2">
                {unclassifiedQuests.length} quest{unclassifiedQuests.length !== 1 ? "s" : ""} without a domain match
              </p>
              {unclassifiedQuests.map((q) => (
                <div key={q.id} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                  <p className="text-xs font-body text-foreground/80">{q.name}</p>
                </div>
              ))}
            </div>
          )}
        </HudCard>
      </motion.div>
    </div>
  );
}
