import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({});
  const [unreadDMs, setUnreadDMs] = useState(0);

  const fetchNaviUnread = useCallback(async () => {
    if (!user) return 0;
    const { data } = await supabase
      .from("navi_message_threads")
      .select("id, sender_user_id, sender_unread, receiver_unread")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`);

    const byThread: Record<string, number> = {};
    let total = 0;
    for (const t of data ?? []) {
      const count = t.sender_user_id === user.id
        ? (t.sender_unread ?? 0)
        : (t.receiver_unread ?? 0);
      byThread[t.id] = count;
      total += count;
    }
    setUnreadByThread(byThread);
    return total;
  }, [user]);

  const fetchDMUnread = useCallback(async () => {
    if (!user) return 0;
    const { count } = await supabase
      .from("direct_messages" as any)
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null)
      .eq("deleted_by_recipient", false);
    return count ?? 0;
  }, [user]);

  const fetchUnread = useCallback(async () => {
    const [naviTotal, dmTotal] = await Promise.all([fetchNaviUnread(), fetchDMUnread()]);
    setUnreadDMs(dmTotal);
    setTotalUnread(naviTotal + dmTotal);
  }, [fetchNaviUnread, fetchDMUnread]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  // Realtime: re-fetch when navi thread counts or DM read_at changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-count-watch-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, fetchUnread)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "direct_messages" }, fetchUnread)
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

  return { totalUnread, unreadByThread, unreadDMs, markThreadRead, refresh: fetchUnread };
}
