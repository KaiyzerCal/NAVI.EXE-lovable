import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Loader2, MessageSquare, UserMinus, Star, Shield, Sword,
  Brain, Heart, Zap, ScanEye, Clover, Flame, Trophy, Circle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import {
  TIER_COLORS, TIER_NAMES, tierFromLevel, evolutionTitleFromMbtiAndLevel, classNameFromMbti, type Tier,
} from "@/lib/xpSystem";
import { initials } from "@/lib/feedHelpers";
import DirectMessageModal from "@/components/DirectMessageModal";

interface OperatorProfile {
  id: string;
  display_name: string | null;
  navi_name: string | null;
  navi_level: number;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number;
  operator_xp: number;
  current_streak: number;
  longest_streak: number;
  bond_affection: number;
  bond_trust: number;
  bond_loyalty: number;
  last_evolution_tier: number;
  subscription_tier: string;
  last_active: string | null;
}

interface Props {
  operatorId: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoveFromParty?: (userId: string) => Promise<void>;
  showRemoveFromParty?: boolean;
}

const db = supabase as any;

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 bg-muted/40 border border-border rounded px-2.5 py-1.5">
      <span className="text-primary shrink-0">{icon}</span>
      <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
      <span className="text-xs font-display font-bold text-foreground ml-auto">{value}</span>
    </div>
  );
}

function SkeletonRow() {
  return <div className="h-8 rounded bg-muted/30 animate-pulse w-full" />;
}

