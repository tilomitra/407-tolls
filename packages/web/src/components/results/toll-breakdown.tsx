import type { TollBreakdown, Zone, VehicleClassId } from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
import { Card, CardHeader, CardBody } from "../ui/card";
import { Badge } from "../ui/badge";
import { ShareButton } from "../ui/share-button";
import { zoneColors } from "@/lib/design/tokens";
import { formatDollars } from "@/lib/format";
import { buildTripShareUrl } from "@/lib/params";
import { TransponderCallout } from "../ui/transponder-callout";

function DirectionBadge({ direction }: { direction: string }) {
  const isEast = direction === "eastbound";
  return (
    <Badge
      variant="info"
      className={isEast ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}
    >
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

export function TollBreakdownView({
  breakdown,
  entryId,
  exitId,
  vehicleClassId,
  hasTransponder,
  children,
}: {
  breakdown: TollBreakdown;
  entryId: string;
  exitId: string;
  vehicleClassId: VehicleClassId;
  hasTransponder: boolean;
  children?: React.ReactNode;
}) {
  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const isPeak = breakdown.timeSlot.slot === "7am" || breakdown.timeSlot.slot === "330pm";

  const totalDistanceKm = breakdown.perZone.reduce((sum, z) => sum + z.distanceKm, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-sm font-semibold text-slate-900">Toll Estimate</h2>
              <DirectionBadge direction={breakdown.direction} />
              {isPeak && <Badge variant="warning">Peak</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {vehicleClass.name} · {totalDistanceKm.toFixed(1)} km across {breakdown.perZone.length}{" "}
              {breakdown.perZone.length === 1 ? "zone" : "zones"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {formatDollars(breakdown.totalCents)}
            </span>
            <ShareButton
              url={buildTripShareUrl({
                entryId,
                exitId,
                vehicleClassId,
                hasTransponder,
                dayType: breakdown.timeSlot.dayType,
                slot: breakdown.timeSlot.slot,
              })}
            />
          </div>
        </div>
      </CardHeader>

      {children && <div className="border-b border-slate-100 px-6 py-3">{children}</div>}

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
            {breakdown.cameraChargeCents > 0 && (
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

          {vehicleClass.hasTransponderOption && (
            <div className="mt-2">
              <TransponderCallout hasTransponder={hasTransponder} />
            </div>
          )}

          <p className="mt-2 text-[11px] text-slate-400">
            Estimate based on 2026 rates. Trip charge ({formatDollars(breakdown.tripChargeCents)})
            included in every trip.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
