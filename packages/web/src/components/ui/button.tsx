type ButtonVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-sm",
  ghost:
    "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
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
        inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5
        text-sm font-medium transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
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
