import { z } from "zod/v4";

// 12 toll zones on the 407 ETR, numbered west to east.
//   Zone 1:  QEW → Dundas
//   Zone 2:  Dundas → Neyagawa
//   Zone 3:  Neyagawa → Highway 403
//   Zone 4:  Highway 403 → Highway 401
//   Zone 5:  Highway 401 → Highway 410
//   Zone 6:  Highway 410 → Highway 427
//   Zone 7:  Highway 427 → Highway 400
//   Zone 8:  Highway 400 → Yonge
//   Zone 9:  Yonge → Highway 404
//   Zone 10: Highway 404 → McCowan
//   Zone 11: McCowan → York Durham Line
//   Zone 12: York Durham Line → Brock
export const ZONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const ZoneSchema = z.int().min(1).max(12);
export type Zone = z.infer<typeof ZoneSchema>;

export const DirectionSchema = z.enum(["eastbound", "westbound"]);
export type Direction = z.infer<typeof DirectionSchema>;

export const WEEKDAY_SLOTS = [
  "5am",
  "7am",
  "930am",
  "1030am",
  "230pm",
  "330pm",
  "6pm",
  "9pm",
] as const;

export const WeekdaySlotSchema = z.enum(WEEKDAY_SLOTS);
export type WeekdaySlot = z.infer<typeof WeekdaySlotSchema>;

export const WEEKEND_SLOTS = ["830am", "10am", "7pm", "9pm"] as const;

export const WeekendSlotSchema = z.enum(WEEKEND_SLOTS);
export type WeekendSlot = z.infer<typeof WeekendSlotSchema>;

export const DayTypeSchema = z.enum(["weekday", "weekend_or_holiday"]);
export type DayType = z.infer<typeof DayTypeSchema>;

export const ResolvedTimeSlotSchema = z.discriminatedUnion("dayType", [
  z.object({ dayType: z.literal("weekday"), slot: WeekdaySlotSchema }),
  z.object({ dayType: z.literal("weekend_or_holiday"), slot: WeekendSlotSchema }),
]);
export type ResolvedTimeSlot = z.infer<typeof ResolvedTimeSlotSchema>;

export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type LatLng = z.infer<typeof LatLngSchema>;

export const TollPointTypeSchema = z.enum(["Physical", "Virtual", "Hybrid"]);
export type TollPointType = z.infer<typeof TollPointTypeSchema>;

export const TollPointSchema = z.object({
  id: z.number(),
  type: TollPointTypeSchema,
  location: LatLngSchema,
  zone: ZoneSchema,
  name: z.string(),
  isFree: z.boolean(),
});
export type TollPoint = z.infer<typeof TollPointSchema>;

export const RampAccessSchema = z.object({
  hasOnRamp: z.boolean(),
  hasOffRamp: z.boolean(),
});
export type RampAccess = z.infer<typeof RampAccessSchema>;

export const InterchangeSchema = z.object({
  id: z.string(),
  name: z.string(),
  km: z.number(),
  location: LatLngSchema,
  zone: ZoneSchema,
  isFree: z.boolean(),
  eastbound: RampAccessSchema,
  westbound: RampAccessSchema,
  note: z.string().nullable().optional(),
  noteFr: z.string().nullable().optional(),
});
export type Interchange = z.infer<typeof InterchangeSchema>;

export const OnRampSchema = z.object({
  id: z.string(),
  name: z.string(),
  km: z.number(),
  location: LatLngSchema,
  zone: ZoneSchema,
  isFree: z.boolean(),
});
export type OnRamp = z.infer<typeof OnRampSchema>;

export const RampWithDistanceSchema = OnRampSchema.extend({
  distanceKm: z.number(),
});
export type RampWithDistance = z.infer<typeof RampWithDistanceSchema>;

export const TollInputSchema = z.object({
  entryZone: ZoneSchema,
  exitZone: ZoneSchema,
  entryKm: z.number(),
  exitKm: z.number(),
  direction: DirectionSchema,
  timeSlot: ResolvedTimeSlotSchema,
  hasTransponder: z.boolean(),
});
export type TollInput = z.infer<typeof TollInputSchema>;

export const RouteInputSchema = TollInputSchema.omit({ timeSlot: true });
export type RouteInput = z.infer<typeof RouteInputSchema>;

export type RouteResult =
  | { ok: true; route: RouteInput; entry: Interchange; exit: Interchange }
  | { ok: false; error: string };

export const ZoneTollDetailSchema = z.object({
  zone: ZoneSchema,
  distanceKm: z.number(),
  rateCentsPerKm: z.number(),
  costCents: z.number(),
});
export type ZoneTollDetail = z.infer<typeof ZoneTollDetailSchema>;

