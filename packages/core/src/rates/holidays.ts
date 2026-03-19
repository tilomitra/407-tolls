import type { DayType } from "../types";

// Ontario statutory holidays for 2026
// Source: ontario.ca/document/your-guide-employment-standards-act-0/public-holidays
const ONTARIO_HOLIDAYS_2026: ReadonlySet<string> = new Set([
  "2026-01-01", // New Year's Day
  "2026-02-16", // Family Day
  "2026-04-03", // Good Friday
  "2026-05-18", // Victoria Day
  "2026-07-01", // Canada Day
  "2026-08-03", // Civic Holiday
  "2026-09-07", // Labour Day
  "2026-10-12", // Thanksgiving
  "2026-12-25", // Christmas
  "2026-12-26", // Boxing Day
]);

export function isOntarioHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return ONTARIO_HOLIDAYS_2026.has(`${y}-${m}-${d}`);
}

export function getDayType(date: Date): DayType {
  const day = date.getDay();
  if (day === 0 || day === 6 || isOntarioHoliday(date)) {
    return "weekend_or_holiday";
  }
  return "weekday";
}
