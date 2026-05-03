interface Props { tier: string }

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  free:  { label: "FREE",           className: "text-muted-foreground bg-muted/60 border-border" },
  core:  { label: "CORE OPERATOR",  className: "text-primary bg-primary/10 border-primary/40" },
  power: { label: "POWER OPERATOR", className: "text-secondary bg-secondary/10 border-secondary/40" },
};

export default function SubscriptionBadge({ tier }: Props) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${config.className}`}>
      {config.label}
    </span>
  );
}
