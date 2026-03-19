import type { WeekdaySlot, WeekendSlot } from "../types";

export const WEEKDAY_SLOT_LABELS: Readonly<Record<WeekdaySlot, string>> = {
  "5am": "5–7 AM",
  "7am": "7–9:30 AM",
  "930am": "9:30–10:30",
  "1030am": "10:30–2:30",
  "230pm": "2:30–3:30",
  "330pm": "3:30–6 PM",
  "6pm": "6–9 PM",
  "9pm": "9 PM–5 AM",
};

export const WEEKEND_SLOT_LABELS: Readonly<Record<WeekendSlot, string>> = {
  "830am": "8:30–10 AM",
  "10am": "10 AM–7 PM",
  "7pm": "7–9 PM",
  "9pm": "9 PM–8:30 AM",
};
