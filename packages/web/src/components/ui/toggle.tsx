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
    <label className="group flex cursor-pointer items-center gap-3 py-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-7 w-12 shrink-0 items-center rounded-full
          transition-colors duration-200 ease-in-out
          active:scale-95 active:duration-75
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ab-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ab-black
          ${checked ? "bg-ab-gold" : "bg-ab-line-hi"}
        `}
      >
        <span
          className={`
            inline-block h-6 w-6 rounded-full bg-white shadow-sm
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-[22px]" : "translate-x-[2px]"}
          `}
        />
      </button>
      <div>
        <span className="text-sm text-ab-text">{label}</span>
        {detail && <span className="ml-1.5 text-xs text-ab-text-dim">{detail}</span>}
      </div>
    </label>
  );
}
