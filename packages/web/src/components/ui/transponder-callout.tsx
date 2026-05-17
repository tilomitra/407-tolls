export function TransponderCallout({
  hasTransponder,
  summary,
}: {
  hasTransponder: boolean;
  summary?: string;
}) {
  const isPositive = hasTransponder;

  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${
      isPositive
        ? "border-[color:var(--color-ab-emerald)]/20 bg-ab-emerald-deep text-ab-emerald"
        : "border-ab-gold-deep/20 bg-ab-gold-mist text-ab-gold-hi"
    }`}>
      <p>
        {isPositive ? "Your transponder saves you" : "Get a transponder and save"}{" "}
        <span className="font-semibold">{summary ?? "$5.30/trip + $5/month account fee"}</span>
      </p>
      {summary && (
        <p className="mt-0.5 opacity-75">
          {isPositive
            ? "$5.30/trip camera charge + $5/month account fee waived"
            : "Includes $5.30/trip camera charge + $5/month account fee"}
        </p>
      )}
    </div>
  );
}
