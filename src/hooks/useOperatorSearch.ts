import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OperatorSearchResult {
  id: string;
  display_name: string | null;
  operator_handle: string | null;
  navi_name: string | null;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number;
  last_active: string | null;
}

export function useOperatorSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<OperatorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (q: string) => {
      setQuery(q);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim() || q.trim().length < 2) {
        setResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        const term = q.trim().replace(/^@/, "").toLowerCase();

        const { data } = await supabase
          .from("profiles")
          .select(
            "id, display_name, operator_handle, navi_name, character_class, mbti_type, operator_level, last_active"
          )
          .or(`operator_handle.ilike.%${term}%,display_name.ilike.%${term}%`)
          .neq("id", user?.id ?? "")
          .limit(20);

        setResults((data as OperatorSearchResult[]) ?? []);
        setLoading(false);
      }, 300);
    },
    [user]
  );

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, query, search, clear };
}
