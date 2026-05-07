type ButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-amex-gold text-amex-black border border-amex-gold-hi hover:bg-amex-gold-hi active:bg-amex-gold",
  secondary:
    "bg-amex-card text-amex-text border border-amex-line-hi hover:border-amex-gold-lo hover:text-amex-gold-hi",
  ghost:
    "text-amex-text-dim hover:text-amex-gold-hi border border-transparent hover:border-amex-line-hi",
};

export function Button({
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5
        text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-150
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amex-gold focus-visible:ring-offset-2 focus-visible:ring-offset-amex-black
        disabled:pointer-events-none disabled:opacity-40
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
