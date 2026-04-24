import { Lock, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Props {
  title?: string;
  description: string;
  className?: string;
}

export function UnlockWithCoreCard({ title = "UNLOCK WITH CORE", description, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 flex items-center gap-3 ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
        <Lock className="text-primary" size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs font-bold text-primary tracking-wider">{title}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Button asChild size="sm" className="font-mono shrink-0">
        <Link to="/upgrade">
          <Zap size={12} className="mr-1" />
          UPGRADE
        </Link>
      </Button>
    </div>
  );
}