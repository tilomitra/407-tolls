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
          relative inline-flex h-5 w-9 shrink-0 items-center
          border transition-colors duration-200 ease-in-out
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amex-gold focus-visible:ring-offset-2 focus-visible:ring-offset-amex-black
          ${checked ? "border-amex-gold bg-amex-gold-deep" : "border-amex-line-hi bg-amex-elev"}
        `}
      >
        <span
          className={`
            inline-block h-3 w-3
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-[20px] bg-amex-gold" : "translate-x-[3px] bg-amex-text-mute"}
          `}
        />
      </button>
      <div>
        <span className="text-sm text-amex-text">{label}</span>
        {detail && <span className="ml-1.5 text-xs text-amex-text-mute">{detail}</span>}
      </div>
    </label>
  );
}
