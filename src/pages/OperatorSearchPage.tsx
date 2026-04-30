import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

export default function OperatorSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(null);
  const { user } = useAuth();
  const trimmed = useMemo(() => query.trim(), [query]);

  const runSearch = async () => {
    setLoading(true);
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setError(null);
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,username,navi_name,character_class,operator_level")
      .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
      .limit(25);
    if (!data) setError("Search failed. Try again.");
    setResults(data || []);
    setLoading(false);
  };
  useEffect(() => {
    const t = setTimeout(() => { void runSearch(); }, 250);
    return () => clearTimeout(t);
  }, [trimmed]);

  const toggleFollow = async (operatorId: string) => {
    if (!user) return;
    const isFollowing = following[operatorId];
    if (isFollowing) {
      await supabase.from("operator_follows").delete().eq("follower_id", user.id).eq("following_id", operatorId);
      setFollowing((s) => ({ ...s, [operatorId]: false }));
    } else {
      await supabase.from("operator_follows").insert({ follower_id: user.id, following_id: operatorId });
      setFollowing((s) => ({ ...s, [operatorId]: true }));
    }
  };

  return (
    <div>
      <PageHeader title="OPERATOR SEARCH" subtitle="// DISCOVERY" />
      <HudCard title="FIND OPERATORS" icon={<Search size={14} />} glow>
        <div className="flex gap-2 mb-4">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search @username or display name"
            className="flex-1 bg-muted border border-border rounded px-3 py-2 text-sm" />
          <button onClick={runSearch} className="px-3 py-2 text-xs font-mono border border-primary/40 text-primary rounded">SEARCH</button>
        </div>
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        {loading ? <Loader2 className="animate-spin text-primary" /> : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="border border-border rounded p-3 bg-card/60 flex items-center justify-between gap-2">
                <button className="text-left flex-1" onClick={() => setActiveOperatorId(r.id)}>
                <p className="font-body">{r.display_name || "Operator"} <span className="text-muted-foreground text-xs">@{r.username || "unset"}</span></p>
                <p className="text-[10px] font-mono text-muted-foreground">{r.character_class || "Unknown"} · {r.navi_name || "NAVI"} · Lv {r.operator_level || 1}</p>
                </button>
                {user && r.id !== user.id && (
                  <button onClick={() => toggleFollow(r.id)} className="text-[10px] font-mono border border-primary/30 text-primary rounded px-2 py-1">
                    {following[r.id] ? "UNFOLLOW" : "FOLLOW"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </HudCard>
      <OperatorProfileSheet operatorId={activeOperatorId || ""} isOpen={Boolean(activeOperatorId)} onClose={() => setActiveOperatorId(null)} />
    </div>
  );
}
