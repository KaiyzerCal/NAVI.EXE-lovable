import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary tracking-wider text-glow-cyan">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground text-sm font-mono mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
