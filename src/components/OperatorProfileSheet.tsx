import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { evolutionTitleFromMbtiAndLevel, TIER_COLORS, tierFromLevel, type Tier } from "@/lib/xpSystem";

interface Props {
  operatorId: string;
  isOpen: boolean;
  onClose: () => void;
}

type OperatorProfile = {
  display_name: string | null;
  navi_name: string | null;
  navi_level: number | null;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number | null;
  str_stat: number | null;
  int_stat: number | null;
  vit_stat: number | null;
  agi_stat: number | null;
  current_streak: number | null;
  total_quests_completed: number | null;
  total_xp: number | null;
  bond_level: number | null;
  created_at: string | null;
  last_evolution_tier: number | null;
  subscription_tier: string | null;
  updated_at?: string | null;
};

export default function OperatorProfileSheet({ operatorId, isOpen, onClose }: Props) {
  const [data, setData] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!operatorId) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name,navi_name,navi_level,character_class,mbti_type,operator_level,str_stat,int_stat,vit_stat,agi_stat,current_streak,total_quests_completed,total_xp,bond_level,created_at,last_evolution_tier,subscription_tier,updated_at")
      .eq("id", operatorId)
      .single();

    if (error) {
      setError(error.message);
      setData(null);
    } else {
      setData(data as OperatorProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) void fetchProfile();
  }, [isOpen, operatorId]);

  const opLevel = data?.operator_level ?? 1;
  const tier = tierFromLevel(opLevel);
  const tierColor = TIER_COLORS[tier as Tier];
  const evoTitle = evolutionTitleFromMbtiAndLevel(data?.mbti_type ?? "", opLevel);
  const isOnline = useMemo(() => {
    if (!data?.updated_at) return false;
    return Date.now() - new Date(data.updated_at).getTime() < 5 * 60 * 1000;
  }, [data?.updated_at]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-[110] bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[111] bg-background border-t border-primary/30 rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
          >
            <div className="absolute top-3 right-3">
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>

            {loading && (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            )}

            {error && !loading && (
              <div className="py-8 text-center">
                <p className="text-sm text-destructive font-body mb-3">Failed to load operator profile.</p>
                <Button size="sm" variant="outline" onClick={fetchProfile}>Retry</Button>
              </div>
            )}

            {!loading && !error && data && (
              <div>
                <div className="text-center mb-5">
                  <div className="w-20 h-20 rounded-full mx-auto border border-primary/40 bg-card flex items-center justify-center font-display text-2xl text-primary">
                    {(data.display_name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <h3 className="mt-2 font-display text-xl text-foreground" style={{ textShadow: `0 0 12px ${tierColor}55` }}>{data.display_name || "Operator"}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground">{data.character_class || "Unknown"} · {data.mbti_type || "----"}</p>
                  <p className="text-sm font-body mt-1" style={{ color: tierColor }}>{evoTitle}</p>
                  <div className="mt-1 text-[10px] font-mono flex items-center justify-center gap-1 text-muted-foreground">
                    <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? "bg-neon-green" : "bg-muted"}`} />
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-body mb-4">
                  <Stat label="LEVEL" value={`Lv ${opLevel} (T${tier})`} />
                  <Stat label="NAVI" value={`${data.navi_name || "NAVI"} Lv${data.navi_level ?? 1}`} />
                  <Stat label="STR" value={data.str_stat ?? 0} />
                  <Stat label="INT" value={data.int_stat ?? 0} />
                  <Stat label="VIT" value={data.vit_stat ?? 0} />
                  <Stat label="AGI" value={data.agi_stat ?? 0} />
                  <Stat label="STREAK" value={`${data.current_streak ?? 0}d`} />
                  <Stat label="QUESTS" value={data.total_quests_completed ?? 0} />
                  <Stat label="XP" value={data.total_xp ?? 0} />
                  <Stat label="BOND" value={data.bond_level ?? 0} />
                  <Stat label="MEMBER SINCE" value={data.created_at ? new Date(data.created_at).toLocaleDateString() : "-"} />
                </div>

                <Button className="w-full font-mono" variant="outline"><MessageSquare size={14} className="mr-2" />MESSAGE {data.display_name || "OPERATOR"}</Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-primary/20 rounded p-2">
      <p className="text-[9px] font-mono text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
