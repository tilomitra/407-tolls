export function TransponderCallout({
  hasTransponder,
  summary,
}: {
  hasTransponder: boolean;
  summary?: string;
}) {
  const isGreen = hasTransponder;

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${
      isGreen
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700"
    }`}>
      <p>
        {isGreen ? "Your transponder saves you" : "Get a transponder and save"}{" "}
        {summary ?? "$5.30/trip + $5/month account fee"}
      </p>
      {summary && (
        <p className="mt-0.5 opacity-75">
          {isGreen
            ? "$5.30/trip camera charge + $5/month account fee waived"
            : "Includes $5.30/trip camera charge + $5/month account fee"
          }
        </p>
      )}
    </div>
  );
}
