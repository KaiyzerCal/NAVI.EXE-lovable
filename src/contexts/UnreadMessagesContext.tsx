import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UnreadMessagesContextType {
  totalUnread: number;
  unreadByThread: Record<string, number>;
  unreadDMs: number;
  markThreadRead: (threadId: string, isSender: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | null>(null);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [unreadByThread, setUnreadByThread] = useState<Record<string, number>>({});
  const [unreadDMs, setUnreadDMs] = useState(0);

  const fetchNaviUnread = useCallback(async () => {
    if (!user) return 0;
    const { data } = await (supabase as any)
      .from("navi_message_threads")
      .select("id, sender_user_id, sender_unread, receiver_unread")
      .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`);

    const byThread: Record<string, number> = {};
    let total = 0;
    for (const t of (data ?? []) as any[]) {
      const count = t.sender_user_id === user.id
        ? (t.sender_unread ?? 0)
        : (t.receiver_unread ?? 0);
      byThread[t.id] = count;
      total += count;
    }
    setUnreadByThread(byThread);
    return total;
  }, [user]);

  const fetchUnread = useCallback(async () => {
    const naviTotal = await fetchNaviUnread();
    setUnreadDMs(0);
    setTotalUnread(naviTotal);
  }, [fetchNaviUnread]);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  // Single realtime subscription — shared across all consumers
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`unread-count-watch-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "navi_message_threads" }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUnread]);

  const markThreadRead = useCallback(async (threadId: string, isSender: boolean) => {
    const col = isSender ? "sender_unread" : "receiver_unread";
    await (supabase as any)
      .from("navi_message_threads")
      .update({ [col]: 0 })
      .eq("id", threadId);
    const prev = unreadByThread[threadId] ?? 0;
    setUnreadByThread((p) => ({ ...p, [threadId]: 0 }));
    setTotalUnread((p) => Math.max(0, p - prev));
  }, [unreadByThread]);

  return (
    <UnreadMessagesContext.Provider value={{ totalUnread, unreadByThread, unreadDMs, markThreadRead, refresh: fetchUnread }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages(): UnreadMessagesContextType {
  const ctx = useContext(UnreadMessagesContext);
  if (!ctx) throw new Error("useUnreadMessages must be used within UnreadMessagesProvider");
  return ctx;
}
