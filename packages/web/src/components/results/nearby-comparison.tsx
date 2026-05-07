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
        onClick ? "-mx-2 px-2 transition-colors hover:bg-amex-gold-mist active:bg-amex-gold-mist cursor-pointer" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-amex-text">
          <span className="text-[10px] uppercase tracking-[0.18em] text-amex-text-mute">{label}</span>{" "}
          <span className="text-amex-gold-hi">{alternative.interchange.name}</span>
        </p>
        <p className="text-xs text-amex-text-mute">
          instead of {currentName}
          {extraKm !== 0 && (
            <span className="ml-1 text-amex-text-faint">
              ({extraKm > 0 ? "+" : ""}{extraKm.toFixed(1)} km on 407)
            </span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-amex-emerald">
          -{formatDollars(savingsPerMonth)}/mo
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-amex-text-mute tabular-nums">
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-amex-emerald)]/40 bg-amex-emerald-deep/30">
              <svg className="h-4 w-4 text-amex-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-amex-text">Best route already</p>
              <p className="text-xs text-amex-text-mute">No nearby interchange is cheaper for this commute.</p>
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
          <p className="text-amex-eyebrow">Optimization</p>
          <h3 className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-amex-text">Could you save more?</h3>
          <p className="text-[11px] uppercase tracking-[0.14em] text-amex-text-mute">Nearby interchanges with lower monthly costs</p>
        </div>

        <div className="divide-y divide-[color:var(--color-amex-line-mute)]">
          {comparison.alternatives.map((alt) => (
            <AlternativeRow
              key={`${alt.role}-${alt.interchange.id}`}
              alternative={alt}
              currentName={alt.role === "entry" ? entryName : exitName}
              onClick={onAlternativeClick ? () => onAlternativeClick(alt.role, alt.interchange.id) : undefined}
            />
          ))}
        </div>

        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-amex-text-faint">
          Savings based on schedule. Excludes extra driving time to alternate interchange.
        </p>
      </CardBody>
    </Card>
  );
}
