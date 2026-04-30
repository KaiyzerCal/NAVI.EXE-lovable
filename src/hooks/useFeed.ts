import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedPost {
  id: string;
  operator_id: string;
  display_name: string | null;
  navi_name: string | null;
  character_class: string | null;
  mbti_type: string | null;
  operator_level: number;
  content_type: string;
  content: string;
  metadata: Record<string, any>;
  is_public: boolean;
  likes: string[];
  created_at: string;
}

export interface FeedReply {
  id: string;
  post_id: string;
  operator_id: string;
  display_name: string | null;
  content: string;
  created_at: string;
}

const PAGE_SIZE = 25;
const db = supabase as any;

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostsCount, setNewPostsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchInitial = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await db
        .from("operator_feed")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (fetchErr) throw fetchErr;
      setPosts((data ?? []) as FeedPost[]);
      setHasMore((data?.length ?? 0) === 50);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || !hasMore || posts.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = posts[posts.length - 1];
      const { data, error: fetchErr } = await db
        .from("operator_feed")
        .select("*")
        .eq("is_public", true)
        .lt("created_at", oldest.created_at)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (fetchErr) throw fetchErr;
      setPosts(prev => [...prev, ...((data ?? []) as FeedPost[])]);
      setHasMore((data?.length ?? 0) === PAGE_SIZE);
    } catch { /* silent */ } finally {
      setLoadingMore(false);
    }
  }, [user, posts, loadingMore, hasMore]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("operator_feed_rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operator_feed" }, (payload) => {
        const newPost = payload.new as FeedPost;
        if (newPost.operator_id !== user.id) {
          setNewPostsCount(c => c + 1);
        }
        setPosts(prev => [newPost, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operator_feed" }, (payload) => {
        const updated = payload.new as FeedPost;
        setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "operator_feed" }, (payload) => {
        setPosts(prev => prev.filter(p => p.id !== (payload.old as any).id));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  const createPost = useCallback(async (params: {
    content_type: string;
    content: string;
    metadata?: Record<string, any>;
    display_name: string | null;
    navi_name: string | null;
    character_class: string | null;
    mbti_type: string | null;
    operator_level: number;
  }) => {
    if (!user) return null;
    const tempId = `temp_${Date.now()}`;
    const optimistic: FeedPost = {
      id: tempId,
      operator_id: user.id,
      display_name: params.display_name,
      navi_name: params.navi_name,
      character_class: params.character_class,
      mbti_type: params.mbti_type,
      operator_level: params.operator_level,
      content_type: params.content_type,
      content: params.content,
      metadata: params.metadata ?? {},
      is_public: true,
      likes: [],
      created_at: new Date().toISOString(),
    };
    setPosts(prev => [optimistic, ...prev]);

    const { data, error: insertErr } = await db
      .from("operator_feed")
      .insert({
        operator_id: user.id,
        display_name: params.display_name,
        navi_name: params.navi_name,
        character_class: params.character_class,
        mbti_type: params.mbti_type,
        operator_level: params.operator_level,
        content_type: params.content_type,
        content: params.content,
        metadata: params.metadata ?? {},
        is_public: true,
        likes: [],
      })
      .select()
      .single();

    if (insertErr) {
      setPosts(prev => prev.filter(p => p.id !== tempId));
      return null;
    }
    setPosts(prev => prev.map(p => p.id === tempId ? (data as FeedPost) : p));
    return data as FeedPost;
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    await db.from("operator_feed").delete().eq("id", postId).eq("operator_id", user.id);
  }, [user]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(user.id);
    const newLikes = hasLiked ? likes.filter(id => id !== user.id) : [...likes, user.id];
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: newLikes } : p));
    await db.from("operator_feed").update({ likes: newLikes }).eq("id", postId);
  }, [user, posts]);

  const fetchReplies = useCallback(async (postId: string): Promise<FeedReply[]> => {
    const { data } = await db
      .from("feed_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    return (data ?? []) as FeedReply[];
  }, []);

  const addReply = useCallback(async (postId: string, content: string, displayName: string | null) => {
    if (!user || !content.trim()) return null;
    const { data, error: insertErr } = await db
      .from("feed_replies")
      .insert({ post_id: postId, operator_id: user.id, display_name: displayName, content: content.trim() })
      .select()
      .single();
    if (insertErr) return null;
    return data as FeedReply;
  }, [user]);

  const clearNewPosts = useCallback(() => setNewPostsCount(0), []);

  return {
    posts,
    setPosts,
    loading,
    loadingMore,
    hasMore,
    newPostsCount,
    error,
    fetchInitial,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
    fetchReplies,
    addReply,
    clearNewPosts,
  };
}
