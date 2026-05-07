"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type {
  TollResponse,
  CommuteEstimate,
  NearbyComparison,
  DayOfWeek,
  Interchange,
  ResolvedTimeSlot,
  DayType,
  TripType,
  VehicleClassId,
  WeekdaySlot,
  WeekendSlot,
} from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
import { Card, CardBody } from "../ui/card";
import { SearchableSelect } from "../ui/searchable-select";
import { StyledSelect } from "../ui/styled-select";
import { Toggle } from "../ui/toggle";
import { RadioGroup } from "../ui/radio-group";
import { VehicleClassSelector } from "./vehicle-class-selector";
import {
  calculateToll,
  computeAllTimeSlotCosts,
  computeCommuteEstimate,
  computeNearbyComparison,
} from "@407-tolls/core";
import { useLocalStorage } from "@/lib/use-local-storage";
import { buildRouteInput } from "@/lib/load-toll-points";

const WEEKDAY_TIME_OPTIONS = [
  { value: "5am", label: "5:00am - 7:00am" },
  { value: "7am", label: "7:00am - 9:30am" },
  { value: "930am", label: "9:30am - 10:30am" },
  { value: "1030am", label: "10:30am - 2:30pm" },
  { value: "230pm", label: "2:30pm - 3:30pm" },
  { value: "330pm", label: "3:30pm - 6:00pm" },
  { value: "6pm", label: "6:00pm - 9:00pm" },
  { value: "9pm", label: "9:00pm - 5:00am" },
];

const WEEKEND_TIME_OPTIONS = [
  { value: "830am", label: "8:30am - 10:00am" },
  { value: "10am", label: "10:00am - 7:00pm" },
  { value: "7pm", label: "7:00pm - 9:00pm" },
  { value: "9pm", label: "9:00pm - 8:30am" },
];

const WEEKDAY_BOUNDARIES: Array<[number, WeekdaySlot]> = [
  [300, "5am"],
  [420, "7am"],
  [570, "930am"],
  [630, "1030am"],
  [870, "230pm"],
  [930, "330pm"],
  [1080, "6pm"],
  [1260, "9pm"],
];

const WEEKEND_BOUNDARIES: Array<[number, WeekendSlot]> = [
  [510, "830am"],
  [600, "10am"],
  [1140, "7pm"],
  [1260, "9pm"],
];

const ALL_DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

function resolveCurrentSlot(): { dayType: DayType; slot: string } {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isWeekend = day === 0 || day === 6;
  const boundaries = isWeekend ? WEEKEND_BOUNDARIES : WEEKDAY_BOUNDARIES;
  const dayType = isWeekend ? "weekend_or_holiday" : "weekday";

  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (minutes >= boundaries[i]![0]) {
      return {
        dayType,
        slot: boundaries[i]![1],
      };
    }
  }
  return { dayType, slot: "9pm" };
}

export type FormMode = "single" | "commute";

