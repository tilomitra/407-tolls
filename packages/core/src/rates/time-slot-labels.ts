import type { WeekdaySlot, WeekendSlot } from "../types";

export const WEEKDAY_SLOT_LABELS: Readonly<Record<WeekdaySlot, string>> = {
  "5am": "5:00am - 7:00am",
  "7am": "7:00am - 9:30am",
  "930am": "9:30am - 10:30am",
  "1030am": "10:30am - 2:30pm",
  "230pm": "2:30pm - 3:30pm",
  "330pm": "3:30pm - 6:00pm",
  "6pm": "6:00pm - 9:00pm",
  "9pm": "9:00pm - 5:00am",
};

export const WEEKEND_SLOT_LABELS: Readonly<Record<WeekendSlot, string>> = {
  "830am": "8:30am - 10:00am",
  "10am": "10:00am - 7:00pm",
  "7pm": "7:00pm - 9:00pm",
  "9pm": "9:00pm - 8:30am",
};
