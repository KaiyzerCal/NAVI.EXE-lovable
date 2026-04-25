import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Loader2, Send, Trash2, Heart, MessageSquare,
  ChevronUp, Swords, Zap, Trophy, Flame, Star, Diamond, Shield, Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useFeed, type FeedPost, type FeedReply } from "@/contexts/FeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";
import PageHeader from "@/components/PageHeader";

const TYPE_CFG: Record<string, { icon: React.ComponentType<any>; color: string; label: string }> = {
  CUSTOM:         { icon: Radio,    color: "text-foreground", label: "STATUS" },
  QUEST_COMPLETE: { icon: Swords,   color: "text-green-400",  label: "QUEST" },
  LEVEL_UP:       { icon: Zap,      color: "text-primary",    label: "LEVEL UP" },
  ACHIEVEMENT:    { icon: Trophy,   color: "text-amber-400",  label: "ACHIEVEMENT" },
  STREAK:         { icon: Flame,    color: "text-orange-400", label: "STREAK" },
  EVOLUTION:      { icon: Star,     color: "text-purple-400", label: "EVOLUTION" },
  SKIN_UNLOCK:    { icon: Diamond,  color: "text-violet-400", label: "SKIN" },
  GUILD_EVENT:    { icon: Shield,   color: "text-blue-400",   label: "GUILD" },
};

function relTime(iso: string) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); }
  catch { return "just now"; }
}

