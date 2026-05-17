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
    <Badge variant="info">
      {isEast ? "Eastbound →" : "← Westbound"}
    </Badge>
  );
}

function ZoneBadge({ zone }: { zone: Zone }) {
  const c = zoneColors[zone] ?? { bg: "#1c1c1c", text: "#a3a09a" };
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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-ab-text">Toll estimate</h2>
              <DirectionBadge direction={breakdown.direction} />
              {isPeak && <Badge variant="warning">Peak</Badge>}
            </div>
            <p className="mt-1 text-sm text-ab-text-dim">
              {vehicleClass.name} · {totalDistanceKm.toFixed(1)} km · {breakdown.perZone.length}{" "}
              {breakdown.perZone.length === 1 ? "zone" : "zones"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-ab-gold">
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

      {children && <div className="border-b border-ab-line px-6 py-3">{children}</div>}

      <CardBody className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ab-line bg-ab-ink text-left text-xs font-semibold text-ab-text-dim">
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
                className={i < breakdown.perZone.length - 1 ? "border-b border-ab-line-mute" : ""}
              >
                <td className="px-6 py-3">
                  <ZoneBadge zone={z.zone} />
                </td>
                <td className="px-6 py-3 text-right tabular-nums text-ab-text-dim">
                  {z.distanceKm.toFixed(1)} km
                </td>
                <td className="hidden px-6 py-3 text-right tabular-nums text-ab-text-dim sm:table-cell">
                  {z.rateCentsPerKm.toFixed(1)}&cent;/km
                </td>
                <td className="px-6 py-3 text-right tabular-nums font-medium text-ab-text">
                  {formatDollars(z.costCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-ab-line px-6 py-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm text-ab-text-dim">
              <span>Toll (distance-based)</span>
              <span className="tabular-nums">{formatDollars(breakdown.tollCents)}</span>
            </div>
            <div className="flex justify-between text-sm text-ab-text-dim">
              <span>Trip charge</span>
              <span className="tabular-nums">{formatDollars(breakdown.tripChargeCents)}</span>
            </div>
            {breakdown.cameraChargeCents > 0 && (
              <div className="flex justify-between text-sm text-ab-amber">
                <span>Camera charge (no transponder)</span>
                <span className="tabular-nums">{formatDollars(breakdown.cameraChargeCents)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ab-line pt-2 text-base font-semibold text-ab-text">
              <span>Estimated total</span>
              <span className="tabular-nums text-ab-gold">{formatDollars(breakdown.totalCents)}</span>
            </div>
          </div>

          {vehicleClass.hasTransponderOption && (
            <div className="mt-3">
              <TransponderCallout hasTransponder={hasTransponder} />
            </div>
          )}

          <p className="mt-3 text-xs text-ab-text-mute">
            Estimate · 2026 rates · Trip charge {formatDollars(breakdown.tripChargeCents)} included
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
