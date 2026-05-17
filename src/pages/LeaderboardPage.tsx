import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Loader2, TrendingUp, Flame, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import SubscriptionBadge from "@/components/SubscriptionBadge";

interface LeaderboardEntry {
  id: string;
  display_name: string | null;
  navi_name: string | null;
  operator_level: number;
  xp_total: number;
  current_streak: number;
  character_class: string | null;
  equipped_skin: string;
  subscription_tier: string;
  quests_completed?: number;
}

const QUERY_FIELDS =
  "id, display_name, navi_name, operator_level, xp_total, current_streak, character_class, equipped_skin, subscription_tier, quests_completed";

async function fetchLeaderboard(
  orderBy: string,
  fallbacks: string[]
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from("profiles")
    .select(QUERY_FIELDS)
    .order(orderBy, { ascending: false });
  for (const fb of fallbacks) {
    query = query.order(fb, { ascending: false });
  }
  const { data, error } = await query.limit(20);
  if (error) {
    console.error("[Leaderboard] fetch error:", error);
    return [];
  }
  return (data ?? []) as LeaderboardEntry[];
}

interface BoardData {
  xp: LeaderboardEntry[];
  streak: LeaderboardEntry[];
  quests: LeaderboardEntry[];
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25 },
  }),
};

function RankRow({
  entry,
  rank,
  value,
  currentUserId,
}: {
  entry: LeaderboardEntry;
  rank: number;
  value: string;
  currentUserId: string | undefined;
}) {
  const isMe = entry.id === currentUserId;
  return (
    <motion.div
      custom={rank - 1}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${
        isMe
          ? "border border-primary/40 bg-primary/5"
          : "border border-transparent"
      }`}
    >
      {/* Rank */}
      <span className="w-5 shrink-0 text-center">
        {rank === 1 ? (
          <Crown size={13} className="text-neon-amber mx-auto" />
        ) : (
          <span className="text-[10px] font-mono text-muted-foreground">
            {rank}
          </span>
        )}
      </span>

      {/* Level badge */}
      <span className="text-[9px] font-mono text-primary/70 shrink-0 w-8 text-center">
        Lv{entry.operator_level}
      </span>

      {/* Name + class + subscription */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-xs font-body truncate leading-tight">
          {entry.display_name ?? "Operator"}
          {isMe && (
            <span className="ml-1 text-[9px] font-mono text-primary/60">
              [YOU]
            </span>
          )}
        </span>
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          {entry.character_class && (
            <span className="text-[8px] font-mono text-muted-foreground bg-muted/30 px-1 rounded">
              {entry.character_class}
            </span>
          )}
          <SubscriptionBadge tier={entry.subscription_tier ?? "free"} />
        </div>
      </div>

      {/* Value */}
      <span className="text-xs font-display font-bold text-primary shrink-0">
        {value}
      </span>
    </motion.div>
  );
}

function LeaderboardPanel({
  title,
  icon,
  entries,
  valueKey,
  formatValue,
  currentUserId,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  entries: LeaderboardEntry[];
  valueKey: keyof LeaderboardEntry;
  formatValue: (v: number) => string;
  currentUserId: string | undefined;
  loading: boolean;
}) {
  return (
    <HudCard title={title} icon={icon} className="flex-1 min-w-0">
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={16} className="animate-spin text-primary" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground py-4 text-center">
          No data yet
        </p>
      ) : (
        <div className="space-y-0.5">
          {entries.map((entry, i) => (
            <RankRow
              key={entry.id}
              entry={entry}
              rank={i + 1}
              value={formatValue((entry[valueKey] as number) ?? 0)}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </HudCard>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const { profile: _profile } = useAppData();

  const [boards, setBoards] = useState<BoardData>({ xp: [], streak: [], quests: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchLeaderboard("xp_total", ["current_streak", "quests_completed"]),
      fetchLeaderboard("current_streak", ["xp_total", "quests_completed"]),
      fetchLeaderboard("quests_completed", ["xp_total", "current_streak"]),
    ]).then(([xp, streak, quests]) => {
      if (!cancelled) {
        setBoards({ xp, streak, quests });
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <PageHeader title="LEADERBOARD" subtitle="// OPERATOR RANKINGS" />

      <div className="flex flex-col md:flex-row gap-4">
        <LeaderboardPanel
          title="TOP XP"
          icon={<TrendingUp size={14} />}
          entries={boards.xp}
          valueKey="xp_total"
          formatValue={(v) => `${v.toLocaleString()} XP`}
          currentUserId={user?.id}
          loading={loading}
        />

        <LeaderboardPanel
          title="TOP STREAK"
          icon={<Flame size={14} />}
          entries={boards.streak}
          valueKey="current_streak"
          formatValue={(v) => `${v}d`}
          currentUserId={user?.id}
          loading={loading}
        />

        <LeaderboardPanel
          title="MOST QUESTS"
          icon={<Target size={14} />}
          entries={boards.quests}
          valueKey="quests_completed"
          formatValue={(v) => `${v}`}
          currentUserId={user?.id}
          loading={loading}
        />
      </div>
    </div>
  );
}
