import type { NearbyComparison, NearbyAlternative } from "@407-etr/core";
import { Card, CardBody } from "../ui/card";
import { formatDollars } from "@/lib/format";

function AlternativeRow({
  alternative,
  currentName,
}: {
  alternative: NearbyAlternative;
  currentName: string;
}) {
  const savingsPerMonth = Math.abs(alternative.deltaMonthCents);
  const extraKm = alternative.deltaDistanceKm;
  const label = alternative.role === "entry" ? "Enter at" : "Exit at";

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {label} <span className="text-blue-600">{alternative.interchange.name}</span>
        </p>
        <p className="text-xs text-slate-500">
          instead of {currentName}
          {extraKm !== 0 && (
            <span className="ml-1 text-slate-400">
              ({extraKm > 0 ? "+" : ""}{extraKm.toFixed(1)} km on 407)
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-emerald-600">
          -{formatDollars(savingsPerMonth)}/mo
        </p>
        <p className="text-xs text-slate-400">
          -{formatDollars(savingsPerMonth * 12)}/yr
        </p>
      </div>
    </div>
  );
}

export function NearbyComparisonView({
  comparison,
  entryName,
  exitName,
}: {
  comparison: NearbyComparison;
  entryName: string;
  exitName: string;
}) {
  if (comparison.alternatives.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Best route already</p>
              <p className="text-xs text-slate-500">No nearby interchange is cheaper for this commute.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-0">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-slate-900">Could you save more?</h3>
          <p className="text-xs text-slate-400">Nearby interchanges with lower monthly costs</p>
        </div>

        <div className="divide-y divide-slate-100">
          {comparison.alternatives.map((alt) => (
            <AlternativeRow
              key={`${alt.role}-${alt.interchange.id}`}
              alternative={alt}
              currentName={alt.role === "entry" ? entryName : exitName}
            />
          ))}
        </div>

        <p className="mt-2 text-[11px] text-slate-400">
          Savings based on your commute schedule. Does not include extra driving time to the alternate interchange.
        </p>
      </CardBody>
    </Card>
  );
}
