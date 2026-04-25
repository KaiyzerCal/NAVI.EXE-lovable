import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import HudCard from "@/components/HudCard";
import { Radio, Loader2, Zap, Plus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

interface Post {
  id: string;
  user_id: string;
  content: string;
  post_type: string;
  reaction_count: number;
  created_at: string;
  display_name?: string | null;
  operator_level?: number;
}

const POST_TYPE_LABELS: Record<string, string> = {
  update: "UPDATE",
  quest_complete: "QUEST",
  milestone: "MILESTONE",
  reflection: "REFLECTION",
};

const POST_TYPE_COLORS: Record<string, string> = {
  update: "text-muted-foreground bg-muted/40",
  quest_complete: "text-neon-green bg-neon-green/10",
  milestone: "text-primary bg-primary/10",
  reflection: "text-secondary bg-secondary/10",
};

export default function SocialPage() {
  const { user } = useAuth();
  const { profile } = useAppData();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("update");
  const [submitting, setSubmitting] = useState(false);
  const [reacted, setReacted] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    const { data } = await supabase
      .from("social_posts")
      .select("*, profiles(display_name, operator_level)")
      .order("created_at", { ascending: false })
      .limit(50);

    const mapped = (data ?? []).map((p: any) => ({
      ...p,
      display_name: p.profiles?.display_name ?? null,
      operator_level: p.profiles?.operator_level ?? 1,
    }));
    setPosts(mapped);
    setLoading(false);
  }

  async function submitPost() {
    if (!postContent.trim() || !user) return;
    setSubmitting(true);
    const { data } = await supabase
      .from("social_posts")
      .insert({
        user_id: user.id,
        content: postContent.trim(),
        post_type: postType,
      })
      .select()
      .single();

    if (data) {
      setPosts((prev) => [{
        ...data,
        display_name: profile.display_name,
        operator_level: profile.operator_level,
      }, ...prev]);
    }
    setPostContent("");
    setComposing(false);
    setSubmitting(false);
  }

  async function react(postId: string, currentCount: number) {
    if (!user || reacted.has(postId)) return;
    setReacted((prev) => new Set([...prev, postId]));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reaction_count: p.reaction_count + 1 } : p));
    await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id, emoji: "⚡" });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div>
      <PageHeader title="OPERATOR FEED" subtitle="// DISPATCHES FROM THE FIELD" />

      {/* Compose */}
      <div className="mb-5">
        {composing ? (
          <HudCard title="NEW POST" icon={<Plus size={14} />}>
            <div className="flex gap-2 mb-3">
              {Object.entries(POST_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${postType === type ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's your status, Operator?"
              rows={3}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm font-body text-foreground outline-none focus:border-primary/40 resize-none mb-3"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setComposing(false)} className="px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                CANCEL
              </button>
              <button
                onClick={submitPost}
                disabled={submitting || !postContent.trim()}
                className="px-4 py-1.5 rounded border border-primary/50 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {submitting ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
                BROADCAST
              </button>
            </div>
          </HudCard>
        ) : (
          <button
            onClick={() => setComposing(true)}
            className="w-full py-3 rounded-lg border border-dashed border-border text-muted-foreground text-xs font-mono hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Radio size={12} />
            BROADCAST TO FEED
          </button>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-body text-foreground font-medium">
                    {post.display_name ?? "Operator"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    LV.{post.operator_level}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${POST_TYPE_COLORS[post.post_type] ?? POST_TYPE_COLORS.update}`}>
                    {POST_TYPE_LABELS[post.post_type] ?? "UPDATE"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">{timeAgo(post.created_at)}</span>
                </div>
              </div>

              <p className="text-sm font-body text-foreground leading-relaxed mb-3">{post.content}</p>

              <button
                onClick={() => react(post.id, post.reaction_count)}
                disabled={reacted.has(post.id) || post.user_id === user?.id}
                className={`flex items-center gap-1 text-[10px] font-mono transition-colors ${
                  reacted.has(post.id) ? "text-primary" : "text-muted-foreground hover:text-primary"
                } disabled:opacity-50`}
              >
                <Zap size={10} />
                {post.reaction_count}
              </button>
            </motion.div>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="font-mono text-muted-foreground text-sm">No dispatches yet. Be the first to broadcast.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
