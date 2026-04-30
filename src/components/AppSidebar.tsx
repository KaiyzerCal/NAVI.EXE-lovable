import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, MessageSquare, User, Swords, BookOpen, 
  BarChart3, Settings, Compass, ChevronLeft, ChevronRight, LogOut, Users, Zap
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/navi", icon: Compass, label: "Navi" },
  { to: "/mavis", icon: MessageSquare, label: "Navi.EXE" },
  { to: "/character", icon: User, label: "Character" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/party", icon: Users, label: "Party" },
  { to: "/journal", icon: BookOpen, label: "Journal" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
  { to: "/operators", icon: Users, label: "Operators" },
  { to: "/notifications", icon: MessageSquare, label: "Notifications" },
  { to: "/upgrade", icon: Zap, label: "Upgrade" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count } = await supabase.from("operator_notifications").select("*", { count: "exact", head: true }).eq("operator_id", user.id).is("read_at", null);
      setUnreadCount(count ?? 0);
    };
    void loadUnread();
    const channel = supabase
      .channel(`operator-notifications-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "operator_notifications", filter: `operator_id=eq.${user.id}` }, () => {
        setUnreadCount((c) => c + 1);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
              <Icon size={18} className={`shrink-0 ${isActive ? "text-primary" : ""}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap font-body"
                  >
                    {label}
                    {to === "/notifications" && unreadCount > 0 && (
                      <span className="ml-2 text-[10px] font-mono bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-0.5">{unreadCount}</span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

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
