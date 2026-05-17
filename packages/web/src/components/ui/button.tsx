type ButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-ab-gold text-white border border-transparent hover:bg-ab-gold-hi active:bg-ab-gold-hi shadow-sm",
  secondary:
    "bg-ab-card text-ab-text border border-ab-line-hi hover:border-ab-text hover:bg-ab-ink",
  ghost:
    "text-ab-text-dim hover:text-ab-text bg-transparent border border-transparent hover:bg-ab-ink",
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
        inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full
        text-sm font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ab-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ab-black
        disabled:pointer-events-none disabled:opacity-40
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
