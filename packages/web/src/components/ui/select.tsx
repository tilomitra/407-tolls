"use client";

export function Select({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; detail?: string }>;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            block w-full appearance-none rounded-lg border border-slate-200 bg-white
            py-2.5 pl-3 pr-10 text-sm text-slate-900 shadow-sm
            transition-colors duration-150
            hover:border-slate-300
            focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
          "
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}{opt.detail ? ` — ${opt.detail}` : ""}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </label>
  );
}
