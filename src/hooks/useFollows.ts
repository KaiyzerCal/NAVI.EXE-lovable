import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createNotification } from "@/hooks/useNotifications";

export interface FollowCounts {
  followers: number;
  following: number;
}

export function useFollows() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("operator_follows" as any)
      .select("following_id")
      .eq("follower_id", user.id)
      .then(({ data }) => {
        if (data) setFollowingIds(new Set((data as any[]).map((r) => r.following_id)));
        setLoading(false);
      });
  }, [user]);

  const isFollowing = useCallback(
    (userId: string) => followingIds.has(userId),
    [followingIds]
  );

  const follow = useCallback(
    async (targetId: string, targetDisplayName?: string | null) => {
      if (!user || followingIds.has(targetId)) return;
      setFollowingIds((prev) => new Set([...prev, targetId]));

      const { error } = await supabase
        .from("operator_follows" as any)
        .insert({ follower_id: user.id, following_id: targetId });

      if (error) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        return;
      }

      // Notify the followed user
      const { data: actorProfile } = await supabase
        .from("profiles")
        .select("display_name, operator_handle")
        .eq("id", user.id)
        .single();

      const actorName =
        (actorProfile as any)?.operator_handle
          ? `@${(actorProfile as any).operator_handle}`
          : (actorProfile as any)?.display_name || "An operator";

      await createNotification({
        userId: targetId,
        type: "follow",
        title: `${actorName} is now following you`,
        body: null,
        actorId: user.id,
        actorName,
        metadata: {},
      });
    },
    [user, followingIds]
  );

  const unfollow = useCallback(
    async (targetId: string) => {
      if (!user || !followingIds.has(targetId)) return;
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      await supabase
        .from("operator_follows" as any)
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetId);
    },
    [user, followingIds]
  );

  const fetchCounts = useCallback(async (targetId: string): Promise<FollowCounts> => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase
        .from("operator_follows" as any)
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetId),
      supabase
        .from("operator_follows" as any)
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetId),
    ]);
    return { followers: followers ?? 0, following: following ?? 0 };
  }, []);

  return { followingIds, loading, isFollowing, follow, unfollow, fetchCounts };
}
