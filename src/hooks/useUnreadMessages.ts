import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({});

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("navi_message_threads")
      .select("id, sender_user_id, sender_unread, receiver_unread")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`);

    if (!data) return;
    const byThread: Record<string, number> = {};
    let total = 0;
    for (const t of data) {
      const count = t.sender_user_id === user.id
        ? (t.sender_unread ?? 0)
        : (t.receiver_unread ?? 0);
      byThread[t.id] = count;
      total += count;
    }
    setUnreadByThread(byThread);
    setTotalUnread(total);
  }, [user]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  // Realtime: re-fetch whenever any thread row changes (unread counters update)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-count-watch-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUnread]);

  async function markThreadRead(threadId: string, isSender: boolean) {
    const col = isSender ? "sender_unread" : "receiver_unread";
    await supabase
      .from("navi_message_threads")
      .update({ [col]: 0 } as any)
      .eq("id", threadId);
    const prev = unreadByThread[threadId] ?? 0;
    setUnreadByThread((p) => ({ ...p, [threadId]: 0 }));
    setTotalUnread((p) => Math.max(0, p - prev));
  }

  return { totalUnread, unreadByThread, markThreadRead, refresh: fetchUnread };
}