export default function OperatorProfileSheet({
  operatorId,
  isOpen,
  onClose,
  onRemoveFromParty,
  showRemoveFromParty = false,
}: Props) {
  const { user } = useAuth();
  const { profile: myProfile } = useAppData();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!operatorId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await db
        .from("profiles")
        .select(
          "id,display_name,navi_name,navi_level,character_class,mbti_type,operator_level,operator_xp,current_streak,longest_streak,bond_affection,bond_trust,bond_loyalty,last_evolution_tier,subscription_tier,last_active"
        )
        .eq("id", operatorId)
        .single();
      if (fetchErr) throw fetchErr;
      setProfile(data as OperatorProfile);
      // Online = last_active within 5 minutes
      if (data?.last_active) {
        const diff = Date.now() - new Date(data.last_active).getTime();
        setIsOnline(diff < 5 * 60 * 1000);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [operatorId]);

  useEffect(() => {
    if (isOpen && operatorId) fetchProfile();
    if (!isOpen) { setProfile(null); setError(null); }
  }, [isOpen, operatorId, fetchProfile]);

  const handleRemove = async () => {
    if (!onRemoveFromParty || !profile) return;
    setRemoving(true);
    await onRemoveFromParty(profile.id);
    setRemoving(false);
    onClose();
  };

  const tier = profile ? tierFromLevel(profile.operator_level) : (1 as Tier);
  const tierColor = TIER_COLORS[tier];
  const tierName = TIER_NAMES[tier];
  const evoTitle = profile?.mbti_type
    ? evolutionTitleFromMbtiAndLevel(profile.mbti_type, profile.operator_level)
    : "Operator";

  // Compute approximate stats from available profile data
  const computeStats = (p: OperatorProfile) => {
    const clamp = (v: number) => Math.max(1, Math.min(100, Math.round(v)));
    return {
      STR: clamp(p.operator_level * 1.2),
      INT: clamp(Math.floor(p.operator_xp / 1000) + p.navi_level),
      VIT: clamp(p.current_streak * 2 + p.operator_level),
      AGI: clamp(p.navi_level * 2 + Math.floor(p.operator_level / 2)),
    };
  };

  const isSelf = user?.id === operatorId;

  if (typeof document === "undefined") return null;

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[81] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-x border-primary/30 bg-background"
            style={{ boxShadow: `0 -8px 40px ${tierColor}22` }}
          >
            {/* Scanline overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06] rounded-t-2xl"
              style={{ background: "linear-gradient(transparent 50%,rgba(0,0,0,0.06) 50%)", backgroundSize: "100% 4px" }}
            />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="px-5 pb-8">
              {loading && (
                <div className="space-y-3 pt-6">
                  <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="w-20 h-20 rounded-full bg-muted/40 animate-pulse" />
                    <div className="h-5 w-32 rounded bg-muted/40 animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted/30 animate-pulse" />
                  </div>
                  {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
                </div>
              )}

              {error && !loading && (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs font-mono text-destructive">{error}</p>
                  <button
                    onClick={fetchProfile}
                    className="text-[10px] font-mono text-primary border border-primary/30 px-3 py-1.5 rounded hover:bg-primary/10"
                  >
                    RETRY
                  </button>
                </div>
              )}

              {profile && !loading && (
                <>
                  {/* Header */}
                  <div className="flex flex-col items-center text-center pt-2 pb-5">
                    {/* Avatar */}
                    <div className="relative mb-3">
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center border-2 font-display font-bold text-2xl"
                        style={{
                          borderColor: tierColor,
                          backgroundColor: `${tierColor}18`,
                          color: tierColor,
                          boxShadow: `0 0 20px ${tierColor}55`,
                        }}
                      >
                        {initials(profile.display_name)}
                      </div>
                      {/* Online indicator */}
                      <div
                        className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-background ${isOnline ? "bg-neon-green" : "bg-muted"}`}
                        title={isOnline ? "Online" : "Offline"}
                      />
                    </div>

                    <h2
                      className="font-display text-xl font-bold mb-0.5"
                      style={{ color: tierColor, textShadow: `0 0 12px ${tierColor}80` }}
                    >
                      {profile.display_name || "Unknown Operator"}
                    </h2>

                    <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
                      {profile.character_class && (
                        <span className="text-[10px] font-mono bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded">
                          {profile.character_class.toUpperCase()}
                        </span>
                      )}
                      {profile.mbti_type && (
                        <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/30 px-2 py-0.5 rounded">
                          {profile.mbti_type}
                        </span>
                      )}
                    </div>

                    <p
                      className="text-sm font-display font-semibold"
                      style={{ color: tierColor }}
                    >
                      {evoTitle}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {tierName} · T{tier} · LV{profile.operator_level}
                    </p>
                    {profile.navi_name && (
                      <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                        NAVI: {profile.navi_name} LV{profile.navi_level}
                      </p>
                    )}
                  </div>

                  {/* Evolution path dots */}
                  <div className="flex items-center justify-center gap-2 mb-5">
                    {([1, 2, 3, 4, 5] as Tier[]).map(t => {
                      const c = TIER_COLORS[t];
                      const active = t <= tier;
                      const current = t === tier;
                      return (
                        <motion.div
                          key={t}
                          className="rounded-full border"
                          animate={current ? { scale: [1, 1.2, 1] } : {}}
                          transition={current ? { duration: 1.8, repeat: Infinity } : {}}
                          style={{
                            width: current ? 14 : 10,
                            height: current ? 14 : 10,
                            backgroundColor: active ? c : "transparent",
                            borderColor: c,
                            opacity: active ? 1 : 0.3,
                            boxShadow: current ? `0 0 8px ${c}` : undefined,
                          }}
                          title={TIER_NAMES[t]}
                        />
                      );
                    })}
                  </div>

                  {/* Stats grid */}
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">OPERATOR STATS</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-5">
                    {(() => {
                      const stats = computeStats(profile);
                      return (
                        <>
                          <StatChip icon={<Sword size={11} />} label="STR" value={stats.STR} />
                          <StatChip icon={<Brain size={11} />} label="INT" value={stats.INT} />
                          <StatChip icon={<Heart size={11} />} label="VIT" value={stats.VIT} />
                          <StatChip icon={<Zap size={11} />} label="AGI" value={stats.AGI} />
                          <StatChip icon={<Flame size={11} />} label="STREAK" value={`${profile.current_streak}d`} />
                          <StatChip icon={<Trophy size={11} />} label="BEST" value={`${profile.longest_streak}d`} />
                          <StatChip icon={<Star size={11} />} label="LVL" value={profile.operator_level} />
                          <StatChip icon={<Shield size={11} />} label="NAVI LVL" value={profile.navi_level} />
                        </>
                      );
                    })()}
                  </div>

                  {/* Bond summary */}
                  <div className="rounded border border-border/50 bg-card/40 px-3 py-2 mb-5 space-y-1.5">
                    <p className="text-[10px] font-mono text-muted-foreground tracking-widest">NAVI BOND</p>
                    {[
                      { label: "AFFECTION", value: profile.bond_affection },
                      { label: "TRUST", value: profile.bond_trust },
                      { label: "LOYALTY", value: profile.bond_loyalty },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground w-20 shrink-0">{label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${value}%`, boxShadow: "0 0 6px hsl(var(--primary))" }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-primary w-7 text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {!isSelf && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setDmOpen(true)}
                        className="w-full py-2.5 rounded border-2 font-display font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all bg-card/60 hover:bg-card"
                        style={{
                          borderColor: tierColor,
                          color: tierColor,
                          boxShadow: `0 0 16px ${tierColor}33`,
                        }}
                      >
                        <MessageSquare size={14} />
                        MESSAGE {(profile.display_name || "OPERATOR").toUpperCase()}
                      </button>

                      {showRemoveFromParty && onRemoveFromParty && (
                        <button
                          onClick={handleRemove}
                          disabled={removing}
                          className="w-full py-2.5 rounded border border-destructive/40 text-destructive font-display font-bold tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:bg-destructive/10 disabled:opacity-50"
                        >
                          {removing ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                          REMOVE FROM PARTY
                        </button>
                      )}
                    </div>
                  )}

                  {isSelf && (
                    <p className="text-center text-[10px] font-mono text-muted-foreground">
                      THIS IS YOUR OWN PROFILE
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(sheet, document.body)}
      {profile && !isSelf && (
        <DirectMessageModal
          targetId={profile.id}
          targetDisplayName={profile.display_name}
          targetNaviName={profile.navi_name}
          isOpen={dmOpen}
          onClose={() => setDmOpen(false)}
        />
      )}
    </>
  );
}
