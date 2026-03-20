"use client";

export function RadioGroup({
  value,
  onChange,
  options,
  size = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  size?: "default" | "sm";
}) {
  const padding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`
            flex cursor-pointer items-center gap-1.5 rounded-md ${padding} font-medium transition-all duration-150
            ${
              value === opt.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
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
