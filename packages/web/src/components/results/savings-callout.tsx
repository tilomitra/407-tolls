export function SavingsCallout({
  savingsCents,
  extraMinutes,
  description,
}: {
  savingsCents: number;
  extraMinutes: number;
  description: string;
}) {
  const savings = (savingsCents / 100).toFixed(2);
  const timeLabel = extraMinutes <= 0 ? "no extra time" : `${extraMinutes} extra min`;

  return (
    <div className="flex items-start gap-3 border border-amex-gold-deep bg-amex-gold-mist px-4 py-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-amex-gold bg-amex-black">
        <span className="text-base font-bold text-amex-gold">$</span>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-amex-gold">Member Savings</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-amex-gold-hi">${savings}</p>
        <p className="mt-1 text-sm text-amex-text-dim">{description}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-amex-text-mute">{timeLabel}</p>
      </div>
    </div>
  );
}