function DayPicker({
  selected,
  onChange,
}: {
  selected: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}) {
  function toggle(day: DayOfWeek) {
    if (selected.includes(day)) {
      if (selected.length === 1) return; // must have at least 1
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {ALL_DAYS.map((d, i) => {
        const active = selected.includes(d.value);
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(d.value)}
            className={`
              flex h-9 items-center justify-center text-[11px] font-semibold uppercase tracking-[0.16em]
              border transition-colors duration-150
              ${
                active
                  ? "border-amex-gold bg-amex-gold text-amex-black"
                  : "border-amex-line-hi bg-amex-ink text-amex-text-dim hover:border-amex-gold-lo hover:text-amex-gold-hi"
              }
            `}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

export function RouteForm({
  interchanges,
  entryId,
  exitId,
  onEntryChange,
  onExitChange,
  onTollResult,
  onCommuteResult,
  mode,
  onModeChange,
}: {
  interchanges: Interchange[];
  entryId: string;
  exitId: string;
  onEntryChange: (id: string) => void;
  onExitChange: (id: string) => void;
  onTollResult: (args: {
    result: TollResponse;
    entryId: string;
    exitId: string;
    vehicleClassId: VehicleClassId;
    hasTransponder: boolean;
  } | null, error?: string) => void;
  onCommuteResult: (args: {
    estimate: CommuteEstimate;
    nearby: NearbyComparison;
    entryId: string;
    exitId: string;
    entryName: string;
    exitName: string;
    vehicleClassId: VehicleClassId;
    tripType: TripType;
    commuteDays: DayOfWeek[];
    hasTransponder: boolean;
    shareParams: {
      goSlot: string;
      returnSlot?: string;
      weekendGoSlot: string;
      weekendReturnSlot?: string;
    };
  } | null, error?: string) => void;
  mode: FormMode;
  onModeChange: (mode: FormMode) => void;
}) {
  const interchangeOptions = useMemo(
    () =>
      interchanges.map((ic) => ({
        id: ic.id,
        label: ic.name,
        searchText: `${ic.name} zone ${ic.zone}`,
        zone: ic.zone,
        note: ic.note ?? null,
      })),
    [interchanges],
  );

  const renderInterchangeOption = (o: (typeof interchangeOptions)[number]) => (
    <>
      <div className="text-sm font-medium text-amex-text">{o.label}</div>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amex-text-mute">
        <span>Zone {o.zone}</span>
        {o.note && (
          <>
            <span className="h-2.5 w-px bg-amex-line-hi" />
            <span className="text-amex-amber">{o.note}</span>
          </>
        )}
      </div>
    </>
  );

  const currentSlot = resolveCurrentSlot();

  const [vehicleClassId, setVehicleClassId] = useLocalStorage<VehicleClassId>(
    "407-vehicle-class",
    "light",
  );
  const [hasTransponder, setHasTransponder] = useLocalStorage("407-transponder", true);
  const [dayType, setDayType] = useState<DayType>(currentSlot.dayType);
  const [weekdaySlot, setWeekdaySlot] = useState<WeekdaySlot>(
    currentSlot.dayType === "weekday" ? (currentSlot.slot as WeekdaySlot) : "7am",
  );
  const [weekendSlot, setWeekendSlot] = useState<WeekendSlot>(
    currentSlot.dayType === "weekend_or_holiday" ? (currentSlot.slot as WeekendSlot) : "10am",
  );

  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [commuteDays, setCommuteDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [goWeekdaySlot, setGoWeekdaySlot] = useState<WeekdaySlot>("7am");
  const [returnWeekdaySlot, setReturnWeekdaySlot] = useState<WeekdaySlot>("330pm");
  const [goWeekendSlot, setGoWeekendSlot] = useState<WeekendSlot>("10am");
  const [returnWeekendSlot, setReturnWeekendSlot] = useState<WeekendSlot>("7pm");

  const [error, setError] = useState<string | null>(null);

  const entry = useMemo(
    () => interchanges.find((ic) => ic.id === entryId)!,
    [interchanges, entryId],
  );
  const exit = useMemo(() => interchanges.find((ic) => ic.id === exitId)!, [interchanges, exitId]);
  const missingRoute = !entryId || !exitId;
  const sameInterchange = !missingRoute && entryId === exitId;
  const vehicleClass = getVehicleClass({ id: vehicleClassId });

  // Validate ramp access for the computed direction
  const direction: "eastbound" | "westbound" | null =
    entry && exit && !sameInterchange ? (exit.km > entry.km ? "eastbound" : "westbound") : null;

  const routeError = (() => {
    if (!direction || !entry || !exit) return null;
    const ramps =
      direction === "eastbound"
        ? { entry: entry.eastbound, exit: exit.eastbound }
        : { entry: entry.westbound, exit: exit.westbound };
    if (!ramps.entry.hasOnRamp)
      return entry.note ?? `${entry.name} does not have a ${direction} on-ramp.`;
    if (!ramps.exit.hasOffRamp)
      return exit.note ?? `${exit.name} does not have a ${direction} off-ramp.`;
    return null;
  })();

  const isRoundTrip = tripType === "round_trip";
  const hasWeekdayDays = commuteDays.some((d) => d >= 1 && d <= 5);
  const hasWeekendDays = commuteDays.includes(0) || commuteDays.includes(6);

  function getTimeSlot(): ResolvedTimeSlot {
    return dayType === "weekday"
      ? { dayType: "weekday", slot: weekdaySlot }
      : { dayType: "weekend_or_holiday", slot: weekendSlot };
  }

  function calculate() {
    if (missingRoute || sameInterchange || routeError) {
      const err = routeError ?? (sameInterchange ? "Entry and exit must be different" : undefined);
      onTollResult(null, err);
      onCommuteResult(null, err);
      return;
    }

    const resolved = buildRouteInput({ entryId, exitId, vehicleClassId, hasTransponder });
    if (!resolved.ok) {
      onTollResult(null, resolved.error);
      onCommuteResult(null, resolved.error);
      return;
    }

    setError(null);
    try {
      if (mode === "commute") {
        const schedule = isRoundTrip
          ? {
              tripType: "round_trip" as const,
              goTimeSlot: { dayType: "weekday" as const, slot: goWeekdaySlot },
              returnTimeSlot: { dayType: "weekday" as const, slot: returnWeekdaySlot },
              weekendGoTimeSlot: { dayType: "weekend_or_holiday" as const, slot: goWeekendSlot },
              weekendReturnTimeSlot: { dayType: "weekend_or_holiday" as const, slot: returnWeekendSlot },
              commuteDays,
            }
          : {
              tripType: "one_way" as const,
              goTimeSlot: { dayType: "weekday" as const, slot: goWeekdaySlot },
              weekendGoTimeSlot: { dayType: "weekend_or_holiday" as const, slot: goWeekendSlot },
              commuteDays,
            };

        const estimate = computeCommuteEstimate({ route: resolved.route, ...schedule });
        const nearby = computeNearbyComparison({
          entryInterchange: resolved.entry,
          exitInterchange: resolved.exit,
          interchanges,
          route: resolved.route,
          estimate,
          schedule,
        });

        onCommuteResult({
          estimate,
          nearby,
          entryId,
          exitId,
          entryName: entry.name,
          exitName: exit.name,
          vehicleClassId,
          tripType,
          commuteDays,
          hasTransponder,
          shareParams: {
            goSlot: goWeekdaySlot,
            ...(isRoundTrip ? { returnSlot: returnWeekdaySlot } : {}),
            weekendGoSlot: goWeekendSlot,
            ...(isRoundTrip ? { weekendReturnSlot: returnWeekendSlot } : {}),
          },
        });
      } else {
        const ts = getTimeSlot();
        const result = calculateToll({ ...resolved.route, timeSlot: ts });
        const byTimeSlot = computeAllTimeSlotCosts(resolved.route);
        onTollResult({
          result: { ...result, byTimeSlot },
          entryId,
          exitId,
          vehicleClassId,
          hasTransponder,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  // Recalculate whenever any input changes
  const calculateRef = useRef(calculate);
  calculateRef.current = calculate;

  useEffect(() => {
    calculateRef.current();
  }, [
    entryId, exitId, vehicleClassId, hasTransponder, mode,
    dayType, weekdaySlot, weekendSlot,
    tripType, commuteDays, goWeekdaySlot, returnWeekdaySlot,
    goWeekendSlot, returnWeekendSlot,
  ]);

  return (
    <Card>
      <CardBody>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <RadioGroup
              value={mode}
              onChange={(v) => onModeChange(v as FormMode)}
              options={[
                { value: "single", label: "Trip" },
                { value: "commute", label: "Commute" },
              ]}
            />
            {mode === "commute" && (
              <RadioGroup
                value={tripType}
                onChange={(v) => setTripType(v as TripType)}
                options={[
                  {
                    value: "round_trip",
                    label: "Return",
                    icon: (
                      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 5.5a.5.5 0 0 1 .5-.5h11.793l-2.147-2.146a.5.5 0 0 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L13.293 6H1.5a.5.5 0 0 1-.5-.5zm14 5a.5.5 0 0 1-.5.5H2.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L2.707 10H14.5a.5.5 0 0 1 .5.5z" />
                      </svg>
                    ),
                  },
                  {
                    value: "one_way",
                    label: "One way",
                    icon: (
                      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"
                        />
                      </svg>
                    ),
                  },
                ]}
              />
            )}
          </div>

          <VehicleClassSelector value={vehicleClassId} onChange={setVehicleClassId} />

          <div className="relative">
            <div className="border border-amex-line-hi">
              <div className="px-3 pb-2 pt-3">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
                  Enter at
                </span>
                <SearchableSelect
                  options={interchangeOptions}
                  value={entryId}
                  onChange={onEntryChange}
                  placeholder="Search interchanges..."
                  renderOption={renderInterchangeOption}
                />
              </div>

              <div className="border-t border-amex-line" />

              <div className="px-3 pb-3 pt-2">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
                  Exit at
                </span>
                <SearchableSelect
                  options={interchangeOptions}
                  value={exitId}
                  onChange={onExitChange}
                  placeholder="Search interchanges..."
                  renderOption={renderInterchangeOption}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onEntryChange(exitId);
                onExitChange(entryId);
              }}
              aria-label="Swap entry and exit"
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                flex h-9 w-9 items-center justify-center
                border border-amex-gold-deep bg-amex-ink
                transition-all duration-150
                hover:border-amex-gold hover:text-amex-gold-hi
                active:scale-90
              "
            >
              <svg
                className="h-4 w-4 text-amex-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {mode === "single" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StyledSelect
                  label="Day"
                  value={dayType}
                  onChange={(v) => setDayType(v as DayType)}
                  options={[
                    { value: "weekday", label: "Weekday" },
                    { value: "weekend_or_holiday", label: "Weekend / Holiday" },
                  ]}
                />
                <StyledSelect
                  label="Time"
                  value={dayType === "weekday" ? weekdaySlot : weekendSlot}
                  onChange={(v) => {
                    if (dayType === "weekday") setWeekdaySlot(v as WeekdaySlot);
                    else setWeekendSlot(v as WeekendSlot);
                  }}
                  options={dayType === "weekday" ? WEEKDAY_TIME_OPTIONS : WEEKEND_TIME_OPTIONS}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <span className="block text-amex-eyebrow">Days</span>
                <DayPicker selected={commuteDays} onChange={setCommuteDays} />
              </div>

              {hasWeekdayDays && (
                <div className="space-y-3">
                  <span className="block text-amex-eyebrow">Weekday schedule</span>
                  <div className={`grid gap-3 ${isRoundTrip ? "grid-cols-2" : "grid-cols-1"}`}>
                    <StyledSelect
                      label="Departure"
                      value={goWeekdaySlot}
                      onChange={(v) => setGoWeekdaySlot(v as WeekdaySlot)}
                      options={WEEKDAY_TIME_OPTIONS}
                    />
                    {isRoundTrip && (
                      <StyledSelect
                        label="Return"
                        value={returnWeekdaySlot}
                        onChange={(v) => setReturnWeekdaySlot(v as WeekdaySlot)}
                        options={WEEKDAY_TIME_OPTIONS}
                      />
                    )}
                  </div>
                </div>
              )}

              {hasWeekendDays && (
                <div className="space-y-3">
                  <span className="block text-amex-eyebrow">Weekend schedule</span>
                  <div className={`grid gap-3 ${isRoundTrip ? "grid-cols-2" : "grid-cols-1"}`}>
                    <StyledSelect
                      label="Departure"
                      value={goWeekendSlot}
                      onChange={(v) => setGoWeekendSlot(v as WeekendSlot)}
                      options={WEEKEND_TIME_OPTIONS}
                    />
                    {isRoundTrip && (
                      <StyledSelect
                        label="Return"
                        value={returnWeekendSlot}
                        onChange={(v) => setReturnWeekendSlot(v as WeekendSlot)}
                        options={WEEKEND_TIME_OPTIONS}
                      />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {vehicleClass.hasTransponderOption && (
            <div className="border-t border-amex-line pt-4">
              <Toggle
                checked={hasTransponder}
                onChange={setHasTransponder}
                label="I have a transponder"
                detail={
                  !hasTransponder
                    ? `+${(vehicleClass.cameraChargeCents / 100).toFixed(2)} camera charge per trip`
                    : undefined
                }
              />
            </div>
          )}

          {sameInterchange && (
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-amex-amber">
              Entry and exit must be different interchanges
            </p>
          )}

          {routeError && !sameInterchange && (
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-amex-amber">{routeError}</p>
          )}

          {error && (
            <div className="border border-[color:var(--color-amex-ruby)]/40 bg-amex-ruby-deep/40 px-4 py-3 text-sm text-amex-ruby">{error}</div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
