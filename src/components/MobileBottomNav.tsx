import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Swords, MessageSquare, Radio, User } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const MOBILE_NAV = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/quests", icon: Swords, label: "Quests" },
  { to: "/mavis", icon: MessageSquare, label: "Navi" },
  { to: "/social", icon: Radio, label: "Feed" },
  { to: "/character", icon: User, label: "You" },
];

export default function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-sidebar border-t border-border">
      <div className="flex items-stretch h-14">
        {MOBILE_NAV.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} className={isActive ? "text-primary" : ""} />
              <span className="text-[9px] font-mono">{label.toUpperCase()}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
