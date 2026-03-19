import type { RouteInput, ResolvedTimeSlot, DayOfWeek } from "../types";
import { getAllBreakdowns, findBreakdown } from "./toll-cache";
import { flipDirection } from "../geo/direction";
import { isOntarioHoliday } from "../rates/holidays";
import { NO_TRANSPONDER_MONTHLY_FEE_CENTS } from "../rates";

// Re-export for backwards compat until all consumers import from types
export type { CommuteInput, CommuteEstimate, DayOfWeek } from "../types";

/**
 * Walk every day in the rate year (Feb 1 2026 to Jan 31 2027) and count
 * how many of the user's commute days fall on weekdays, weekends, or holidays.
 * Exact counts, not averages.
 */
function countCommuteDays(commuteDays: DayOfWeek[]) {
  const daySet = new Set(commuteDays);
  let weekdayDays = 0;
  let weekendDays = 0;
  let holidayDays = 0;

  // Rate year: Feb 1 2026 to Jan 31 2027
  const start = new Date(2026, 1, 1);
  const end = new Date(2027, 0, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay() as DayOfWeek;
    if (!daySet.has(dow)) continue;

    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = !isWeekend && isOntarioHoliday(d);

    if (isWeekend) {
      weekendDays++;
    } else if (isHoliday) {
      holidayDays++;
      weekendDays++; // holidays use weekend rates
    } else {
      weekdayDays++;
    }
  }

  return { weekdayDays, weekendDays, holidayDays };
}

/**
 * Compute total yearly toll cost for a commute route with a given transponder setting.
 * Used to compare "with transponder" vs "without transponder" costs.
 */
function computeYearlyCost({
  route,
  goTimeSlot,
  returnTimeSlot,
  weekendGoTimeSlot,
  weekendReturnTimeSlot,
  weekdayDays,
  weekendDays,
  hasTransponder,
}: {
  route: RouteInput;
  goTimeSlot: ResolvedTimeSlot;
  returnTimeSlot: ResolvedTimeSlot;
  weekendGoTimeSlot: ResolvedTimeSlot;
  weekendReturnTimeSlot: ResolvedTimeSlot;
  weekdayDays: number;
  weekendDays: number;
  hasTransponder: boolean;
}): number {
  const r: RouteInput = { ...route, hasTransponder };
  const returnR: RouteInput = { ...r, direction: flipDirection(r.direction) };

  const goBreakdowns = getAllBreakdowns(r);
  const returnBreakdowns = getAllBreakdowns(returnR);

  const weekdayGo = findBreakdown(goBreakdowns, goTimeSlot).totalCents;
  const weekdayReturn = findBreakdown(returnBreakdowns, returnTimeSlot).totalCents;
  const weekendGo = findBreakdown(goBreakdowns, weekendGoTimeSlot).totalCents;
  const weekendReturn = findBreakdown(returnBreakdowns, weekendReturnTimeSlot).totalCents;

  // (weekday round trip cost x weekday days) + (weekend round trip cost x weekend days)
  return (weekdayGo + weekdayReturn) * weekdayDays + (weekendGo + weekendReturn) * weekendDays;
}

export function computeCommuteEstimate(input: {
  route: RouteInput;
  goTimeSlot: ResolvedTimeSlot;
  returnTimeSlot: ResolvedTimeSlot;
  weekendGoTimeSlot: ResolvedTimeSlot;
  weekendReturnTimeSlot: ResolvedTimeSlot;
  commuteDays: DayOfWeek[];
}) {
  const { route, goTimeSlot, returnTimeSlot, weekendGoTimeSlot, weekendReturnTimeSlot, commuteDays } = input;

  const { weekdayDays, weekendDays, holidayDays } = countCommuteDays(commuteDays);

  const returnRoute: RouteInput = {
    ...route,
    direction: flipDirection(route.direction),
  };

  const goBreakdowns = getAllBreakdowns(route);
  const returnBreakdowns = getAllBreakdowns(returnRoute);

  const weekdayGoCostCents = findBreakdown(goBreakdowns, goTimeSlot).totalCents;
  const weekdayReturnCostCents = findBreakdown(returnBreakdowns, returnTimeSlot).totalCents;
  const weekendGoCostCents = findBreakdown(goBreakdowns, weekendGoTimeSlot).totalCents;
  const weekendReturnCostCents = findBreakdown(returnBreakdowns, weekendReturnTimeSlot).totalCents;

  // Non-transponder users pay $5/month account fee on top of per-trip charges
  const monthlyAccountFee = route.hasTransponder ? 0 : NO_TRANSPONDER_MONTHLY_FEE_CENTS;

  const tripYearCents =
    (weekdayGoCostCents + weekdayReturnCostCents) * weekdayDays +
    (weekendGoCostCents + weekendReturnCostCents) * weekendDays;
  const perYearCents = tripYearCents + monthlyAccountFee * 12;
  const perMonthCents = Math.round(perYearCents / 12);

  // Same calculation but with the opposite transponder setting
  const sharedSlots = { goTimeSlot, returnTimeSlot, weekendGoTimeSlot, weekendReturnTimeSlot, weekdayDays, weekendDays };
  const altTripYearCents = computeYearlyCost({
    ...sharedSlots,
    route,
    hasTransponder: !route.hasTransponder,
  });
  const altMonthlyFee = route.hasTransponder ? NO_TRANSPONDER_MONTHLY_FEE_CENTS : 0;
  const altYearCents = altTripYearCents + altMonthlyFee * 12;
  const altMonthCents = Math.round(altYearCents / 12);

  return {
    weekdayGoCostCents,
    weekdayReturnCostCents,
    weekendGoCostCents,
    weekendReturnCostCents,
    perMonthCents,
    perYearCents,
    weekdayDaysPerYear: weekdayDays,
    weekendDaysPerYear: weekendDays,
    holidayDaysPerYear: holidayDays,
    altTransponderMonthCents: altMonthCents,
    transponderSavingsMonthCents: Math.abs(perMonthCents - altMonthCents),
  };
}
