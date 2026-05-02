import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, MessageSquare, User, Swords, BookOpen,
  BarChart3, Settings, Compass, ChevronLeft, ChevronRight, LogOut, Users,
  Gamepad2, Shield, Radio, Inbox, Zap, Bot, Globe, Coins, Search, Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useNotificationCount } from "@/pages/NotificationsPage";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/navi", icon: Compass, label: "Navi / Skins" },
  { to: "/mavis", icon: MessageSquare, label: "Navi AI" },
  { to: "/character", icon: User, label: "Character" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/party", icon: Users, label: "Party" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/guild", icon: Shield, label: "Guild" },
  { to: "/social", icon: Radio, label: "Feed" },
  { to: "/inbox", icon: Inbox, label: "Inbox" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/agents", icon: Bot, label: "Agents" },
  { to: "/upgrade", icon: Zap, label: "Upgrade" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { totalUnread } = useUnreadMessages();
  const notifCount = useNotificationCount();
  const [forgeBalance, setForgeBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("forge_balances" as any)
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setForgeBalance(data ? Number((data as any).balance ?? 0) : 0));
  }, [user]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2 }}
      className="h-screen flex flex-col border-r border-border bg-sidebar sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-border min-h-[64px]">
        <div className="w-9 h-9 rounded bg-primary/20 border border-primary/30 flex items-center justify-center glow-subtle shrink-0">
          <span className="font-display text-primary text-sm font-bold">M</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <h1 className="font-display text-primary text-sm font-bold tracking-widest text-glow-cyan whitespace-nowrap">
                MAVIS-LITE
              </h1>
              <p className="text-muted-foreground text-[10px] font-mono whitespace-nowrap">v4.2 // NAVI.EXE</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          const isInbox = to === "/inbox";
          const isNotifications = to === "/notifications";
          const badge = isInbox && totalUnread > 0
            ? totalUnread
            : isNotifications && notifCount > 0
            ? notifCount
            : 0;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all group ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 glow-subtle"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border border-transparent"
              }`}
            >
              <div className="relative shrink-0">
                <Icon size={18} className={isActive ? "text-primary" : ""} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap font-body flex-1"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!collapsed && badge > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center px-1 leading-none shrink-0">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Forge Balance */}
      {forgeBalance !== null && (
        <div className={`mx-2 mb-1 px-3 py-2 rounded border border-amber-500/20 bg-amber-500/5 flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <Coins size={13} className="text-amber-400 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] font-mono text-amber-400 font-bold whitespace-nowrap">
                {forgeBalance} FORGE
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="mx-2 mb-1 px-3 py-2.5 rounded text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3 border border-transparent"
      >
        <LogOut size={18} className="shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap font-body">
              Sign Out
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </motion.aside>
  );
}
