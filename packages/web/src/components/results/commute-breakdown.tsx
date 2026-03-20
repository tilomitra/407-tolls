"use client";

import type { CommuteEstimate, DayOfWeek } from "@407-etr/core";
import { DAY_NAMES } from "@407-etr/core";
import { Card, CardBody } from "../ui/card";
import { ShareButton } from "../ui/share-button";
import { formatDollars as fmt, formatLargeDollars as fmtLarge } from "@/lib/format";

function Row({ label, value, bold, sub }: { label: string; value: string; bold?: boolean; sub?: string }) {
  return (
    <div className={`flex items-baseline justify-between py-2 ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
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
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
  entryId?: string;
  exitId?: string;
  shareParams?: {
    goSlot: string;
    returnSlot: string;
    weekendGoSlot: string;
    weekendReturnSlot: string;
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
    altTransponderMonthCents,
  } = estimate;

  const dayLabels = commuteDays
    .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => DAY_NAMES[d])
    .join(", ");

  const hasWeekendDays = commuteDays.includes(0) || commuteDays.includes(6);
  const perWeekCents = Math.round(perYearCents / 52);

  const shareUrl = entryId && exitId && shareParams
    ? `/commute/${entryId}-to-${exitId}?days=${commuteDays.join(",")}&departure=${shareParams.goSlot}&return=${shareParams.returnSlot}&weekendDeparture=${shareParams.weekendGoSlot}&weekendReturn=${shareParams.weekendReturnSlot}&transponder=${hasTransponder}`
    : undefined;

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Commute Estimate</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {entryName} to {exitName}
            </p>
            <p className="text-xs text-slate-400">{dayLabels}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-slate-900">
                {fmt(perMonthCents)}
              </p>
              <p className="text-xs text-slate-400">per month</p>
            </div>
            {shareUrl && <ShareButton url={shareUrl} />}
          </div>
        </div>

        {children && <div>{children}</div>}

        <div className="rounded-lg bg-slate-50 px-4 py-1">
          <Row label="Departure" value={fmt(weekdayGoCostCents)} sub="weekday" />
          <Row label="Return" value={fmt(weekdayReturnCostCents)} sub="weekday" />
          <div className="border-t border-slate-200" />
          <Row label="Per day (round trip)" value={fmt(weekdayGoCostCents + weekdayReturnCostCents)} bold />
        </div>

        {hasWeekendDays && (
          <div className="rounded-lg bg-slate-50 px-4 py-1">
            <Row label="Departure" value={fmt(weekendGoCostCents)} sub="weekend" />
            <Row label="Return" value={fmt(weekendReturnCostCents)} sub="weekend" />
            <div className="border-t border-slate-200" />
            <Row label="Per day (round trip)" value={fmt(weekendGoCostCents + weekendReturnCostCents)} bold />
          </div>
        )}

        <div className="space-y-0.5">
          <Row label="Per week" value={fmt(perWeekCents)} />
          <Row label="Per month" value={fmt(perMonthCents)} bold />
          <Row label="Per year" value={fmtLarge(perYearCents)} />
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600 mb-1">How this breaks down</p>
          <p>{weekdayDaysPerYear} weekday trips + {weekendDaysPerYear} weekend/holiday trips per year</p>
          <p>Each trip includes a $1.00 fixed trip charge ({(weekdayDaysPerYear + weekendDaysPerYear) * 2} trips/yr = {fmtLarge((weekdayDaysPerYear + weekendDaysPerYear) * 2 * 100)}/yr in trip charges alone)</p>
          {!hasTransponder && (
            <>
              <p className="text-amber-600">Each trip also includes a $5.30 camera charge without a transponder</p>
              <p className="text-amber-600">Plus a $5.00/month account fee ($60/yr)</p>
            </>
          )}
          {holidayDaysPerYear > 0 && (
            <p>{holidayDaysPerYear} Ontario statutory holidays use lower weekend rates</p>
          )}
        </div>

        {transponderSavingsMonthCents > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">
              {hasTransponder ? "Transponder saves you" : "Get a transponder, save"}{" "}
              {fmt(transponderSavingsMonthCents)}/mo
            </p>
            <p className="mt-0.5 text-xs text-emerald-600">
              {hasTransponder ? "Without" : "With"} transponder: {fmt(altTransponderMonthCents)}/mo
              {" "}({fmtLarge(Math.abs(perYearCents - altTransponderMonthCents * 12))}/yr difference)
            </p>
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          Based on Feb 2026 rates. Actual bills may vary due to distance measurement differences.
          Holidays that fall on weekends are not double-counted.
        </p>
      </CardBody>
    </Card>
  );
}
