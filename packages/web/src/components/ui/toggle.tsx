"use client";

export function Toggle({
  checked,
  onChange,
  label,
  detail,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  detail?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 items-center rounded-full
          transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
          ${checked ? "bg-blue-600" : "bg-slate-200"}
        `}
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}
          `}
        />
      </button>
      <div>
        <span className="text-sm text-slate-700">{label}</span>
        {detail && <span className="ml-1.5 text-xs text-slate-400">{detail}</span>}
      </div>
    </label>
  );
}
