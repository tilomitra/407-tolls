import type { TollBreakdown, Zone } from "@407-etr/core";
import { Card, CardHeader, CardBody } from "../ui/card";
import { Badge } from "../ui/badge";
import { ShareButton } from "../ui/share-button";
import { zoneColors } from "@/lib/design/tokens";
import { formatDollars } from "@/lib/format";

function DirectionBadge({ direction }: { direction: string }) {
  const isEast = direction === "eastbound";
  return (
    <Badge variant="info" className={isEast ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}>
      {isEast ? "Eastbound →" : "← Westbound"}
    </Badge>
  );
}

function ZoneBadge({ zone }: { zone: Zone }) {
  const c = zoneColors[zone] ?? { bg: "#f1f5f9", text: "#475569" };
  return (
    <Badge variant="zone" style={{ backgroundColor: c.bg, color: c.text }}>
      Z{zone}
    </Badge>
  );
}

function buildShareUrl(entryId: string, exitId: string, breakdown: TollBreakdown): string {
  const { dayType, slot } = breakdown.timeSlot;
  const day = dayType === "weekday" ? "weekday" : "weekend";
  const transponder = breakdown.cameraChargeCents === null;
  return `/trip/${entryId}-to-${exitId}?day=${day}&time=${slot}&transponder=${transponder}`;
}

export function TollBreakdownView({
  breakdown,
  entryId,
  exitId,
}: {
  breakdown: TollBreakdown;
  entryId?: string;
  exitId?: string;
}) {
  const isPeak =
    breakdown.timeSlot.slot === "7am" ||
    breakdown.timeSlot.slot === "330pm";

  const totalDistanceKm = breakdown.perZone.reduce((sum, z) => sum + z.distanceKm, 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-900">Estimated Toll</h2>
            <DirectionBadge direction={breakdown.direction} />
            {isPeak && <Badge variant="warning">Peak</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {totalDistanceKm.toFixed(1)} km across {breakdown.perZone.length} {breakdown.perZone.length === 1 ? "zone" : "zones"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {formatDollars(breakdown.totalCents)}
          </span>
          {entryId && exitId && (
            <ShareButton url={buildShareUrl(entryId, exitId, breakdown)} />
          )}
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
              <th className="px-6 py-3">Zone</th>
              <th className="px-6 py-3 text-right">Distance</th>
              <th className="hidden px-6 py-3 text-right sm:table-cell">Rate</th>
              <th className="px-6 py-3 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.perZone.map((z, i) => (
              <tr
                key={z.zone}
                className={i < breakdown.perZone.length - 1 ? "border-b border-slate-50" : ""}
              >
                <td className="px-6 py-3">
                  <ZoneBadge zone={z.zone} />
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-slate-600">
                  {z.distanceKm.toFixed(1)} km
                </td>
                <td className="hidden px-6 py-3 text-right tabular-nums text-slate-500 sm:table-cell">
                  {z.rateCentsPerKm.toFixed(1)}&cent;/km
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium text-slate-900">
                  {formatDollars(z.costCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-slate-100 px-6 py-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Toll (distance-based)</span>
              <span className="tabular-nums">{formatDollars(breakdown.tollCents)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Trip charge</span>
              <span className="tabular-nums">{formatDollars(breakdown.tripChargeCents)}</span>
            </div>
            {breakdown.cameraChargeCents !== null && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Camera charge (no transponder)</span>
                <span className="tabular-nums">{formatDollars(breakdown.cameraChargeCents)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-slate-900">
              <span>Estimated total</span>
              <span className="tabular-nums">{formatDollars(breakdown.totalCents)}</span>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            <p className="font-medium text-slate-600 mb-1">Fee breakdown</p>
            <p>Trip charge ({formatDollars(breakdown.tripChargeCents)}) applies to every trip regardless of transponder.</p>
            {breakdown.cameraChargeCents !== null && (
              <>
                <p className="text-amber-600 mt-0.5">
                  Camera charge ({formatDollars(breakdown.cameraChargeCents)}) applies because you don't have a transponder. With a transponder, this trip would be {formatDollars(breakdown.totalCents - breakdown.cameraChargeCents)}.
                </p>
                <p className="text-amber-600 mt-0.5">
                  Without a transponder, 407 ETR also charges a $5.00/month account fee on your bill.
                </p>
              </>
            )}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Estimate based on 2026 published rates. Actual charges may vary.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
