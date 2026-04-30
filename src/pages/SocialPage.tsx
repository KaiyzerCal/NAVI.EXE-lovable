import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageSquare, Trash2, Send, Loader2, Sword, Zap,
  Trophy, Flame, Star, Diamond, Shield, RefreshCw, ChevronDown,
  Inbox, Globe, Users, User, ArrowUp,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { useAppData } from "@/contexts/AppDataContext";
import { toast } from "@/hooks/use-toast";
import { timeAgo, initials } from "@/lib/feedHelpers";
import type { FeedPost, FeedReply } from "@/hooks/useFeed";
import type { InboxThread } from "@/hooks/useDirectMessages";
import DirectMessageModal from "@/components/DirectMessageModal";
import OperatorProfileSheet from "@/components/OperatorProfileSheet";

// ── Icon + color per content_type ─────────────────────────────────────────────
const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  CUSTOM:         { icon: <User size={12} />,       color: "hsl(var(--foreground))" },
  STATUS:         { icon: <User size={12} />,       color: "hsl(var(--foreground))" },
  QUEST_COMPLETE: { icon: <Sword size={12} />,      color: "#22c55e" },
  LEVEL_UP:       { icon: <Zap size={12} />,        color: "#00E5FF" },
  ACHIEVEMENT:    { icon: <Trophy size={12} />,     color: "#FFBF00" },
  STREAK:         { icon: <Flame size={12} />,      color: "#FF6B00" },
  EVOLUTION:      { icon: <Star size={12} />,       color: "#FF2D9B" },
  SKIN_UNLOCK:    { icon: <Diamond size={12} />,    color: "#7B2FFF" },
  GUILD_EVENT:    { icon: <Shield size={12} />,     color: "#3b82f6" },
};

