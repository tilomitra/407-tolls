"use client";

import type { CommuteEstimate, DayOfWeek, TripType } from "@407-etr/core";
import { DAY_NAMES } from "@407-etr/core";
import { Card, CardBody } from "../ui/card";
import { ShareButton } from "../ui/share-button";
import { formatDollars as fmt, formatLargeDollars as fmtLarge } from "@/lib/format";
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
        bold ? "font-semibold text-slate-900" : "text-slate-600"
      }`}
    >
      <div>
        <span className="text-sm">{label}</span>
        {sub && <span className="ml-1.5 text-xs text-slate-400">{sub}</span>}
      </div>
      <span className={`text-sm tabular-nums ${bold ? "text-lg" : ""}`}>{value}</span>
    </div>
  );
}

export function CommuteBreakdown({
  estimate,
  entryName,
  exitName,
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

  const dayLabels = commuteDays
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => DAY_NAMES[d])
    .join(", ");

  const isRoundTrip = tripType === "round_trip";
  const hasWeekendDays = commuteDays.includes(0) || commuteDays.includes(6);
  const perWeekCents = Math.round(perYearCents / 52);
  const totalDaysPerYear = weekdayDaysPerYear + weekendDaysPerYear;
  const totalTripsPerYear = isRoundTrip ? totalDaysPerYear * 2 : totalDaysPerYear;

  const shareUrl = buildCommuteShareUrl({
    entryId,
    exitId,
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
            <h3 className="text-base font-semibold text-slate-900">Commute Estimate</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {entryName} to {exitName}
              {!isRoundTrip && " (one way)"}
            </p>
            <p className="text-xs text-slate-400">{dayLabels}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-slate-900">{fmt(perMonthCents)}</p>
              <p className="text-xs text-slate-400">per month</p>
            </div>
            <ShareButton url={shareUrl} />
          </div>
        </div>

        {children && <div>{children}</div>}

        <div className="rounded-lg bg-slate-50 px-4 py-1">
          <CostRow label="Departure" value={fmt(weekdayGoCostCents)} sub="weekday" />
          {isRoundTrip && (
            <CostRow label="Return" value={fmt(weekdayReturnCostCents)} sub="weekday" />
          )}
          <div className="border-t border-slate-200" />
          <CostRow
            label={isRoundTrip ? "Per day (round trip)" : "Per day (one way)"}
            value={fmt(weekdayGoCostCents + weekdayReturnCostCents)}
            bold
          />
        </div>

        {hasWeekendDays && (
          <div className="rounded-lg bg-slate-50 px-4 py-1">
            <CostRow label="Departure" value={fmt(weekendGoCostCents)} sub="weekend" />
            {isRoundTrip && (
              <CostRow label="Return" value={fmt(weekendReturnCostCents)} sub="weekend" />
            )}
            <div className="border-t border-slate-200" />
            <CostRow
              label={isRoundTrip ? "Per day (round trip)" : "Per day (one way)"}
              value={fmt(weekendGoCostCents + weekendReturnCostCents)}
              bold
            />
          </div>
        )}

        <div className="space-y-0.5">
          <CostRow label="Per week" value={fmt(perWeekCents)} />
          <CostRow label="Per month" value={fmt(perMonthCents)} bold />
          <CostRow label="Per year" value={fmtLarge(perYearCents)} />
        </div>

        {transponderSavingsMonthCents > 0 && (
          <TransponderCallout
            hasTransponder={hasTransponder}
            summary={`${fmt(transponderSavingsMonthCents)}/mo (${fmtLarge(
              transponderSavingsMonthCents * 12,
            )}/yr)`}
          />
        )}

        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 space-y-0.5">
          <p>
            {weekdayDaysPerYear} weekday + {weekendDaysPerYear} weekend/holiday days per year (
            {totalTripsPerYear} {isRoundTrip ? "round trips" : "one-way trips"})
          </p>
          {holidayDaysPerYear > 0 && (
            <p>{holidayDaysPerYear} Ontario statutory holidays use lower weekend rates</p>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          Estimate based on 2026 rates. Actual charges may vary.
        </p>
      </CardBody>
    </Card>
  );
}