export const TollBreakdownSchema = z.object({
  totalCents: z.number(),
  tollCents: z.number(),
  tripChargeCents: z.number(),
  cameraChargeCents: z.number().nullable(),
  perZone: z.array(ZoneTollDetailSchema),
  direction: DirectionSchema,
  timeSlot: ResolvedTimeSlotSchema,
});
export type TollBreakdown = z.infer<typeof TollBreakdownSchema>;

export const TimeSlotCostSchema = z.object({
  slot: z.string(),
  dayType: z.string(),
  label: z.string(),
  totalCents: z.number(),
});
export type TimeSlotCost = z.infer<typeof TimeSlotCostSchema>;

export const TollResponseSchema = TollBreakdownSchema.extend({
  byTimeSlot: z.array(TimeSlotCostSchema),
});
export type TollResponse = z.infer<typeof TollResponseSchema>;

export const DirectionsResultSchema = z.object({
  toOnRampMinutes: z.number(),
  highwayMinutes: z.number(),
  fromOffRampMinutes: z.number(),
});
export type DirectionsResult = z.infer<typeof DirectionsResultSchema>;

export interface DirectionsInput {
  origin: LatLng;
  onRamp: OnRamp;
  offRamp: OnRamp;
  destination: LatLng;
}

export type DirectionsProvider = (input: DirectionsInput) => Promise<DirectionsResult>;

export const RouteOptionSchema = z.object({
  onRamp: OnRampSchema,
  offRamp: OnRampSchema,
  toll: TollBreakdownSchema,
  driveTimeMinutes: z.number(),
  driveToOnRampMinutes: z.number(),
  driveFromOffRampMinutes: z.number(),
  highwayTimeMinutes: z.number(),
});
export type RouteOption = z.infer<typeof RouteOptionSchema>;

export const CompareResultSchema = z.object({
  routes: z.array(RouteOptionSchema),
  defaultRoute: RouteOptionSchema,
  bestSaving: z
    .object({
      savingsCents: z.number(),
      extraMinutes: z.number(),
      alternateOnRamp: z.string(),
      alternateOffRamp: z.string(),
      description: z.string(),
    })
    .nullable(),
});
export type CompareResult = z.infer<typeof CompareResultSchema>;

export const CompareInputSchema = z.object({
  origin: LatLngSchema,
  destination: LatLngSchema,
  timeSlot: ResolvedTimeSlotSchema,
  hasTransponder: z.boolean(),
  maxRamps: z.number().int().min(1).max(10).optional(),
});
export type CompareInput = z.infer<typeof CompareInputSchema>;

export interface CompareRoutesArgs {
  input: CompareInput;
  onRamps: readonly OnRamp[];
  offRamps: readonly OnRamp[];
  getDirections: DirectionsProvider;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

export const CommuteScheduleSchema = z.object({
  goTimeSlot: ResolvedTimeSlotSchema,
  returnTimeSlot: ResolvedTimeSlotSchema,
  weekendGoTimeSlot: ResolvedTimeSlotSchema,
  weekendReturnTimeSlot: ResolvedTimeSlotSchema,
  commuteDays: z.array(
    z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ]),
  ),
});
export type CommuteSchedule = z.infer<typeof CommuteScheduleSchema>;

export const CommuteInputSchema = CommuteScheduleSchema.extend({
  route: RouteInputSchema,
});
export type CommuteInput = z.infer<typeof CommuteInputSchema>;

export const CommuteEstimateSchema = z.object({
  weekdayGoCostCents: z.number(),
  weekdayReturnCostCents: z.number(),
  weekendGoCostCents: z.number(),
  weekendReturnCostCents: z.number(),
  perMonthCents: z.number(),
  perYearCents: z.number(),
  weekdayDaysPerYear: z.number(),
  weekendDaysPerYear: z.number(),
  holidayDaysPerYear: z.number(),
  altTransponderMonthCents: z.number(),
  transponderSavingsMonthCents: z.number(),
});
export type CommuteEstimate = z.infer<typeof CommuteEstimateSchema>;

export const NearbyAlternativeSchema = z.object({
  role: z.enum(["entry", "exit"]),
  interchange: InterchangeSchema,
  estimate: CommuteEstimateSchema,
  deltaMonthCents: z.number(),
  deltaDistanceKm: z.number(),
});
export type NearbyAlternative = z.infer<typeof NearbyAlternativeSchema>;

export const NearbyComparisonSchema = z.object({
  alternatives: z.array(NearbyAlternativeSchema),
});
export type NearbyComparison = z.infer<typeof NearbyComparisonSchema>;

export type WeekdayRateKey = `weekday:${Direction}:${WeekdaySlot}:${Zone}`;
export type WeekendRateKey = `weekend_or_holiday:${Direction}:${WeekendSlot}:${Zone}`;
export type RateKey = WeekdayRateKey | WeekendRateKey;
