import type { CommuteInput, CommuteEstimate, RouteInput, DayOfWeek } from "../types";
import { getAllBreakdowns, findBreakdown } from "./toll-cache";
import { flipDirection } from "../geo/direction";
import { isOntarioHoliday } from "../rates/holidays";
import { NO_TRANSPONDER_MONTHLY_FEE_CENTS, RATE_YEAR } from "../rates";

interface DayCounts {
  weekdayDays: number;
  weekendDays: number;
  holidayDays: number;
}

const commuteDaysCache = new Map<string, DayCounts>();

function countCommuteDays(commuteDays: DayOfWeek[]): DayCounts {
  const key = commuteDays.slice().sort().join(",");
  const cached = commuteDaysCache.get(key);
  if (cached) return cached;

  const daySet = new Set(commuteDays);
  let weekdayDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;

  const start = new Date(RATE_YEAR, 0, 1);
  const end = new Date(RATE_YEAR, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay() as DayOfWeek;
    if (!daySet.has(dow)) continue;

    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = !isWeekend && isOntarioHoliday(d);

    if (isWeekend) {
      weekendDays++;
    } else if (isHoliday) {
      holidayDays++;
      weekendDays++;
    } else {
      weekdayDays++;
    }
  }

  const result = { weekdayDays, weekendDays, holidayDays };
  commuteDaysCache.set(key, result);
  return result;
}

function computeTripCosts(input: CommuteInput, dayCounts: DayCounts, hasTransponder: boolean) {
  const route: RouteInput = { ...input.route, hasTransponder };
  const goBreakdowns = getAllBreakdowns(route);
  const weekdayGoCostCents = findBreakdown(goBreakdowns, input.goTimeSlot).totalCents;
  const weekendGoCostCents = findBreakdown(goBreakdowns, input.weekendGoTimeSlot).totalCents;

  let weekdayReturnCostCents = 0;
  let weekendReturnCostCents = 0;

  if (input.tripType === "round_trip") {
    const returnRoute: RouteInput = { ...route, direction: flipDirection(route.direction) };
    const returnBreakdowns = getAllBreakdowns(returnRoute);
    weekdayReturnCostCents = findBreakdown(returnBreakdowns, input.returnTimeSlot).totalCents;
    weekendReturnCostCents = findBreakdown(
      returnBreakdowns,
      input.weekendReturnTimeSlot,
    ).totalCents;
  }

  const tripYearCents =
    (weekdayGoCostCents + weekdayReturnCostCents) * dayCounts.weekdayDays +
    (weekendGoCostCents + weekendReturnCostCents) * dayCounts.weekendDays;

  const monthlyAccountFee = hasTransponder ? 0 : NO_TRANSPONDER_MONTHLY_FEE_CENTS;
  const perYearCents = tripYearCents + monthlyAccountFee * 12;

  return {
    weekdayGoCostCents,
    weekdayReturnCostCents,
    weekendGoCostCents,
    weekendReturnCostCents,
    perYearCents,
  };
}

export function computeCommuteEstimate(input: CommuteInput): CommuteEstimate {
  const dayCounts = countCommuteDays(input.commuteDays);

  const primary = computeTripCosts(input, dayCounts, input.route.hasTransponder);
  const alt = computeTripCosts(input, dayCounts, !input.route.hasTransponder);

  const perMonthCents = Math.round(primary.perYearCents / 12);
  const altMonthCents = Math.round(alt.perYearCents / 12);

  return {
    weekdayGoCostCents: primary.weekdayGoCostCents,
    weekdayReturnCostCents: primary.weekdayReturnCostCents,
    weekendGoCostCents: primary.weekendGoCostCents,
    weekendReturnCostCents: primary.weekendReturnCostCents,
    perMonthCents,
    perYearCents: primary.perYearCents,
    weekdayDaysPerYear: dayCounts.weekdayDays,
    weekendDaysPerYear: dayCounts.weekendDays,
    holidayDaysPerYear: dayCounts.holidayDays,
    altTransponderMonthCents: altMonthCents,
    transponderSavingsMonthCents: Math.abs(perMonthCents - altMonthCents),
  };
}
