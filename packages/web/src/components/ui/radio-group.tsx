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
    <div className="inline-flex rounded-full bg-ab-ink p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-150
            ${
              value === opt.value
                ? "bg-ab-card text-ab-text shadow-sm"
                : "text-ab-text-dim hover:text-ab-text"
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
