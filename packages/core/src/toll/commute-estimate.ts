import type {
  CommuteInput,
  CommuteEstimate,
  ResolvedTimeSlot,
  RouteInput,
  DayOfWeek,
} from "../types";
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

interface YearlyCostInput {
  route: RouteInput;
  goTimeSlot: ResolvedTimeSlot;
  returnTimeSlot: ResolvedTimeSlot;
  weekendGoTimeSlot: ResolvedTimeSlot;
  weekendReturnTimeSlot: ResolvedTimeSlot;
  weekdayDays: number;
  weekendDays: number;
  hasTransponder: boolean;
}

function computeYearlyCost(input: YearlyCostInput): number {
  const r: RouteInput = { ...input.route, hasTransponder: input.hasTransponder };
  const returnR: RouteInput = { ...r, direction: flipDirection(r.direction) };

  const goBreakdowns = getAllBreakdowns(r);
  const returnBreakdowns = getAllBreakdowns(returnR);

  const weekdayGo = findBreakdown(goBreakdowns, input.goTimeSlot).totalCents;
  const weekdayReturn = findBreakdown(returnBreakdowns, input.returnTimeSlot).totalCents;
  const weekendGo = findBreakdown(goBreakdowns, input.weekendGoTimeSlot).totalCents;
  const weekendReturn = findBreakdown(returnBreakdowns, input.weekendReturnTimeSlot).totalCents;

  return (
    (weekdayGo + weekdayReturn) * input.weekdayDays +
    (weekendGo + weekendReturn) * input.weekendDays
  );
}

export function computeCommuteEstimate(input: CommuteInput): CommuteEstimate {
  const {
    route,
    goTimeSlot,
    returnTimeSlot,
    weekendGoTimeSlot,
    weekendReturnTimeSlot,
    commuteDays,
  } = input;
  const { weekdayDays, weekendDays, holidayDays } = countCommuteDays(commuteDays);

  const returnRoute: RouteInput = { ...route, direction: flipDirection(route.direction) };

  const goBreakdowns = getAllBreakdowns(route);
  const returnBreakdowns = getAllBreakdowns(returnRoute);

  const weekdayGoCostCents = findBreakdown(goBreakdowns, goTimeSlot).totalCents;
  const weekdayReturnCostCents = findBreakdown(returnBreakdowns, returnTimeSlot).totalCents;
  const weekendGoCostCents = findBreakdown(goBreakdowns, weekendGoTimeSlot).totalCents;
  const weekendReturnCostCents = findBreakdown(returnBreakdowns, weekendReturnTimeSlot).totalCents;

  const monthlyAccountFee = route.hasTransponder ? 0 : NO_TRANSPONDER_MONTHLY_FEE_CENTS;

  const tripYearCents =
    (weekdayGoCostCents + weekdayReturnCostCents) * weekdayDays +
    (weekendGoCostCents + weekendReturnCostCents) * weekendDays;
  const perYearCents = tripYearCents + monthlyAccountFee * 12;
  const perMonthCents = Math.round(perYearCents / 12);

  const yearlyCostInput: YearlyCostInput = {
    route,
    goTimeSlot,
    returnTimeSlot,
    weekendGoTimeSlot,
    weekendReturnTimeSlot,
    weekdayDays,
    weekendDays,
    hasTransponder: !route.hasTransponder,
  };
  const altTripYearCents = computeYearlyCost(yearlyCostInput);
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
