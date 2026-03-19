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
    <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <span className="text-sm font-bold text-emerald-700">$</span>
      </div>
      <div>
        <p className="text-lg font-bold text-emerald-900">Save ${savings}</p>
        <p className="text-sm text-emerald-700">{description}</p>
        <p className="mt-0.5 text-xs text-emerald-600">{timeLabel}</p>
      </div>
    </div>
  );
}
