import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  actor_id: string | null;
  actor_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  await supabase.from("notifications" as any).insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    actor_id: input.actorId ?? null,
    actor_name: input.actorName ?? null,
    metadata: input.metadata ?? {},
  });
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data as AppNotification[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    channelRef.current = supabase
      .channel(`notifications_${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as AppNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [user, fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase
      .from("notifications" as any)
      .update({ read: true })
      .eq("id", id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase
      .from("notifications" as any)
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  }, [user]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications" as any).delete().eq("id", id);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