// ── Feed Card ─────────────────────────────────────────────────────────────────
function FeedCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  onAuthorClick,
  onReply,
  fetchReplies,
  addReply,
  currentDisplayName,
}: {
  post: FeedPost;
  currentUserId: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onAuthorClick: (id: string) => void;
  onReply: (id: string, content: string, name: string | null) => Promise<void>;
  fetchReplies: (id: string) => Promise<FeedReply[]>;
  addReply: (postId: string, content: string, displayName: string | null) => Promise<FeedReply | null>;
  currentDisplayName: string | null;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<FeedReply[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const isOwn = post.operator_id === currentUserId;
  const likes = Array.isArray(post.likes) ? post.likes : [];
  const hasLiked = likes.includes(currentUserId);
  const typeMeta = TYPE_META[post.content_type] ?? TYPE_META.CUSTOM;

  const toggleReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      const data = await fetchReplies(post.id);
      setReplies(data);
      setLoadingReplies(false);
    }
    setShowReplies(!showReplies);
  };

  const handleReply = async () => {
    if (!replyInput.trim() || sendingReply) return;
    setSendingReply(true);
    const r = await addReply(post.id, replyInput.trim(), currentDisplayName);
    if (r) {
      setReplies(prev => [...prev, r]);
      setReplyInput("");
    }
    setSendingReply(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-lg border border-border bg-card/60 overflow-hidden"
    >
      {/* Author row */}
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={() => onAuthorClick(post.operator_id)}
          className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-sm text-primary hover:border-primary/50 transition-colors shrink-0"
        >
          {initials(post.display_name)}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <button
              onClick={() => onAuthorClick(post.operator_id)}
              className="font-display text-sm font-bold text-foreground hover:text-primary transition-colors"
            >
              {post.display_name || "Unknown Operator"}
            </button>
            {post.character_class && (
              <span className="text-[9px] font-mono bg-secondary/20 text-secondary border border-secondary/30 px-1.5 py-0.5 rounded">
                {post.character_class.toUpperCase()}
              </span>
            )}
            <span className="text-[9px] font-mono bg-muted/40 text-muted-foreground border border-border px-1.5 py-0.5 rounded">
              LV{post.operator_level}
            </span>
          </div>
          {post.navi_name && (
            <p className="text-[10px] font-mono text-muted-foreground">{post.navi_name}</p>
          )}
        </div>

        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
          {timeAgo(post.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 pb-2">
        <div className="flex items-start gap-2">
          <span style={{ color: typeMeta.color }} className="mt-0.5 shrink-0">{typeMeta.icon}</span>
          <p
            className="text-sm font-body leading-relaxed"
            style={{ color: post.content_type === "CUSTOM" || post.content_type === "STATUS" ? "hsl(var(--foreground))" : typeMeta.color }}
          >
            {post.content}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 pb-2.5 pt-1 border-t border-border/50">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded transition-all ${
            hasLiked
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary/5"
          }`}
        >
          <Heart size={12} fill={hasLiked ? "currentColor" : "none"} />
          {likes.length > 0 && <span>{likes.length}</span>}
        </button>

        <button
          onClick={toggleReplies}
          className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
        >
          <MessageSquare size={12} />
          <span>REPLY</span>
        </button>

        {isOwn && (
          <button
            onClick={() => onDelete(post.id)}
            className="ml-auto text-[11px] font-mono px-2 py-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all flex items-center gap-1"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Replies panel */}
      <AnimatePresence>
        {showReplies && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/50 bg-muted/20 overflow-hidden"
          >
            <div className="p-3 space-y-2">
              {loadingReplies && <Loader2 className="animate-spin text-primary mx-auto" size={14} />}
              {replies.map(r => (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-display font-bold text-muted-foreground shrink-0">
                    {initials(r.display_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-primary">{r.display_name || "Operator"}</p>
                    <p className="text-xs font-body text-foreground">{r.content}</p>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
                </div>
              ))}
              {/* Reply input */}
              <div className="flex items-end gap-2 mt-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleReply(); }}
                  placeholder="Write a reply…"
                  className="flex-1 bg-muted border border-border rounded px-2.5 py-1.5 text-xs font-body text-foreground outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyInput.trim() || sendingReply}
                  className="w-7 h-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
                >
                  {sendingReply ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Inbox Thread Card ─────────────────────────────────────────────────────────
function InboxThreadCard({
  thread,
  onOpen,
  onDelete,
}: {
  thread: InboxThread;
  onOpen: (thread: InboxThread) => void;
  onDelete: (thread: InboxThread) => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      onHoverStart={() => setShowDelete(true)}
      onHoverEnd={() => setShowDelete(false)}
      className="flex items-center gap-3 px-3 py-2.5 rounded border border-border bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-all cursor-pointer group"
      onClick={() => onOpen(thread)}
    >
      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-sm text-primary shrink-0">
        {initials(thread.otherDisplayName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-display font-bold text-foreground truncate">
            {thread.otherDisplayName || "Unknown"}
          </span>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
              thread.type === "DIRECT"
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-accent/10 text-accent border-accent/30"
            }`}
          >
            {thread.type}
          </span>
          {thread.unread > 0 && (
            <span className="text-[9px] font-mono bg-primary text-background px-1.5 py-0.5 rounded-full font-bold shrink-0">
              {thread.unread}
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-muted-foreground truncate">{thread.lastContent}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(thread.lastAt)}</span>
        <AnimatePresence>
          {showDelete && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
            >
              <Trash2 size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setConfirmOpen(false); }}
              className="fixed inset-0 z-[95] bg-black/50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-8 top-1/2 -translate-y-1/2 z-[96] rounded-lg border border-destructive/40 bg-card p-5 text-center space-y-3 max-w-sm mx-auto"
            >
              <p className="text-sm font-display font-bold text-foreground">Delete this conversation?</p>
              <p className="text-[11px] font-mono text-muted-foreground">
                This only removes it from your inbox.<br />The other operator's copy is unaffected.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="px-4 py-1.5 rounded border border-border text-xs font-mono text-muted-foreground hover:text-foreground"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { setConfirmOpen(false); onDelete(thread); }}
                  className="px-4 py-1.5 rounded border border-destructive/40 bg-destructive/10 text-xs font-mono text-destructive hover:bg-destructive/20"
                >
                  DELETE
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type Tab = "FEED" | "INBOX";
type FeedFilter = "ALL" | "MY_POSTS";

export default function SocialPage() {
  const {
    profile,
    feed: { posts, loading: feedLoading, hasMore, loadingMore, newPostsCount, createPost, deletePost, toggleLike, fetchReplies, addReply, loadMore, clearNewPosts },
    inbox: { fetchInboxThreads, deleteDMThread, deleteNaviThread },
  } = useAppData();

  const [tab, setTab] = useState<Tab>("FEED");
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("ALL");
  const [postInput, setPostInput] = useState("");
  const [posting, setPosting] = useState(false);

  // Inbox state
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [activeDm, setActiveDm] = useState<InboxThread | null>(null);
  const [dmModalOpen, setDmModalOpen] = useState(false);

  // Profile sheet
  const [profileSheetId, setProfileSheetId] = useState<string | null>(null);

  const feedTopRef = useRef<HTMLDivElement>(null);

  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    const data = await fetchInboxThreads();
    setThreads(data);
    setInboxLoading(false);
  }, [fetchInboxThreads]);

  useEffect(() => {
    if (tab === "INBOX") loadInbox();
  }, [tab, loadInbox]);

  const handlePost = async () => {
    if (!postInput.trim() || posting) return;
    setPosting(true);
    await createPost({
      content_type: "CUSTOM",
      content: postInput.trim(),
      display_name: profile.display_name,
      navi_name: profile.navi_name,
      character_class: profile.character_class,
      mbti_type: profile.mbti_type,
      operator_level: profile.operator_level ?? 1,
    });
    setPostInput("");
    setPosting(false);
  };

  const handleDeleteThread = async (thread: InboxThread) => {
    if (thread.type === "DIRECT") {
      await deleteDMThread(thread.otherId);
    } else {
      // For navi messages: determine if we are sender by checking first message
      await deleteNaviThread(thread.otherId, false);
    }
    setThreads(prev => prev.filter(t => !(t.otherId === thread.otherId && t.type === thread.type)));
    const { toast } = await import("@/hooks/use-toast");
    toast.call(null, { title: "Conversation removed from your inbox." });
  };

  const handleOpenThread = (thread: InboxThread) => {
    if (thread.type === "DIRECT") {
      setActiveDm(thread);
      setDmModalOpen(true);
    }
  };

  const scrollToTop = () => {
    clearNewPosts();
    feedTopRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const visiblePosts = feedFilter === "MY_POSTS"
    ? posts.filter(p => p.operator_id === profile.id)
    : posts;

  return (
    <div>
      <PageHeader title="SOCIAL" subtitle="// OPERATOR NETWORK" />

      {/* Tab switcher */}
      <div className="flex mb-5 border-b border-border">
        {(["FEED", "INBOX"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-display tracking-wider border-b-2 transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── FEED TAB ───────────────────────────────────────── */}
      {tab === "FEED" && (
        <div className="space-y-4">
          {/* New posts pill */}
          <AnimatePresence>
            {newPostsCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={scrollToTop}
                className="w-full flex items-center justify-center gap-2 py-2 rounded border border-primary/40 bg-primary/10 text-primary text-xs font-display tracking-widest hover:bg-primary/20 transition-colors"
              >
                <ArrowUp size={12} />
                {newPostsCount} NEW {newPostsCount === 1 ? "POST" : "POSTS"}
              </motion.button>
            )}
          </AnimatePresence>

          <div ref={feedTopRef} />

          {/* Post composer */}
          <HudCard title="POST STATUS" icon={<Globe size={14} />}>
            <div className="space-y-2">
              <textarea
                value={postInput}
                onChange={e => setPostInput(e.target.value.slice(0, 280))}
                placeholder={`What's your status, ${profile.display_name || "Operator"}?`}
                rows={2}
                className="w-full bg-muted/40 border border-border rounded px-3 py-2 text-sm font-body text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 resize-none transition-colors"
              />
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono ${postInput.length > 250 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {postInput.length}/280
                </span>
                <button
                  onClick={handlePost}
                  disabled={!postInput.trim() || posting}
                  className="px-4 py-1.5 rounded border border-primary/40 bg-primary/10 text-primary text-xs font-display tracking-widest hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  POST
                </button>
              </div>
            </div>
          </HudCard>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["ALL", "MY_POSTS"] as FeedFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFeedFilter(f)}
                className={`px-3 py-1 rounded text-[10px] font-mono tracking-widest border transition-colors ${
                  feedFilter === f
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {f === "ALL" ? <><Globe size={10} className="inline mr-1" />ALL</> : <><User size={10} className="inline mr-1" />MY POSTS</>}
              </button>
            ))}
          </div>

          {/* Feed list */}
          {feedLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-card/40 border border-border animate-pulse" />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs font-mono text-muted-foreground">No posts yet.</p>
              <p className="text-[10px] font-mono text-muted-foreground/60">Be the first to post something.</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              <div className="space-y-3">
                {visiblePosts.map(post => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    currentUserId={profile.id ?? ""}
                    onLike={toggleLike}
                    onDelete={deletePost}
                    onAuthorClick={setProfileSheetId}
                    onReply={async () => {}}
                    fetchReplies={fetchReplies}
                    addReply={addReply}
                    currentDisplayName={profile.display_name}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {/* Load more */}
          {hasMore && !feedLoading && visiblePosts.length > 0 && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2 rounded border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore ? <Loader2 size={12} className="animate-spin" /> : <ChevronDown size={12} />}
              LOAD MORE
            </button>
          )}
        </div>
      )}

      {/* ── INBOX TAB ──────────────────────────────────────── */}
      {tab === "INBOX" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest">MESSAGE THREADS</p>
            <button
              onClick={loadInbox}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh inbox"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {inboxLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded bg-card/40 border border-border animate-pulse" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Inbox size={28} className="text-muted-foreground mx-auto" />
              <p className="text-xs font-mono text-muted-foreground">No messages yet.</p>
              <p className="text-[10px] font-mono text-muted-foreground/60">
                Message an operator from their profile.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {threads.map(thread => (
                  <InboxThreadCard
                    key={`${thread.type}_${thread.otherId}`}
                    thread={thread}
                    onOpen={handleOpenThread}
                    onDelete={handleDeleteThread}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Profile sheet */}
      {profileSheetId && (
        <OperatorProfileSheet
          operatorId={profileSheetId}
          isOpen={!!profileSheetId}
          onClose={() => setProfileSheetId(null)}
        />
      )}

      {/* DM modal */}
      {activeDm && (
        <DirectMessageModal
          targetId={activeDm.otherId}
          targetDisplayName={activeDm.otherDisplayName}
          targetNaviName={activeDm.otherNaviName}
          isOpen={dmModalOpen}
          onClose={() => { setDmModalOpen(false); setActiveDm(null); loadInbox(); }}
        />
      )}
    </div>
  );
}
