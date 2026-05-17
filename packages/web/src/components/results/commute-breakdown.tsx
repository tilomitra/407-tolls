"use client";

import type { CommuteEstimate, DayOfWeek, TripType, VehicleClassId } from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
import { Card, CardBody } from "../ui/card";
import { Badge } from "../ui/badge";
import { ShareButton } from "../ui/share-button";
import {
  formatDollars as fmt,
  formatCommuteDays,
} from "@/lib/format";
import { buildCommuteShareUrl } from "@/lib/params";
import { TransponderCallout } from "../ui/transponder-callout";

function CostRow({
  label,
  value,
  bold,
  sub,
}: {
  label: string;
  value: string;
  bold?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`flex items-baseline justify-between py-2 ${
        bold ? "font-semibold text-ab-text" : "text-ab-text-dim"
      }`}
    >
      <div>
        <span className="text-sm">{label}</span>
        {sub && <span className="ml-1.5 text-xs text-ab-text-dim">{sub}</span>}
      </div>
      <span className={`tabular-nums ${bold ? "text-lg" : "text-sm"}`}>{value}</span>
    </div>
  );
}

function DayCostSection({
  label,
  goCostCents,
  returnCostCents,
  isRoundTrip,
}: {
  label: string;
  goCostCents: number;
  returnCostCents: number;
  isRoundTrip: boolean;
}) {
  return (
    <div className="rounded-2xl border border-ab-line bg-ab-ink px-4 py-1">
      <CostRow label="Departure" value={fmt(goCostCents)} sub={label} />
      {isRoundTrip && <CostRow label="Return" value={fmt(returnCostCents)} sub={label} />}
      <div className="border-t border-ab-line" />
      <CostRow
        label={isRoundTrip ? "Per day (round trip)" : "Per day (one way)"}
        value={fmt(goCostCents + returnCostCents)}
        bold
      />
    </div>
  );
}

export function CommuteBreakdown({
  estimate,
  entryName,
  exitName,
  vehicleClassId,
  tripType,
  commuteDays,
  hasTransponder,
  entryId,
  exitId,
  shareParams,
  children,
}: {
  estimate: CommuteEstimate;
  entryName: string;
  exitName: string;
  vehicleClassId: VehicleClassId;
  tripType: TripType;
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
  entryId: string;
  exitId: string;
  shareParams: {
    goSlot: string;
    returnSlot?: string;
    weekendGoSlot: string;
    weekendReturnSlot?: string;
  };
  children?: React.ReactNode;
}) {
  const {
    weekdayGoCostCents,
    weekdayReturnCostCents,
    weekendGoCostCents,
    weekendReturnCostCents,
    perMonthCents,
    perYearCents,
    weekdayDaysPerYear,
    weekendDaysPerYear,
    holidayDaysPerYear,
    transponderSavingsMonthCents,
  } = estimate;

  const dayLabels = formatCommuteDays(commuteDays);

  const isRoundTrip = tripType === "round_trip";
  const hasWeekdayDays = commuteDays.some((d) => d >= 1 && d <= 5);
  const hasWeekendDays = commuteDays.includes(0) || commuteDays.includes(6);
  const perWeekCents = Math.round(perYearCents / 52);
  const totalDaysPerYear = weekdayDaysPerYear + weekendDaysPerYear;
  const totalTripsPerYear = isRoundTrip ? totalDaysPerYear * 2 : totalDaysPerYear;

  const shareUrl = buildCommuteShareUrl({
    entryId,
    exitId,
    vehicleClassId,
    tripType,
    commuteDays,
    hasTransponder,
    ...shareParams,
  });

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-ab-text">Commute estimate</h3>
              <Badge variant="info">{isRoundTrip ? "Round trip" : "One way"}</Badge>
            </div>
            <p className="mt-1 text-sm text-ab-text-dim">
              {entryName} <span className="text-ab-text-mute">→</span> {exitName}
            </p>
            <p className="text-xs text-ab-text-dim">
              {getVehicleClass({ id: vehicleClassId }).name} · {dayLabels}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums text-ab-gold">{fmt(perMonthCents)}</p>
              <p className="text-xs text-ab-text-dim">Per month</p>
            </div>
            <ShareButton url={shareUrl} />
          </div>
        </div>

        {children && <div>{children}</div>}

        {hasWeekdayDays && (
          <DayCostSection
            label="weekday"
            goCostCents={weekdayGoCostCents}
            returnCostCents={weekdayReturnCostCents}
            isRoundTrip={isRoundTrip}
          />
        )}

        {hasWeekendDays && (
          <DayCostSection
            label="weekend"
            goCostCents={weekendGoCostCents}
            returnCostCents={weekendReturnCostCents}
            isRoundTrip={isRoundTrip}
          />
        )}

        <div className="space-y-0.5">
          <CostRow label="Per week" value={fmt(perWeekCents)} />
          <CostRow label="Per month" value={fmt(perMonthCents)} bold />
          <CostRow label="Per year" value={fmt(perYearCents)} />
        </div>

        {transponderSavingsMonthCents > 0 && (
          <TransponderCallout
            hasTransponder={hasTransponder}
            summary={`${fmt(transponderSavingsMonthCents)}/mo (${fmt(
              transponderSavingsMonthCents * 12,
            )}/yr)`}
          />
        )}

        <div className="rounded-xl border border-ab-line bg-ab-ink px-4 py-3 text-xs text-ab-text-dim space-y-1">
          <p>
            {hasWeekdayDays && `${weekdayDaysPerYear} weekday`}
            {hasWeekdayDays && hasWeekendDays && " + "}
            {hasWeekendDays && `${weekendDaysPerYear} weekend/holiday`} days per year (
            {totalTripsPerYear} {isRoundTrip ? "round trips" : "one-way trips"})
          </p>
          {holidayDaysPerYear > 0 && (
            <p>{holidayDaysPerYear} Ontario statutory holidays use lower weekend rates</p>
          )}
        </div>

        <p className="text-xs text-ab-text-mute">
          Estimate · 2026 rates · Actual charges may vary
        </p>
      </CardBody>
    </Card>
  );
}
