import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, UserPlus, UserMinus, MessageSquare, User } from "lucide-react";
import type { OperatorSearchResult } from "@/hooks/useOperatorSearch";
import { useOperatorSearch } from "@/hooks/useOperatorSearch";
import { tierFromLevel, TIER_COLORS } from "@/lib/xpSystem";
import DirectMessageModal from "@/components/DirectMessageModal";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

interface OperatorSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFollowing: (id: string) => boolean;
  follow: (id: string, name?: string | null) => void;
  unfollow: (id: string) => void;
}

export default function OperatorSearchModal({
  isOpen,
  onClose,
  isFollowing,
  follow,
  unfollow,
}: OperatorSearchModalProps) {
  const { results, loading, query, search, clear } = useOperatorSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dmTarget, setDmTarget] = useState<OperatorSearchResult | null>(null);
  const [profileTarget, setProfileTarget] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else clear();
  }, [isOpen, clear]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 top-[10vh] mx-auto max-w-lg z-[1001] px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Search size={15} className="text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  placeholder="Search by @handle or operator name..."
                  className="flex-1 bg-transparent text-sm font-body text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                {query && (
                  <button onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={13} />
                  </button>
                )}
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
                  <X size={15} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={18} className="animate-spin text-primary" />
                  </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="py-8 text-center">
                    <User size={20} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-[10px] font-mono text-muted-foreground">No operators found for "{query}"</p>
                  </div>
                )}

                {!loading && !query && (
                  <div className="py-8 text-center">
                    <Search size={20} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-[10px] font-mono text-muted-foreground">Type to search operators by handle or name.</p>
                  </div>
                )}

                {results.map((op) => {
                  const tier = tierFromLevel(op.operator_level);
                  const tierColor = TIER_COLORS[tier as 1 | 2 | 3 | 4 | 5];
                  const following = isFollowing(op.id);
                  const handle = op.operator_handle ? `@${op.operator_handle}` : null;

                  return (
                    <div
                      key={op.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors group"
                    >
                      {/* Avatar */}
                      <button
                        onClick={() => setProfileTarget(op.id)}
                        className="w-9 h-9 rounded border-2 flex items-center justify-center shrink-0 font-display font-bold text-sm transition-opacity hover:opacity-80"
                        style={{ borderColor: tierColor, color: tierColor, backgroundColor: `${tierColor}15` }}
                      >
                        {(op.display_name || op.operator_handle || "?")[0].toUpperCase()}
                      </button>

                      {/* Info */}
                      <button
                        onClick={() => setProfileTarget(op.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-body font-semibold text-foreground truncate">
                            {op.display_name || "Unnamed Operator"}
                          </span>
                          {handle && (
                            <span className="text-[10px] font-mono text-primary shrink-0">{handle}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {op.character_class && (
                            <span className="text-[9px] font-mono text-muted-foreground">{op.character_class}</span>
                          )}
                          {op.mbti_type && (
                            <span className="text-[9px] font-mono px-1 rounded" style={{ color: tierColor, backgroundColor: `${tierColor}15` }}>
                              {op.mbti_type}
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-muted-foreground">LVL {op.operator_level}</span>
                        </div>
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setDmTarget(op)}
                          className="p-1.5 rounded bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                          title="Send message"
                        >
                          <MessageSquare size={12} />
                        </button>
                        <button
                          onClick={() => following ? unfollow(op.id) : follow(op.id, op.display_name)}
                          className={`p-1.5 rounded border transition-colors ${
                            following
                              ? "bg-primary/10 border-primary/30 text-primary hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
                              : "bg-muted border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                          }`}
                          title={following ? "Unfollow" : "Follow"}
                        >
                          {following ? <UserMinus size={12} /> : <UserPlus size={12} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-border/50 bg-muted/20">
                <p className="text-[9px] font-mono text-muted-foreground">
                  Press ESC to close · Click operator name to view full profile
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(modal, document.body)}

      {dmTarget && (
        <DirectMessageModal
          targetId={dmTarget.id}
          targetDisplayName={dmTarget.display_name}
          targetNaviName={dmTarget.navi_name}
          isOpen={!!dmTarget}
          onClose={() => setDmTarget(null)}
        />
      )}

      {profileTarget && (
        <OperatorProfileSheet
          operatorId={profileTarget}
          isOpen={!!profileTarget}
          onClose={() => setProfileTarget(null)}
        />
      )}
    </>
  );
}
