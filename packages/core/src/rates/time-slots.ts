import type { ResolvedTimeSlot, WeekdaySlot, WeekendSlot } from "../types";
import { getDayType } from "./holidays";

const WEEKDAY_BOUNDARIES: ReadonlyArray<readonly [number, WeekdaySlot]> = [
  [300, "5am"],     // 5:00
  [420, "7am"],     // 7:00
  [570, "930am"],   // 9:30
  [630, "1030am"],  // 10:30
  [870, "230pm"],   // 14:30
  [930, "330pm"],   // 15:30
  [1080, "6pm"],    // 18:00
  [1260, "9pm"],    // 21:00
];

const WEEKEND_BOUNDARIES: ReadonlyArray<readonly [number, WeekendSlot]> = [
  [510, "830am"],   // 8:30
  [600, "10am"],    // 10:00
  [1140, "7pm"],    // 19:00
  [1260, "9pm"],    // 21:00
];

/**
 * Binary search: find the rightmost boundary whose minute value <= input.
 * Returns the associated slot, or the overnight default if before all boundaries.
 *
 * Time:  O(log n)
 * Space: O(1)
 */
function findSlot<T>(boundaries: ReadonlyArray<readonly [number, T]>, minutes: number, overnight: T): T {
  if (minutes < boundaries[0]![0]) return overnight;

  let lo = 0;
  let hi = boundaries.length - 1;
  let result = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (boundaries[mid]![0] <= minutes) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return boundaries[result]![1];
}

export function resolveTimeSlot(date: Date): ResolvedTimeSlot {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const dayType = getDayType(date);

  if (dayType === "weekend_or_holiday") {
    return { dayType, slot: findSlot(WEEKEND_BOUNDARIES, minutes, "9pm") };
  }
  return { dayType, slot: findSlot(WEEKDAY_BOUNDARIES, minutes, "9pm") };
}
