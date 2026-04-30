import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
  created_at: string;
}

export interface NaviMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_navi_name: string | null;
  sender_display_name: string | null;
  recipient_navi_name: string | null;
  content: string;
  read_at: string | null;
  deleted_by_sender: boolean;
  deleted_by_recipient: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface InboxThread {
  otherId: string;
  otherDisplayName: string | null;
  otherNaviName: string | null;
  lastContent: string;
  lastAt: string;
  unread: number;
  type: "DIRECT" | "NAVI";
  messageId: string;
}

const db = supabase as any;

export function useDirectMessages() {
  const { user } = useAuth();
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch unread count for sidebar badge
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { count } = await db
      .from("direct_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null)
      .eq("deleted_by_recipient", false);
    setDmUnreadCount(count ?? 0);
  }, [user]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  // Real-time for unread badge
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm_unread_rt")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "direct_messages",
        filter: `recipient_id=eq.${user.id}`,
      }, () => { fetchUnreadCount(); })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "direct_messages",
        filter: `recipient_id=eq.${user.id}`,
      }, () => { fetchUnreadCount(); })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchUnreadCount]);

  // Fetch unified inbox threads (DM + navi_messages)
  const fetchInboxThreads = useCallback(async (): Promise<InboxThread[]> => {
    if (!user) return [];

    const [dmRes, naviRes] = await Promise.all([
      db.from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100),
      db.from("navi_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const dmMessages: DirectMessage[] = (dmRes.data ?? []);
    const naviMessages: NaviMessage[] = (naviRes.data ?? []);

    // Build thread map — one thread per other operator
    const threadMap = new Map<string, InboxThread>();

    for (const msg of dmMessages) {
      const isSender = msg.sender_id === user.id;
      if (isSender && msg.deleted_by_sender) continue;
      if (!isSender && msg.deleted_by_recipient) continue;

      const otherId = isSender ? msg.recipient_id : msg.sender_id;
      const key = `dm_${otherId}`;
      if (!threadMap.has(key) || msg.created_at > threadMap.get(key)!.lastAt) {
        const existing = threadMap.get(key);
        const unread = (!isSender && !msg.read_at) ? (existing?.unread ?? 0) + 1 : (existing?.unread ?? 0);
        threadMap.set(key, {
          otherId,
          otherDisplayName: null,
          otherNaviName: null,
          lastContent: msg.content,
          lastAt: msg.created_at,
          unread,
          type: "DIRECT",
          messageId: msg.id,
        });
      }
    }

    for (const msg of naviMessages) {
      const isSender = msg.sender_id === user.id;
      if (isSender && msg.deleted_by_sender) continue;
      if (!isSender && msg.deleted_by_recipient) continue;
      if (msg.deleted_at) continue;

      const otherId = isSender ? msg.recipient_id : msg.sender_id;
      const key = `navi_${otherId}`;
      if (!threadMap.has(key) || msg.created_at > threadMap.get(key)!.lastAt) {
        const existing = threadMap.get(key);
        const unread = (!isSender && !msg.read_at) ? (existing?.unread ?? 0) + 1 : (existing?.unread ?? 0);
        threadMap.set(key, {
          otherId,
          otherDisplayName: isSender ? null : (msg.sender_display_name ?? null),
          otherNaviName: isSender ? null : (msg.sender_navi_name ?? null),
          lastContent: msg.content,
          lastAt: msg.created_at,
          unread,
          type: "NAVI",
          messageId: msg.id,
        });
      }
    }

    // Enrich missing display names from profiles
    const missingIds = Array.from(threadMap.values())
      .filter(t => !t.otherDisplayName)
      .map(t => t.otherId);

    if (missingIds.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, display_name, navi_name")
        .in("id", missingIds);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      for (const [key, thread] of threadMap) {
        const p = profileMap.get(thread.otherId) as any;
        if (p) {
          threadMap.set(key, {
            ...thread,
            otherDisplayName: p.display_name ?? null,
            otherNaviName: p.navi_name ?? null,
          });
        }
      }
    }

    return Array.from(threadMap.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );
  }, [user]);

  // Fetch DM thread messages between current user and otherId
  const fetchDMThread = useCallback(async (otherId: string): Promise<DirectMessage[]> => {
    if (!user) return [];
    const { data } = await db
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    return ((data ?? []) as DirectMessage[]).filter(m => {
      if (m.sender_id === user.id && m.deleted_by_sender) return false;
      if (m.recipient_id === user.id && m.deleted_by_recipient) return false;
      return true;
    });
  }, [user]);

  // Fetch navi_messages thread
  const fetchNaviThread = useCallback(async (otherId: string): Promise<NaviMessage[]> => {
    if (!user) return [];
    const { data } = await db
      .from("navi_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });
    return ((data ?? []) as NaviMessage[]).filter(m => {
      if (m.sender_id === user.id && m.deleted_by_sender) return false;
      if (m.recipient_id === user.id && m.deleted_by_recipient) return false;
      if (m.deleted_at) return false;
      return true;
    });
  }, [user]);

  const sendDM = useCallback(async (recipientId: string, content: string): Promise<DirectMessage | null> => {
    if (!user || !content.trim()) return null;
    const { data, error } = await db
      .from("direct_messages")
      .insert({ sender_id: user.id, recipient_id: recipientId, content: content.trim() })
      .select()
      .single();
    if (error) return null;
    return data as DirectMessage;
  }, [user]);

  const markDMRead = useCallback(async (messageIds: string[]) => {
    if (!user || messageIds.length === 0) return;
    await db
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", messageIds)
      .eq("recipient_id", user.id)
      .is("read_at", null);
    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  const deleteDM = useCallback(async (messageId: string, isSender: boolean) => {
    const col = isSender ? "deleted_by_sender" : "deleted_by_recipient";
    await db.from("direct_messages").update({ [col]: true }).eq("id", messageId);
  }, []);

  const deleteNaviMessage = useCallback(async (messageId: string, isSender: boolean) => {
    const col = isSender ? "deleted_by_sender" : "deleted_by_recipient";
    await db.from("navi_messages").update({ [col]: true }).eq("id", messageId);
  }, []);

  const deleteNaviThread = useCallback(async (otherId: string, isSender: boolean) => {
    if (!user) return;
    const col = isSender ? "deleted_by_sender" : "deleted_by_recipient";
    const idCol = isSender ? "sender_id" : "recipient_id";
    await db.from("navi_messages").update({ [col]: true })
      .eq(idCol, user.id)
      .or(
        isSender
          ? `recipient_id.eq.${otherId}`
          : `sender_id.eq.${otherId}`
      );
  }, [user]);

  const deleteDMThread = useCallback(async (otherId: string) => {
    if (!user) return;
    // Mark all messages in thread as deleted for current user
    const { data } = await db
      .from("direct_messages")
      .select("id, sender_id")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`);
    if (!data) return;
    for (const msg of data as DirectMessage[]) {
      const col = msg.sender_id === user.id ? "deleted_by_sender" : "deleted_by_recipient";
      await db.from("direct_messages").update({ [col]: true }).eq("id", msg.id);
    }
    fetchUnreadCount();
  }, [user, fetchUnreadCount]);

  return {
    dmUnreadCount,
    fetchUnreadCount,
    fetchInboxThreads,
    fetchDMThread,
    fetchNaviThread,
    sendDM,
    markDMRead,
    deleteDM,
    deleteNaviMessage,
    deleteNaviThread,
    deleteDMThread,
  };
}
