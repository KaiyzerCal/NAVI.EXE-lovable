import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FeedPost {
  id: string;
  operator_id: string;
  display_name: string;
  navi_name: string;
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
  display_name: string;
  content: string;
  created_at: string;
}

interface FeedContextType {
  posts: FeedPost[];
  loading: boolean;
  hasMore: boolean;
  newPostCount: number;
  clearNewCount: () => void;
  loadMore: () => Promise<void>;
  submitPost: (content: string, contentType?: string, metadata?: Record<string, any>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  submitReply: (postId: string, content: string) => Promise<void>;
  fetchReplies: (postId: string) => Promise<FeedReply[]>;
  autoPost: (contentType: string, content: string, metadata?: Record<string, any>) => Promise<void>;
}

const FeedContext = createContext<FeedContextType | null>(null);

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

const PAGE_SIZE = 25;

function normalize(raw: any): FeedPost {
  return {
    id: raw.id,
    operator_id: raw.operator_id,
    display_name: raw.display_name ?? "Operator",
    navi_name: raw.navi_name ?? "NAVI",
    character_class: raw.character_class ?? null,
    mbti_type: raw.mbti_type ?? null,
    operator_level: raw.operator_level ?? 1,
    content_type: raw.content_type,
    content: raw.content,
    metadata: raw.metadata ?? {},
    is_public: raw.is_public ?? true,
    likes: Array.isArray(raw.likes) ? raw.likes : [],
    created_at: raw.created_at,
  };
}

export function FeedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newPostCount, setNewPostCount] = useState(0);
  const pageRef = useRef(0);
  const initialDone = useRef(false);

  const loadInitial = useCallback(async () => {
    if (initialDone.current) return;
    initialDone.current = true;
    setLoading(true);
    const { data } = await supabase
      .from("operator_feed")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) {
      setPosts(data.map(normalize));
      setHasMore(data.length === 50);
      pageRef.current = 1;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadInitial();
  }, [user, loadInitial]);

  // Realtime subscription at app level
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("operator-feed-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operator_feed" }, (payload) => {
        const p = normalize(payload.new);
        setPosts((prev) => {
          if (prev.find((x) => x.id === p.id)) return prev;
          return [p, ...prev];
        });
        if (p.operator_id !== user.id) setNewPostCount((n) => n + 1);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "operator_feed" }, (payload) => {
        setPosts((prev) => prev.map((p) => (p.id === payload.new.id ? normalize(payload.new) : p)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "operator_feed" }, (payload) => {
        setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const clearNewCount = useCallback(() => setNewPostCount(0), []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    const from = pageRef.current * PAGE_SIZE;
    const { data } = await supabase
      .from("operator_feed")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (data) {
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...data.map(normalize).filter((p) => !ids.has(p.id))];
      });
      setHasMore(data.length === PAGE_SIZE);
      pageRef.current += 1;
    }
    setLoading(false);
  }, [hasMore, loading]);

  const getMyProfile = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, navi_name, character_class, mbti_type, operator_level")
      .eq("id", user.id)
      .single();
    return data;
  }, [user]);

  const submitPost = useCallback(async (
    content: string,
    contentType = "CUSTOM",
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return;
    const prof = await getMyProfile();
    const row = {
      operator_id: user.id,
      display_name: prof?.display_name ?? "Operator",
      navi_name: prof?.navi_name ?? "NAVI",
      character_class: prof?.character_class ?? null,
      mbti_type: prof?.mbti_type ?? null,
      operator_level: prof?.operator_level ?? 1,
      content_type: contentType,
      content,
      metadata,
      likes: [],
      is_public: true,
    };

    const tempId = `temp-${Date.now()}`;
    const temp: FeedPost = { ...row, id: tempId, created_at: new Date().toISOString() };
    setPosts((prev) => [temp, ...prev]);

    const { data } = await supabase.from("operator_feed").insert(row).select().single();
    if (data) {
      setPosts((prev) => prev.map((p) => (p.id === tempId ? normalize(data) : p)));
    } else {
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
    }
  }, [user, getMyProfile]);

  const autoPost = useCallback(async (
    contentType: string,
    content: string,
    metadata: Record<string, any> = {}
  ) => {
    await submitPost(content, contentType, metadata);
  }, [submitPost]);

  const deletePost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await supabase.from("operator_feed").delete().eq("id", postId);
  }, []);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const liked = post.likes.includes(user.id);
    const newLikes = liked
      ? post.likes.filter((id) => id !== user.id)
      : [...post.likes, user.id];
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: newLikes } : p)));
    await supabase.from("operator_feed").update({ likes: newLikes }).eq("id", postId);
  }, [user, posts]);

  const fetchReplies = useCallback(async (postId: string): Promise<FeedReply[]> => {
    const { data } = await supabase
      .from("feed_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    return (data ?? []) as FeedReply[];
  }, []);

  const submitReply = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    const prof = await getMyProfile();
    await supabase.from("feed_replies").insert({
      post_id: postId,
      operator_id: user.id,
      display_name: prof?.display_name ?? "Operator",
      content,
    });
  }, [user, getMyProfile]);

  return (
    <FeedContext.Provider value={{
      posts, loading, hasMore, newPostCount,
      clearNewCount, loadMore,
      submitPost, autoPost, deletePost, toggleLike,
      submitReply, fetchReplies,
    }}>
      {children}
    </FeedContext.Provider>
  );
}