function FeedCard({
  post, myId, onLike, onDelete, onAuthorClick,
}: {
  post: FeedPost; myId: string;
  onLike: () => void; onDelete: () => void; onAuthorClick: () => void;
}) {
  const { submitReply, fetchReplies } = useFeed();
  const cfg = TYPE_CFG[post.content_type] ?? TYPE_CFG.CUSTOM;
  const Icon = cfg.icon;
  const isLiked = post.likes.includes(myId);
  const isOwner = post.operator_id === myId;

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<FeedReply[]>([]);
  const [repliesLoaded, setRepliesLoaded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleReplies = async () => {
    if (!repliesLoaded) { setReplies(await fetchReplies(post.id)); setRepliesLoaded(true); }
    setShowReplies((v) => !v);
  };

  const handleReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    await submitReply(post.id, replyText.trim());
    setReplies(await fetchReplies(post.id));
    setReplyText("");
    setSending(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
      className="p-4 rounded-lg border border-border bg-card hover:border-primary/20 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <button onClick={onAuthorClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm shrink-0">
            {(post.display_name ?? "O")[0].toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-body font-semibold text-foreground truncate">{post.display_name}</span>
              {post.character_class && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary shrink-0">
                  {post.character_class}
                </span>
              )}
              <span className="text-[9px] font-mono text-muted-foreground shrink-0">LV.{post.operator_level}</span>
            </div>
            {post.navi_name && (
              <p className="text-[9px] font-mono text-muted-foreground truncate">{post.navi_name}</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`hidden sm:flex items-center gap-0.5 text-[8px] font-mono ${cfg.color}`}>
            <Icon size={8} />{cfg.label}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap">{relTime(post.created_at)}</span>
          {isOwner && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-2 p-2 rounded border border-destructive/30 bg-destructive/5 flex items-center justify-between overflow-hidden"
          >
            <p className="text-[10px] font-mono text-muted-foreground">Delete this post?</p>
            <div className="flex gap-1.5">
              <button onClick={() => setConfirmDelete(false)} className="text-[9px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border">CANCEL</button>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }} className="text-[9px] font-mono text-destructive px-2 py-0.5 rounded border border-destructive/40 bg-destructive/10 hover:bg-destructive/20">DELETE</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <p className={`text-sm font-body leading-relaxed mb-3 ${cfg.color !== "text-foreground" ? `${cfg.color} font-medium` : "text-foreground"}`}>
        {post.content}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onLike}
          className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${isLiked ? "text-red-400" : "text-muted-foreground hover:text-red-400"}`}
        >
          <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
          {post.likes.length > 0 && <span>{post.likes.length}</span>}
        </button>
        <button
          onClick={toggleReplies}
          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquare size={11} />
          REPLY{replies.length > 0 ? ` (${replies.length})` : ""}
        </button>
      </div>

      {/* Replies */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {replies.map((r) => (
              <div key={r.id} className="flex gap-2 pl-4 border-l-2 border-border">
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-primary mb-0.5">{r.display_name}</p>
                  <p className="text-xs font-body text-foreground">{r.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pl-4 border-l-2 border-primary/20 mt-1.5">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleReply(); } }}
                placeholder="Reply..."
                className="flex-1 bg-muted border border-border rounded px-2.5 py-1 text-xs font-body text-foreground outline-none focus:border-primary/40 transition-colors placeholder:text-muted-foreground/60"
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || sending}
                className="px-2 py-1 rounded border border-primary/40 bg-primary/10 text-primary text-[9px] font-mono disabled:opacity-40 hover:bg-primary/20 transition-colors"
              >
                {sending ? <Loader2 size={9} className="animate-spin" /> : <Send size={9} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-border bg-card animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="space-y-1.5">
              <div className="w-28 h-3 bg-muted rounded" />
              <div className="w-16 h-2 bg-muted rounded" />
            </div>
          </div>
          <div className="w-full h-3 bg-muted rounded" />
          <div className="w-3/4 h-3 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

type FilterTab = "ALL" | "MY POSTS";

export default function SocialPage() {
  const { user } = useAuth();
  const { profile } = useAppData();
  const { posts, loading, hasMore, newPostCount, clearNewCount, loadMore, submitPost, deletePost, toggleLike } = useFeed();

  const [composing, setComposing] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("ALL");
  const [profileSheetId, setProfileSheetId] = useState<string | null>(null);

  const MAX = 280;
  const charCount = postContent.length;

  const filtered = posts.filter((p) => filterTab === "MY POSTS" ? p.operator_id === user?.id : true);

  const handlePost = async () => {
    if (!postContent.trim() || submitting || charCount > MAX) return;
    setSubmitting(true);
    await submitPost(postContent.trim(), "CUSTOM");
    setPostContent("");
    setComposing(false);
    setSubmitting(false);
  };

  const handleAuthorClick = useCallback((operatorId: string) => {
    if (operatorId !== user?.id) setProfileSheetId(operatorId);
  }, [user]);

  return (
    <div>
      <PageHeader title="OPERATOR FEED" subtitle="// DISPATCHES FROM THE FIELD" />

      {/* New posts pill */}
      <AnimatePresence>
        {newPostCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            onClick={() => { clearNewCount(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full mb-3 py-2 rounded border border-primary/40 bg-primary/10 text-primary text-xs font-mono flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
          >
            <ChevronUp size={12} />
            {newPostCount} new post{newPostCount !== 1 ? "s" : ""}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="mb-4">
        {!composing ? (
          <button
            onClick={() => setComposing(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-muted/20 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-display font-bold text-sm shrink-0">
              {(profile.display_name ?? "O")[0].toUpperCase()}
            </div>
            <span className="text-sm font-body text-muted-foreground group-hover:text-foreground transition-colors">
              What's your status, Operator?
            </span>
            <Plus size={14} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/30 bg-card p-4 space-y-3"
          >
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's your status, Operator?"
              rows={3}
              maxLength={MAX}
              autoFocus
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 resize-none placeholder:text-muted-foreground/60 transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono tabular-nums ${charCount > MAX * 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount}/{MAX}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setComposing(false); setPostContent(""); }} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                  CANCEL
                </button>
                <button
                  onClick={handlePost}
                  disabled={submitting || !postContent.trim() || charCount > MAX}
                  className="px-4 py-1.5 rounded border border-primary/50 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                  POST
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4">
        {(["ALL", "MY POSTS"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-3 py-1.5 text-[10px] font-mono rounded border transition-colors ${
              filterTab === tab ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading && posts.length === 0 ? (
        <FeedSkeleton />
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((post) => (
                <FeedCard
                  key={post.id}
                  post={post}
                  myId={user?.id ?? ""}
                  onLike={() => toggleLike(post.id)}
                  onDelete={() => deletePost(post.id)}
                  onAuthorClick={() => handleAuthorClick(post.operator_id)}
                />
              ))}
            </div>
          </AnimatePresence>

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="font-mono text-muted-foreground text-sm">
                {filterTab === "MY POSTS" ? "You haven't posted yet." : "No dispatches yet. Be the first to broadcast."}
              </p>
            </div>
          )}

          {hasMore && filterTab === "ALL" && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full mt-4 py-2 rounded border border-border text-muted-foreground text-xs font-mono hover:border-primary/30 hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : "LOAD MORE"}
            </button>
          )}
        </>
      )}

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
