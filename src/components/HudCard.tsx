import { ReactNode } from "react";

interface HudCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export default function HudCard({ title, description, icon, children, className = "", glow = false }: HudCardProps) {
  return (
    <div className={`bg-card border border-border rounded p-4 ${glow ? "border-glow" : ""} ${className}`}>
      <div className="mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h3 className="font-display text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-[10px] font-mono text-muted-foreground/70 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
