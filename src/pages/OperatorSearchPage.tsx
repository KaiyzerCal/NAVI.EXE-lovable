import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search } from "lucide-react";

export default function OperatorSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const trimmed = useMemo(() => query.trim(), [query]);

  const runSearch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,display_name,username,navi_name,character_class,operator_level")
      .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
      .limit(25);
    setResults(data || []);
    setLoading(false);
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
        {loading ? <Loader2 className="animate-spin text-primary" /> : (
          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.id} className="border border-border rounded p-3 bg-card/60">
                <p className="font-body">{r.display_name || "Operator"} <span className="text-muted-foreground text-xs">@{r.username || "unset"}</span></p>
                <p className="text-[10px] font-mono text-muted-foreground">{r.character_class || "Unknown"} · {r.navi_name || "NAVI"} · Lv {r.operator_level || 1}</p>
              </div>
            ))}
          </div>
        )}
      </HudCard>
    </div>
  );
}
