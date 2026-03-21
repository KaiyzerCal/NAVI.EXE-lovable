interface ProgressBarProps {
  value: number;
  max: number;
  variant?: "cyan" | "green" | "amber" | "purple";
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
}

const variantColors = {
  cyan: "bg-neon-cyan",
  green: "bg-neon-green",
  amber: "bg-neon-amber",
  purple: "bg-neon-purple",
};

const variantGlow = {
  cyan: "shadow-[0_0_8px_hsl(185_100%_50%/0.5)]",
  green: "shadow-[0_0_8px_hsl(150_100%_45%/0.5)]",
  amber: "shadow-[0_0_8px_hsl(40_100%_55%/0.5)]",
  purple: "shadow-[0_0_8px_hsl(270_80%_60%/0.5)]",
};

export default function ProgressBar({ value, max, variant = "cyan", label, showValue = true, size = "sm" }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  
  return (
    <div>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs font-mono text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-mono text-foreground">{value}/{max}</span>}
        </div>
      )}
      <div className={`w-full bg-muted rounded-sm overflow-hidden ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div
          className={`h-full rounded-sm transition-all duration-500 ${variantColors[variant]} ${variantGlow[variant]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
