import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Zap,
  Star,
  Flame,
  MessageSquare,
  Swords,
  Trophy,
  Users,
  Shield,
  Heart,
  Loader2,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  metadata: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type IconConfig = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
};

const TYPE_ICON: Record<string, IconConfig> = {
  LEVEL_UP:      { icon: Zap,          color: "text-cyan-400" },
  EVOLUTION:     { icon: Star,         color: "text-purple-400" },
  STREAK:        { icon: Flame,        color: "text-orange-400" },
  DM:            { icon: MessageSquare, color: "text-primary" },
  QUEST_DUE:     { icon: Swords,       color: "text-amber-400" },
  ACHIEVEMENT:   { icon: Trophy,       color: "text-amber-400" },
  PARTY_INVITE:  { icon: Users,        color: "text-green-400" },
  GUILD_INVITE:  { icon: Shield,       color: "text-blue-400" },
  FEED_LIKE:     { icon: Heart,        color: "text-red-400" },
};
const DEFAULT_ICON: IconConfig = { icon: Bell, color: "text-muted-foreground" };

function getIconCfg(type: string): IconConfig {
  return TYPE_ICON[type] ?? DEFAULT_ICON;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return secs <= 5 ? "just now" : `${secs} seconds ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg border border-border bg-card animate-pulse flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="w-40 h-3 bg-muted rounded" />
            <div className="w-56 h-2.5 bg-muted rounded" />
            <div className="w-16 h-2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const cfg = getIconCfg(notif.type);
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
      onClick={() => !notif.read && onRead(notif.id)}
      className={`relative p-4 rounded-lg border bg-card flex items-start gap-3 transition-colors ${
        notif.read
          ? "border-border cursor-default"
          : "border-border border-l-primary cursor-pointer hover:bg-muted/10"
      }`}
      style={
        !notif.read
          ? { borderLeftWidth: "3px", borderLeftColor: "hsl(var(--primary))" }
          : undefined
      }
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          notif.read ? "bg-muted/40" : "bg-card border border-border"
        }`}
      >
        <Icon size={15} className={notif.read ? "text-muted-foreground" : cfg.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-body font-bold leading-snug ${
            notif.read ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {notif.title}
        </p>
        {notif.body && (
          <p className="text-xs font-body text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
            {notif.body}
          </p>
        )}
        <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5">
          {relativeTime(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await (supabase as any)
      .from("notifications")
      .select("id, user_id, type, title, body, metadata, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (err) {
      setError("Failed to load notifications.");
    } else {
      setNotifications((data ?? []) as Notification[]);
    }
    setLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((prev) => {
            if (prev.find((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markRead = useCallback(
    async (id: string) => {
      if (!user) return;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      await (supabase as any)
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id);
    },
    [user]
  );

  const markAllRead = useCallback(async () => {
    if (!user || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("user_id", user.id);

    setMarkingAll(false);
  }, [user, unreadCount, markingAll, notifications]);

  return (
    <div>
      <PageHeader title="NOTIFICATIONS" subtitle="// SIGNAL INTERCEPTS">
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-3 py-2 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={12} />
            )}
            MARK ALL READ
          </button>
        )}
      </PageHeader>

      {/* Unread summary */}
      <AnimatePresence>
        {unreadCount > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="py-2 px-4 rounded border border-primary/20 bg-primary/5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-mono text-primary">
                {unreadCount} unread signal{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && <NotifSkeleton />}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16">
          <Bell
            size={36}
            className="mx-auto mb-3 opacity-20 text-muted-foreground"
          />
          <p className="font-mono text-muted-foreground text-sm mb-4">
            {error}
          </p>
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded border border-primary/30 bg-primary/10 text-primary text-xs font-mono hover:bg-primary/20 transition-colors"
          >
            <RefreshCw size={12} />
            RETRY
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell
            size={36}
            className="mx-auto mb-3 opacity-20 text-muted-foreground"
          />
          <p className="font-mono text-muted-foreground text-sm">
            No notifications yet.
          </p>
          <p className="font-mono text-muted-foreground/50 text-xs mt-1">
            Signals will appear here when received.
          </p>
        </div>
      )}

      {/* Notifications list */}
      {!loading && !error && notifications.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {notifications.map((notif) => (
              <NotifCard key={notif.id} notif={notif} onRead={markRead} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Exported Hook ────────────────────────────────────────────────────────────

export function useNotificationCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    // Initial count query
    (supabase as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count: c }: { count: number | null }) => {
        setCount(c ?? 0);
      });

    // Realtime: watch for inserts (new unread) and updates (read=true)
    const channel = supabase
      .channel(`notif-count-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const incoming = payload.new as { read: boolean };
          if (!incoming.read) {
            setCount((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch count on any update to stay in sync
          (supabase as any)
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false)
            .then(({ count: c }: { count: number | null }) => {
              setCount(c ?? 0);
            });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
