import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, X, Check, CheckCheck, Heart, MessageSquare, Users, Swords, TrendingUp, Zap, UserPlus, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppNotification } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/feedHelpers";

const TYPE_META: Record<string, { icon: typeof Bell; color: string; label: string }> = {
  feed_like:    { icon: Heart,        color: "text-red-400",    label: "Like" },
  feed_reply:   { icon: MessageSquare,color: "text-cyan-400",   label: "Reply" },
  dm:           { icon: MessageSquare,color: "text-primary",    label: "DM" },
  party_invite: { icon: Users,        color: "text-purple-400", label: "Party" },
  guild_invite: { icon: Swords,       color: "text-amber-400",  label: "Guild" },
  level_up:     { icon: TrendingUp,   color: "text-green-400",  label: "Level" },
  evolution:    { icon: Zap,          color: "text-pink-400",   label: "Evolution" },
  achievement:  { icon: Star,         color: "text-yellow-400", label: "Achievement" },
  follow:       { icon: UserPlus,     color: "text-cyan-400",   label: "Follow" },
  quest_due:    { icon: Swords,       color: "text-orange-400", label: "Quest" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: Bell, color: "text-muted-foreground", label: type };
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  collapsed: boolean;
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  collapsed,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPanelStyle({
        position: "fixed",
        top: rect.top,
        left: rect.right + 8,
        zIndex: 9999,
      });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          style={panelStyle}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.15 }}
          className="w-80 max-h-[480px] flex flex-col bg-card border border-border rounded shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
            <span className="text-xs font-mono text-primary">NOTIFICATIONS</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                  title="Mark all read"
                >
                  <CheckCheck size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell size={20} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-[10px] font-mono text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getTypeMeta(n.type);
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-2.5 px-3 py-2.5 border-b border-border/50 last:border-0 group cursor-default transition-colors hover:bg-muted/30 ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className={`mt-0.5 shrink-0 ${meta.color}`}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body text-foreground leading-tight">{n.title}</p>
                      {n.body && (
                        <p className="text-[10px] font-body text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        title="Dismiss"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm font-medium transition-all border border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${open ? "bg-primary/10 text-primary border-primary/20" : ""}`}
      >
        <div className="relative shrink-0">
          <Bell size={18} className={open ? "text-primary" : ""} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-primary text-background text-[8px] font-bold font-display flex items-center justify-center px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="whitespace-nowrap font-body flex-1 text-left"
            >
              Notifications
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && unreadCount > 0 && (
          <AnimatePresence>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-auto min-w-[18px] h-[18px] rounded-full bg-primary text-background text-[9px] font-bold font-display flex items-center justify-center px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          </AnimatePresence>
        )}
      </button>

      {createPortal(panel, document.body)}
    </>
  );
}
