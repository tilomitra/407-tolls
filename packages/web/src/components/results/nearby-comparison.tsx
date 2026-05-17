import type { NearbyComparison, NearbyAlternative } from "@407-tolls/core";
import { Card, CardBody } from "../ui/card";
import { formatDollars } from "@/lib/format";

function AlternativeRow({
  alternative,
  currentName,
  onClick,
}: {
  alternative: NearbyAlternative;
  currentName: string;
  onClick?: () => void;
}) {
  const savingsPerMonth = Math.abs(alternative.deltaMonthCents);
  const extraKm = alternative.deltaDistanceKm;
  const label = alternative.role === "entry" ? "Enter at" : "Exit at";
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 py-3 text-left ${
        onClick ? "-mx-2 px-2 transition-colors hover:bg-ab-gold-mist active:bg-ab-gold-mist cursor-pointer" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ab-text">
          <span className="text-xs font-semibold text-ab-text-dim">{label}</span>{" "}
          <span className="text-ab-gold-hi">{alternative.interchange.name}</span>
        </p>
        <p className="text-xs text-ab-text-dim">
          instead of {currentName}
          {extraKm !== 0 && (
            <span className="ml-1 text-ab-text-mute">
              ({extraKm > 0 ? "+" : ""}{extraKm.toFixed(1)} km on 407)
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-ab-emerald">
          -{formatDollars(savingsPerMonth)}/mo
        </p>
        <p className="text-xs text-ab-text-dim tabular-nums">
          -{formatDollars(savingsPerMonth * 12)}/yr
        </p>
      </div>
    </Tag>
  );
}

export function NearbyComparisonView({
  comparison,
  entryName,
  exitName,
  onAlternativeClick,
}: {
  comparison: NearbyComparison;
  entryName: string;
  exitName: string;
  onAlternativeClick?: (role: "entry" | "exit", interchangeId: string) => void;
}) {
  if (comparison.alternatives.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ab-emerald-deep">
              <svg className="h-4 w-4 text-ab-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ab-text">Best route already</p>
              <p className="text-xs text-ab-text-dim">No nearby interchange is cheaper for this commute.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-0">
        <div className="mb-2">
          <h3 className="text-lg font-semibold tracking-tight text-ab-text">Could you save more?</h3>
          <p className="text-sm text-ab-text-dim">Nearby interchanges with lower monthly costs</p>
        </div>

        <div className="divide-y divide-[color:var(--color-ab-line-mute)]">
          {comparison.alternatives.map((alt) => (
            <AlternativeRow
              key={`${alt.role}-${alt.interchange.id}`}
              alternative={alt}
              currentName={alt.role === "entry" ? entryName : exitName}
              onClick={onAlternativeClick ? () => onAlternativeClick(alt.role, alt.interchange.id) : undefined}
            />
          ))}
        </div>

        <p className="mt-3 text-xs text-ab-text-mute">
          Savings based on schedule. Excludes extra driving time to alternate interchange.
        </p>
      </CardBody>
    </Card>
  );
}
