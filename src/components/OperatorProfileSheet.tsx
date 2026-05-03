import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, UserMinus, Loader2, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tierFromLevel, TIER_NAMES, TIER_COLORS, type EvolutionTier } from "@/lib/classEvolution";
import { useAuth } from "@/contexts/AuthContext";
import DirectMessageModal from "./DirectMessageModal";

interface OperatorProfile {
  id: string;
  display_name: string;
  navi_name: string;
  navi_level: number;
  character_class: string | null;
  mbti_type: string | null;
  subclass: string | null;
  operator_level: number;
  current_streak: number;
  quests_completed: number;
  xp_total: number;
  bond_affection: number;
  bond_trust: number;
  bond_loyalty: number;
  created_at: string;
  last_evolution_tier: number | null;
  perception: number;
  luck: number;
  subscription_tier: string;
}

export interface OperatorProfileSheetProps {
  operatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromParty?: () => void;
  isPartyLeader?: boolean;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-muted/50 rounded animate-pulse ${className}`} />;
}

export default function OperatorProfileSheet({
  operatorId,
  isOpen,
  onClose,
  onRemoveFromParty,
  isPartyLeader = false,
}: OperatorProfileSheetProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDM, setShowDM] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  useEffect(() => {
    if (!isOpen || !operatorId) return;
    setProfile(null);
    setError(null);
    setLoading(true);
    supabase
      .from("profiles")
      .select(
        "id, display_name, navi_name, navi_level, character_class, mbti_type, subclass, operator_level, current_streak, quests_completed, xp_total, bond_affection, bond_trust, bond_loyalty, created_at, last_evolution_tier, perception, luck, subscription_tier"
      )
      .eq("id", operatorId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) setError("Could not load operator profile.");
        else setProfile(data as OperatorProfile);
        setLoading(false);
      });

    // Load follow status
    if (user && user.id !== operatorId) {
      (supabase as any)
        .from("operator_follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .eq("following_id", operatorId)
        .maybeSingle()
        .then(({ data }: { data: any }) => setIsFollowing(!!data));
    }
  }, [isOpen, operatorId, user]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmRemove(false);
      setShowDM(false);
    }
  }, [isOpen]);

  const toggleFollow = useCallback(async () => {
    if (!user || togglingFollow || !profile) return;
    setTogglingFollow(true);
    const next = !isFollowing;
    setIsFollowing(next);
    if (next) {
      await (supabase as any)
        .from("operator_follows")
        .upsert({ follower_id: user.id, following_id: profile.id }, { onConflict: "follower_id,following_id" });
    } else {
      await (supabase as any)
        .from("operator_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profile.id);
    }
    setTogglingFollow(false);
  }, [user, profile, isFollowing, togglingFollow]);

  const tier = (profile?.last_evolution_tier ?? tierFromLevel(profile?.operator_level ?? 1)) as EvolutionTier;
  const tierColor = TIER_COLORS[tier] ?? TIER_COLORS[1];
  const tierName = TIER_NAMES[tier];
  const bondAvg = profile
    ? Math.round(((profile.bond_affection ?? 50) + (profile.bond_trust ?? 50) + (profile.bond_loyalty ?? 50)) / 3)
    : 0;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={onClose}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto bg-card border-t border-x border-primary/30 rounded-t-2xl shadow-2xl"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="px-5 pb-8 pt-2">
                {loading ? (
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col items-center gap-3">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <Skeleton className="w-40 h-5" />
                      <Skeleton className="w-28 h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                      ))}
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground font-mono text-sm mb-3">{error}</p>
                    <button
                      onClick={() => { setError(null); setLoading(true); }}
                      className="text-primary font-mono text-xs hover:underline"
                    >
                      RETRY
                    </button>
                  </div>
                ) : profile ? (
                  <div className="space-y-5">
                    {/* Avatar + name */}
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div
                        className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-2xl font-display font-bold"
                        style={{
                          borderColor: tierColor,
                          color: tierColor,
                          background: `${tierColor}18`,
                          boxShadow: `0 0 20px ${tierColor}30`,
                        }}
                      >
                        {(profile.display_name ?? "O")[0].toUpperCase()}
                      </div>

                      <div className="text-center">
                        <h2
                          className="text-lg font-display font-bold text-foreground"
                          style={{ textShadow: `0 0 12px ${tierColor}60` }}
                        >
                          {profile.display_name}
                        </h2>
                        <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                          {profile.character_class && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary">
                              {profile.character_class}
                            </span>
                          )}
                          {profile.mbti_type && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-muted-foreground">
                              {profile.mbti_type}
                            </span>
                          )}
                          {profile.subscription_tier && profile.subscription_tier !== "free" && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent uppercase">
                              {profile.subscription_tier}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">
                          {profile.navi_name} // LV.{profile.navi_level}
                        </p>
                      </div>
                    </div>

                    {/* Evolution tier dots */}
                    <div className="text-center">
                      <p className="text-[9px] font-mono text-muted-foreground mb-2 tracking-widest">EVOLUTION PATH</p>
                      <div className="flex justify-center gap-1 flex-wrap">
                        {(Array.from({ length: 20 }, (_, i) => (i + 1) as EvolutionTier)).map((t) => (
                          <div
                            key={t}
                            className="w-2 h-2 rounded-full border transition-all"
                            style={{
                              backgroundColor: t <= tier ? TIER_COLORS[t] : "transparent",
                              borderColor: TIER_COLORS[t],
                              opacity: t <= tier ? 1 : 0.25,
                              boxShadow: t <= tier ? `0 0 4px ${TIER_COLORS[t]}` : "none",
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[9px] font-mono mt-1.5" style={{ color: tierColor }}>
                        TIER {tier} — {tierName}
                      </p>
                    </div>

                    {/* Stats grid */}
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">// OPERATOR STATS</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: "OPERATOR LV", value: profile.operator_level },
                          { label: "NAVI LV", value: profile.navi_level },
                          { label: "TOTAL XP", value: (profile.xp_total ?? 0).toLocaleString() },
                          { label: "STREAK", value: `${profile.current_streak ?? 0}d` },
                          { label: "QUESTS DONE", value: profile.quests_completed ?? 0 },
                          { label: "BOND AVG", value: `${bondAvg}%` },
                          { label: "PERCEPTION", value: profile.perception ?? 10 },
                          { label: "LUCK", value: profile.luck ?? 10 },
                          { label: "MEMBER SINCE", value: memberSince },
                          {
                            label: "SUBCLASS",
                            value: profile.subclass ? profile.subclass.toUpperCase() : "—",
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-muted/20 border border-border rounded-lg px-3 py-2.5">
                            <p className="text-[8px] font-mono text-muted-foreground tracking-widest">{label}</p>
                            <p className="text-sm font-display font-bold text-foreground mt-0.5 truncate">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bond breakdown */}
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">// NAVI BOND</p>
                      <div className="space-y-2">
                        {[
                          { label: "AFFECTION", value: profile.bond_affection ?? 50 },
                          { label: "TRUST", value: profile.bond_trust ?? 50 },
                          { label: "LOYALTY", value: profile.bond_loyalty ?? 50 },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-muted-foreground w-20 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${value}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-primary w-6 text-right shrink-0">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 pt-1">
                      {user && user.id !== profile.id && (
                        <button
                          onClick={toggleFollow}
                          disabled={togglingFollow}
                          className={`w-full py-2.5 rounded-lg border font-mono text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                            isFollowing
                              ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/5 hover:text-muted-foreground"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                          }`}
                        >
                          {togglingFollow ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : isFollowing ? (
                            <UserCheck size={14} />
                          ) : (
                            <UserPlus size={14} />
                          )}
                          {isFollowing ? "FOLLOWING" : "FOLLOW"}
                        </button>
                      )}
                      <button
                        onClick={() => setShowDM(true)}
                        className="w-full py-2.5 rounded-lg border border-primary/50 bg-primary/10 text-primary font-mono text-sm font-bold hover:bg-primary/20 active:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <MessageSquare size={14} />
                        MESSAGE {(profile.display_name ?? "OPERATOR").toUpperCase()}
                      </button>

                      {isPartyLeader && onRemoveFromParty && (
                        <AnimatePresence mode="wait">
                          {!confirmRemove ? (
                            <motion.button
                              key="remove-btn"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setConfirmRemove(true)}
                              className="w-full py-2 rounded-lg border border-destructive/30 text-destructive font-mono text-xs hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                            >
                              <UserMinus size={12} />
                              REMOVE FROM PARTY
                            </motion.button>
                          ) : (
                            <motion.div
                              key="remove-confirm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="border border-destructive/30 rounded-lg p-3 space-y-2"
                            >
                              <p className="text-xs font-mono text-muted-foreground text-center">
                                Remove {profile.display_name} from party?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setConfirmRemove(false)}
                                  className="flex-1 py-1.5 rounded border border-border text-muted-foreground text-xs font-mono hover:text-foreground transition-colors"
                                >
                                  CANCEL
                                </button>
                                <button
                                  onClick={() => { onRemoveFromParty(); onClose(); }}
                                  className="flex-1 py-1.5 rounded bg-destructive/10 border border-destructive/40 text-destructive text-xs font-mono hover:bg-destructive/20 transition-colors"
                                >
                                  REMOVE
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Direct Message Modal */}
      {profile && (
        <DirectMessageModal
          isOpen={showDM}
          onClose={() => setShowDM(false)}
          recipientId={profile.id}
          recipientName={profile.display_name}
        />
      )}
    </>
  );
}
