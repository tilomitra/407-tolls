import type { RateKey } from "../types";

// 2026 407 ETR light vehicle toll rates (cents per km).
// Effective: January 1, 2026
// Source: https://www.407etr.com/en/rate-chart-light

export const RATE_YEAR = 2026;
//
// Layout: "dayType:direction:timeSlot:zone" → cents/km
// Total entries: 288 (2 day types × 2 directions × variable slots × 12 zones)

export const RATES_2026: Readonly<Record<RateKey, number>> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // WESTBOUND WEEKDAY
  // ═══════════════════════════════════════════════════════════════════════════

  // 5:00 AM – 6:59 AM
  "weekday:westbound:5am:1": 79.13,
  "weekday:westbound:5am:2": 65.16,
  "weekday:westbound:5am:3": 66.61,
  "weekday:westbound:5am:4": 61.18,
  "weekday:westbound:5am:5": 79.08,
  "weekday:westbound:5am:6": 71.55,
  "weekday:westbound:5am:7": 76.23,
  "weekday:westbound:5am:8": 72.83,
  "weekday:westbound:5am:9": 72.83,
  "weekday:westbound:5am:10": 56.49,
  "weekday:westbound:5am:11": 64.05,
  "weekday:westbound:5am:12": 64.05,

  // 7:00 AM – 9:29 AM
  "weekday:westbound:7am:1": 97.39,
  "weekday:westbound:7am:2": 65.17,
  "weekday:westbound:7am:3": 67.47,
  "weekday:westbound:7am:4": 69.59,
  "weekday:westbound:7am:5": 85.35,
  "weekday:westbound:7am:6": 100.12,
  "weekday:westbound:7am:7": 108.79,
  "weekday:westbound:7am:8": 108.79,
  "weekday:westbound:7am:9": 108.79,
  "weekday:westbound:7am:10": 62.30,
  "weekday:westbound:7am:11": 99.24,
  "weekday:westbound:7am:12": 99.24,

  // 9:30 AM – 10:29 AM
  "weekday:westbound:930am:1": 79.08,
  "weekday:westbound:930am:2": 65.16,
  "weekday:westbound:930am:3": 66.59,
  "weekday:westbound:930am:4": 61.18,
  "weekday:westbound:930am:5": 79.08,
  "weekday:westbound:930am:6": 71.55,
  "weekday:westbound:930am:7": 76.23,
  "weekday:westbound:930am:8": 72.83,
  "weekday:westbound:930am:9": 72.83,
  "weekday:westbound:930am:10": 62.29,
  "weekday:westbound:930am:11": 66.50,
  "weekday:westbound:930am:12": 66.50,

  // 10:30 AM – 2:29 PM
  "weekday:westbound:1030am:1": 79.07,
  "weekday:westbound:1030am:2": 65.15,
  "weekday:westbound:1030am:3": 66.58,
  "weekday:westbound:1030am:4": 61.17,
  "weekday:westbound:1030am:5": 79.07,
  "weekday:westbound:1030am:6": 71.54,
  "weekday:westbound:1030am:7": 76.22,
  "weekday:westbound:1030am:8": 72.82,
  "weekday:westbound:1030am:9": 72.82,
  "weekday:westbound:1030am:10": 56.48,
  "weekday:westbound:1030am:11": 62.27,
  "weekday:westbound:1030am:12": 64.04,

  // 2:30 PM – 3:29 PM
  "weekday:westbound:230pm:1": 99.81,
  "weekday:westbound:230pm:2": 65.17,
  "weekday:westbound:230pm:3": 67.48,
  "weekday:westbound:230pm:4": 69.59,
  "weekday:westbound:230pm:5": 79.08,
  "weekday:westbound:230pm:6": 71.55,
  "weekday:westbound:230pm:7": 76.23,
  "weekday:westbound:230pm:8": 72.83,
  "weekday:westbound:230pm:9": 72.83,
  "weekday:westbound:230pm:10": 62.28,
  "weekday:westbound:230pm:11": 62.28,
  "weekday:westbound:230pm:12": 64.05,

  // 3:30 PM – 5:59 PM
  "weekday:westbound:330pm:1": 99.81,
  "weekday:westbound:330pm:2": 65.18,
  "weekday:westbound:330pm:3": 67.49,
  "weekday:westbound:330pm:4": 69.60,
  "weekday:westbound:330pm:5": 85.36,
  "weekday:westbound:330pm:6": 100.13,
  "weekday:westbound:330pm:7": 108.80,
  "weekday:westbound:330pm:8": 108.79,
  "weekday:westbound:330pm:9": 108.79,
  "weekday:westbound:330pm:10": 62.29,
  "weekday:westbound:330pm:11": 70.76,
  "weekday:westbound:330pm:12": 70.76,

  // 6:00 PM – 8:59 PM
  "weekday:westbound:6pm:1": 79.08,
  "weekday:westbound:6pm:2": 65.17,
  "weekday:westbound:6pm:3": 66.59,
  "weekday:westbound:6pm:4": 69.48,
  "weekday:westbound:6pm:5": 79.08,
  "weekday:westbound:6pm:6": 71.55,
  "weekday:westbound:6pm:7": 76.23,
  "weekday:westbound:6pm:8": 72.83,
  "weekday:westbound:6pm:9": 72.83,
  "weekday:westbound:6pm:10": 62.28,
  "weekday:westbound:6pm:11": 62.28,
  "weekday:westbound:6pm:12": 64.05,

  // 9:00 PM – 4:59 AM
  "weekday:westbound:9pm:1": 50.66,
  "weekday:westbound:9pm:2": 50.56,
  "weekday:westbound:9pm:3": 50.53,
  "weekday:westbound:9pm:4": 50.49,
  "weekday:westbound:9pm:5": 50.56,
  "weekday:westbound:9pm:6": 50.56,
  "weekday:westbound:9pm:7": 50.56,
  "weekday:westbound:9pm:8": 50.56,
  "weekday:westbound:9pm:9": 50.56,
  "weekday:westbound:9pm:10": 50.56,
  "weekday:westbound:9pm:11": 50.56,
  "weekday:westbound:9pm:12": 50.56,

  // ═══════════════════════════════════════════════════════════════════════════
  // EASTBOUND WEEKDAY
  // ═══════════════════════════════════════════════════════════════════════════

  // 5:00 AM – 6:59 AM
  "weekday:eastbound:5am:1": 56.49,
  "weekday:eastbound:5am:2": 57.32,
  "weekday:eastbound:5am:3": 62.52,
  "weekday:eastbound:5am:4": 60.70,
  "weekday:eastbound:5am:5": 68.25,
  "weekday:eastbound:5am:6": 81.32,
  "weekday:eastbound:5am:7": 82.76,
  "weekday:eastbound:5am:8": 80.83,
  "weekday:eastbound:5am:9": 82.79,
  "weekday:eastbound:5am:10": 67.79,
  "weekday:eastbound:5am:11": 73.08,
  "weekday:eastbound:5am:12": 77.87,

  // 7:00 AM – 9:29 AM
  "weekday:eastbound:7am:1": 62.90,
  "weekday:eastbound:7am:2": 62.54,
  "weekday:eastbound:7am:3": 62.54,
  "weekday:eastbound:7am:4": 62.55,
  "weekday:eastbound:7am:5": 69.33,
  "weekday:eastbound:7am:6": 106.58,
  "weekday:eastbound:7am:7": 112.79,
  "weekday:eastbound:7am:8": 112.79,
  "weekday:eastbound:7am:9": 112.79,
  "weekday:eastbound:7am:10": 95.60,
  "weekday:eastbound:7am:11": 95.60,
  "weekday:eastbound:7am:12": 95.60,

  // 9:30 AM – 10:29 AM
  "weekday:eastbound:930am:1": 62.52,
  "weekday:eastbound:930am:2": 62.53,
  "weekday:eastbound:930am:3": 62.53,
  "weekday:eastbound:930am:4": 62.52,
  "weekday:eastbound:930am:5": 68.95,
  "weekday:eastbound:930am:6": 81.32,
  "weekday:eastbound:930am:7": 82.76,
  "weekday:eastbound:930am:8": 80.83,
  "weekday:eastbound:930am:9": 82.79,
  "weekday:eastbound:930am:10": 67.79,
  "weekday:eastbound:930am:11": 73.08,
  "weekday:eastbound:930am:12": 78.02,

  // 10:30 AM – 2:29 PM
  "weekday:eastbound:1030am:1": 56.48,
  "weekday:eastbound:1030am:2": 57.31,
  "weekday:eastbound:1030am:3": 62.51,
  "weekday:eastbound:1030am:4": 60.69,
  "weekday:eastbound:1030am:5": 68.24,
  "weekday:eastbound:1030am:6": 81.31,
  "weekday:eastbound:1030am:7": 82.75,
  "weekday:eastbound:1030am:8": 80.82,
  "weekday:eastbound:1030am:9": 82.78,
  "weekday:eastbound:1030am:10": 67.78,
  "weekday:eastbound:1030am:11": 73.07,
  "weekday:eastbound:1030am:12": 77.86,

  // 2:30 PM – 3:29 PM
  "weekday:eastbound:230pm:1": 62.84,
  "weekday:eastbound:230pm:2": 62.52,
  "weekday:eastbound:230pm:3": 62.52,
  "weekday:eastbound:230pm:4": 62.53,
  "weekday:eastbound:230pm:5": 69.31,
  "weekday:eastbound:230pm:6": 81.32,
  "weekday:eastbound:230pm:7": 82.76,
  "weekday:eastbound:230pm:8": 80.83,
  "weekday:eastbound:230pm:9": 82.79,
  "weekday:eastbound:230pm:10": 69.40,
  "weekday:eastbound:230pm:11": 73.08,
  "weekday:eastbound:230pm:12": 97.06,

  // 3:30 PM – 5:59 PM
  "weekday:eastbound:330pm:1": 62.89,
  "weekday:eastbound:330pm:2": 62.53,
  "weekday:eastbound:330pm:3": 62.53,
  "weekday:eastbound:330pm:4": 62.54,
  "weekday:eastbound:330pm:5": 69.32,
  "weekday:eastbound:330pm:6": 106.59,
  "weekday:eastbound:330pm:7": 119.21,
  "weekday:eastbound:330pm:8": 119.21,
  "weekday:eastbound:330pm:9": 119.21,
  "weekday:eastbound:330pm:10": 102.73,
  "weekday:eastbound:330pm:11": 116.90,
  "weekday:eastbound:330pm:12": 116.87,

  // 6:00 PM – 8:59 PM
  "weekday:eastbound:6pm:1": 62.88,
  "weekday:eastbound:6pm:2": 62.52,
  "weekday:eastbound:6pm:3": 62.52,
  "weekday:eastbound:6pm:4": 62.37,
  "weekday:eastbound:6pm:5": 68.25,
  "weekday:eastbound:6pm:6": 81.32,
  "weekday:eastbound:6pm:7": 82.76,
  "weekday:eastbound:6pm:8": 80.83,
  "weekday:eastbound:6pm:9": 82.79,
  "weekday:eastbound:6pm:10": 67.79,
  "weekday:eastbound:6pm:11": 73.08,
  "weekday:eastbound:6pm:12": 77.87,

  // 9:00 PM – 4:59 AM
  "weekday:eastbound:9pm:1": 49.93,
  "weekday:eastbound:9pm:2": 50.56,
  "weekday:eastbound:9pm:3": 50.56,
  "weekday:eastbound:9pm:4": 50.56,
  "weekday:eastbound:9pm:5": 50.56,
  "weekday:eastbound:9pm:6": 50.56,
  "weekday:eastbound:9pm:7": 50.56,
  "weekday:eastbound:9pm:8": 50.56,
  "weekday:eastbound:9pm:9": 50.56,
  "weekday:eastbound:9pm:10": 50.56,
  "weekday:eastbound:9pm:11": 50.56,
  "weekday:eastbound:9pm:12": 50.56,

  // ═══════════════════════════════════════════════════════════════════════════
  // WESTBOUND WEEKEND + ONTARIO STATUTORY HOLIDAY
  // ═══════════════════════════════════════════════════════════════════════════

  // 8:30 AM – 9:59 AM
  "weekend_or_holiday:westbound:830am:1": 63.43,
  "weekend_or_holiday:westbound:830am:2": 59.31,
  "weekend_or_holiday:westbound:830am:3": 50.54,
  "weekend_or_holiday:westbound:830am:4": 50.50,
  "weekend_or_holiday:westbound:830am:5": 50.57,
  "weekend_or_holiday:westbound:830am:6": 50.57,
  "weekend_or_holiday:westbound:830am:7": 71.91,
  "weekend_or_holiday:westbound:830am:8": 71.91,
  "weekend_or_holiday:westbound:830am:9": 55.99,
  "weekend_or_holiday:westbound:830am:10": 50.57,
  "weekend_or_holiday:westbound:830am:11": 50.57,
  "weekend_or_holiday:westbound:830am:12": 71.91,

  // 10:00 AM – 6:59 PM
  "weekend_or_holiday:westbound:10am:1": 63.44,
  "weekend_or_holiday:westbound:10am:2": 59.32,
  "weekend_or_holiday:westbound:10am:3": 50.55,
  "weekend_or_holiday:westbound:10am:4": 50.51,
  "weekend_or_holiday:westbound:10am:5": 59.61,
  "weekend_or_holiday:westbound:10am:6": 83.19,
  "weekend_or_holiday:westbound:10am:7": 87.27,
  "weekend_or_holiday:westbound:10am:8": 78.86,
  "weekend_or_holiday:westbound:10am:9": 87.27,
  "weekend_or_holiday:westbound:10am:10": 50.58,
  "weekend_or_holiday:westbound:10am:11": 50.58,
  "weekend_or_holiday:westbound:10am:12": 83.99,

  // 7:00 PM – 8:59 PM
  "weekend_or_holiday:westbound:7pm:1": 63.43,
  "weekend_or_holiday:westbound:7pm:2": 58.29,
  "weekend_or_holiday:westbound:7pm:3": 50.54,
  "weekend_or_holiday:westbound:7pm:4": 50.50,
  "weekend_or_holiday:westbound:7pm:5": 50.57,
  "weekend_or_holiday:westbound:7pm:6": 50.57,
  "weekend_or_holiday:westbound:7pm:7": 50.57,
  "weekend_or_holiday:westbound:7pm:8": 50.57,
  "weekend_or_holiday:westbound:7pm:9": 50.57,
  "weekend_or_holiday:westbound:7pm:10": 50.57,
  "weekend_or_holiday:westbound:7pm:11": 50.57,
  "weekend_or_holiday:westbound:7pm:12": 50.57,

  // 9:00 PM – 8:29 AM
  "weekend_or_holiday:westbound:9pm:1": 50.66,
  "weekend_or_holiday:westbound:9pm:2": 50.56,
  "weekend_or_holiday:westbound:9pm:3": 50.53,
  "weekend_or_holiday:westbound:9pm:4": 50.49,
  "weekend_or_holiday:westbound:9pm:5": 50.56,
  "weekend_or_holiday:westbound:9pm:6": 50.56,
  "weekend_or_holiday:westbound:9pm:7": 50.56,
  "weekend_or_holiday:westbound:9pm:8": 50.56,
  "weekend_or_holiday:westbound:9pm:9": 50.56,
  "weekend_or_holiday:westbound:9pm:10": 50.56,
  "weekend_or_holiday:westbound:9pm:11": 50.56,
  "weekend_or_holiday:westbound:9pm:12": 50.56,

  // ═══════════════════════════════════════════════════════════════════════════
  // EASTBOUND WEEKEND + ONTARIO STATUTORY HOLIDAY
  // ═══════════════════════════════════════════════════════════════════════════

  // 8:30 AM – 9:59 AM
  "weekend_or_holiday:eastbound:830am:1": 49.94,
  "weekend_or_holiday:eastbound:830am:2": 50.57,
  "weekend_or_holiday:eastbound:830am:3": 50.57,
  "weekend_or_holiday:eastbound:830am:4": 50.57,
  "weekend_or_holiday:eastbound:830am:5": 50.57,
  "weekend_or_holiday:eastbound:830am:6": 71.91,
  "weekend_or_holiday:eastbound:830am:7": 71.91,
  "weekend_or_holiday:eastbound:830am:8": 71.91,
  "weekend_or_holiday:eastbound:830am:9": 71.91,
  "weekend_or_holiday:eastbound:830am:10": 56.14,
  "weekend_or_holiday:eastbound:830am:11": 50.57,
  "weekend_or_holiday:eastbound:830am:12": 71.90,

  // 10:00 AM – 6:59 PM
  "weekend_or_holiday:eastbound:10am:1": 49.95,
  "weekend_or_holiday:eastbound:10am:2": 50.58,
  "weekend_or_holiday:eastbound:10am:3": 50.58,
  "weekend_or_holiday:eastbound:10am:4": 50.58,
  "weekend_or_holiday:eastbound:10am:5": 50.58,
  "weekend_or_holiday:eastbound:10am:6": 79.01,
  "weekend_or_holiday:eastbound:10am:7": 87.27,
  "weekend_or_holiday:eastbound:10am:8": 87.27,
  "weekend_or_holiday:eastbound:10am:9": 87.27,
  "weekend_or_holiday:eastbound:10am:10": 56.15,
  "weekend_or_holiday:eastbound:10am:11": 52.84,
  "weekend_or_holiday:eastbound:10am:12": 84.04,

  // 7:00 PM – 8:59 PM
  "weekend_or_holiday:eastbound:7pm:1": 49.94,
  "weekend_or_holiday:eastbound:7pm:2": 50.57,
  "weekend_or_holiday:eastbound:7pm:3": 50.57,
  "weekend_or_holiday:eastbound:7pm:4": 50.57,
  "weekend_or_holiday:eastbound:7pm:5": 50.57,
  "weekend_or_holiday:eastbound:7pm:6": 50.57,
  "weekend_or_holiday:eastbound:7pm:7": 50.57,
  "weekend_or_holiday:eastbound:7pm:8": 50.57,
  "weekend_or_holiday:eastbound:7pm:9": 50.57,
  "weekend_or_holiday:eastbound:7pm:10": 50.57,
  "weekend_or_holiday:eastbound:7pm:11": 50.57,
  "weekend_or_holiday:eastbound:7pm:12": 71.91,

  // 9:00 PM – 8:29 AM
  "weekend_or_holiday:eastbound:9pm:1": 49.93,
  "weekend_or_holiday:eastbound:9pm:2": 50.56,
  "weekend_or_holiday:eastbound:9pm:3": 50.56,
  "weekend_or_holiday:eastbound:9pm:4": 50.56,
  "weekend_or_holiday:eastbound:9pm:5": 50.56,
  "weekend_or_holiday:eastbound:9pm:6": 50.56,
  "weekend_or_holiday:eastbound:9pm:7": 50.56,
  "weekend_or_holiday:eastbound:9pm:8": 50.56,
  "weekend_or_holiday:eastbound:9pm:9": 50.56,
  "weekend_or_holiday:eastbound:9pm:10": 50.56,
  "weekend_or_holiday:eastbound:9pm:11": 50.56,
  "weekend_or_holiday:eastbound:9pm:12": 50.56,
};

// ── Fees (cents) ─────────────────────────────────────────────────────────────

/** Flat charge per trip, applied once regardless of distance. */
export const TRIP_CHARGE_CENTS = 100; // $1.00

/** Additional charge per trip if vehicle has no transponder (camera toll). */
export const CAMERA_CHARGE_CENTS = 530; // $5.30

/** Monthly account fee for non-transponder users. */
export const NO_TRANSPONDER_MONTHLY_FEE_CENTS = 500; // $5.00

// ── Accessor ─────────────────────────────────────────────────────────────────

export function getRate(key: RateKey): number {
  const rate = RATES_2026[key];
  if (rate === undefined) {
    throw new Error(`Unknown rate key: ${key}`);
  }
  return rate;
}
