type BadgeVariant = "default" | "success" | "warning" | "info" | "zone";

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-amex-elev text-amex-text-dim border border-amex-line-hi",
  success: "bg-transparent text-amex-emerald border border-[color:var(--color-amex-emerald)]/40",
  warning: "bg-transparent text-amex-gold border border-amex-gold-deep",
  info: "bg-transparent text-amex-violet border border-[color:var(--color-amex-violet)]/40",
  zone: "text-[10px] tracking-[0.18em]",
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
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] ${variantStyles[variant]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
