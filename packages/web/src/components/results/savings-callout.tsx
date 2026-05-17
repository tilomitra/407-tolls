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
    <div className="flex items-start gap-3 rounded-2xl border border-ab-gold-deep/20 bg-ab-gold-mist px-4 py-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ab-gold text-white shadow-sm">
        <span className="text-lg font-bold">$</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-ab-gold">Savings</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-ab-gold-hi">${savings}</p>
        <p className="mt-1 text-sm text-ab-text">{description}</p>
        <p className="mt-0.5 text-xs text-ab-text-dim">{timeLabel}</p>
      </div>
    </div>
  );
}
