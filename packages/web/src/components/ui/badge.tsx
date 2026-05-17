type BadgeVariant = "default" | "success" | "warning" | "info" | "zone";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-ab-ink text-ab-text-dim border border-ab-line",
  success: "bg-ab-emerald-deep text-ab-emerald border border-transparent",
  warning: "bg-ab-amber-deep text-ab-amber border border-transparent",
  info: "bg-ab-violet-deep text-ab-violet border border-transparent",
  zone: "text-[10px] tracking-[0.04em]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
  style,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight ${variantStyles[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
