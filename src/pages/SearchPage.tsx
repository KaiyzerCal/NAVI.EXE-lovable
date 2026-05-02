import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, UserPlus, UserCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

interface OperatorResult {
  id: string;
  display_name: string | null;
  username: string | null;
  navi_name: string | null;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number | null;
  subscription_tier: string | null;
}

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OperatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [togglingFollow, setTogglingFollow] = useState<Set<string>>(new Set());
  const [profileSheetId, setProfileSheetId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load current user's following list on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("operator_follows" as any)
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        if (data) {
          setFollowingIds(new Set((data as any[]).map((r) => r.following_id)));
        }
      });
  }, [user]);

  const runSearch = useCallback(
    async (q: string) => {
      if (!user || q.trim().length < 2) {
        setResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearched(true);

      const { data, error } = await (supabase as any)
        .from("profiles")
        .select(
          "id, display_name, username, navi_name, character_class, mbti_type, operator_level, subscription_tier"
        )
        .or(`display_name.ilike.%${q.trim()}%,username.ilike.%${q.trim()}%`)
        .neq("id", user.id)
        .limit(30);

      if (!error && data) {
        setResults(data as OperatorResult[]);
      } else {
        setResults([]);
      }
      setLoading(false);
    },
    [user]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const toggleFollow = useCallback(
    async (operatorId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!user || togglingFollow.has(operatorId)) return;

      setTogglingFollow((prev) => new Set(prev).add(operatorId));
      const isFollowing = followingIds.has(operatorId);

      // Optimistic update
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.delete(operatorId);
        else next.add(operatorId);
        return next;
      });

      if (isFollowing) {
        await (supabase as any)
          .from("operator_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", operatorId);
      } else {
        await (supabase as any).from("operator_follows").upsert(
          { follower_id: user.id, following_id: operatorId },
          { onConflict: "follower_id,following_id" }
        );
      }

      setTogglingFollow((prev) => {
        const next = new Set(prev);
        next.delete(operatorId);
        return next;
      });
    },
    [user, followingIds, togglingFollow]
  );

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const trimmedQuery = query.trim();
  const showEmpty = !loading && !searched;
  const showNoResults = !loading && searched && results.length === 0;
  const showResults = !loading && results.length > 0;

  return (
    <div>
      <PageHeader title="SEARCH" subtitle="// LOCATE OPERATORS" />

      {/* Search Input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search size={16} className="text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or @handle..."
          autoFocus
          className="w-full bg-card border border-border rounded-lg pl-10 pr-10 py-3 text-sm font-body text-foreground outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/60"
        />
        <div className="absolute inset-y-0 right-3 flex items-center">
          {loading && <Loader2 size={14} className="animate-spin text-primary" />}
          {!loading && query.length > 0 && (
            <button
              onClick={clearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* States */}
      <AnimatePresence mode="wait">
        {showEmpty && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <Search
              size={36}
              className="mx-auto mb-3 opacity-20 text-muted-foreground"
            />
            <p className="font-mono text-muted-foreground text-sm">
              Search operators by name or @handle
            </p>
            <p className="font-mono text-muted-foreground/50 text-xs mt-1">
              Minimum 2 characters to search
            </p>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-lg border border-border bg-card animate-pulse flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-3 bg-muted rounded" />
                  <div className="w-20 h-2.5 bg-muted rounded" />
                </div>
                <div className="w-20 h-7 bg-muted rounded shrink-0" />
              </div>
            ))}
          </motion.div>
        )}

        {showNoResults && (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <X
              size={36}
              className="mx-auto mb-3 opacity-20 text-muted-foreground"
            />
            <p className="font-mono text-muted-foreground text-sm">
              No operators found for{" "}
              <span className="text-foreground">"{trimmedQuery}"</span>
            </p>
          </motion.div>
        )}

        {showResults && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-[10px] font-mono text-muted-foreground mb-3 tracking-widest">
              // {results.length} OPERATOR{results.length !== 1 ? "S" : ""} FOUND
            </p>
            {results.map((op, i) => {
              const initials = (op.display_name ?? op.username ?? "O")
                .slice(0, 2)
                .toUpperCase();
              const isFollowing = followingIds.has(op.id);
              const isToggling = togglingFollow.has(op.id);

              return (
                <motion.div
                  key={op.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => setProfileSheetId(op.id)}
                  className="p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors cursor-pointer flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-display font-bold text-sm shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-sm font-body font-bold text-foreground truncate">
                        {op.display_name ?? op.username ?? "Operator"}
                      </span>
                      {op.character_class && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary shrink-0">
                          {op.character_class}
                        </span>
                      )}
                      {op.subscription_tier &&
                        op.subscription_tier !== "free" && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-accent/30 bg-accent/10 text-accent uppercase shrink-0">
                            {op.subscription_tier}
                          </span>
                        )}
                    </div>
                    {op.username && (
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        @{op.username}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {op.navi_name ?? "NAVI"} · LVL{" "}
                      {op.operator_level ?? 1}
                    </p>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={(e) => toggleFollow(op.id, e)}
                    disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono font-bold transition-colors shrink-0 disabled:opacity-50 ${
                      isFollowing
                        ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/5 hover:text-muted-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : isFollowing ? (
                      <UserCheck size={10} />
                    ) : (
                      <UserPlus size={10} />
                    )}
                    {isFollowing ? "FOLLOWING" : "FOLLOW"}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Sheet */}
      {profileSheetId && (
        <OperatorProfileSheet
          operatorId={profileSheetId}
          isOpen
          onClose={() => setProfileSheetId(null)}
        />
      )}
    </div>
  );
}
