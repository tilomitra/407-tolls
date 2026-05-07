"use client";

export function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="inline-flex border border-amex-line-hi bg-amex-ink p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-150
            ${
              value === opt.value
                ? "bg-amex-gold text-amex-black"
                : "text-amex-text-dim hover:text-amex-gold-hi"
            }
          `}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
