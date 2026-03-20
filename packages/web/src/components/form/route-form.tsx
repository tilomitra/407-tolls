"use client";

import { useState, useMemo } from "react";
import type { TollResponse, CommuteEstimate, DayOfWeek, Interchange, ResolvedTimeSlot, DayType, WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { Card, CardBody } from "../ui/card";
import { SearchableSelect } from "../ui/searchable-select";
import { StyledSelect } from "../ui/styled-select";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import { RadioGroup } from "../ui/radio-group";
import { useLocalStorage } from "@/lib/use-local-storage";

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
  [300, "5am"], [420, "7am"], [570, "930am"], [630, "1030am"],
  [870, "230pm"], [930, "330pm"], [1080, "6pm"], [1260, "9pm"],
];

const WEEKEND_BOUNDARIES: Array<[number, WeekendSlot]> = [
  [510, "830am"], [600, "10am"], [1140, "7pm"], [1260, "9pm"],
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

  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (minutes >= boundaries[i]![0]) {
      return {
        dayType: isWeekend ? "weekend_or_holiday" : "weekday",
        slot: boundaries[i]![1],
      };
    }
  }
  return { dayType: isWeekend ? "weekend_or_holiday" : "weekday", slot: "9pm" };
}

export type FormMode = "single" | "commute";

function DayPicker({ selected, onChange }: { selected: DayOfWeek[]; onChange: (days: DayOfWeek[]) => void }) {
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
              flex h-9 items-center justify-center rounded-lg text-xs font-medium
              transition-colors duration-150
              ${active
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
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
  onTollResult,
  onCommuteResult,
  mode,
  onModeChange,
}: {
  interchanges: Interchange[];
  onTollResult: (args: { result: TollResponse; entryId: string; exitId: string }) => void;
  onCommuteResult: (args: { result: CommuteEstimate; entryId: string; exitId: string; entryName: string; exitName: string; commuteDays: DayOfWeek[]; hasTransponder: boolean; shareParams: { goSlot: string; returnSlot: string; weekendGoSlot: string; weekendReturnSlot: string } }) => void;
  mode: FormMode;
  onModeChange: (mode: FormMode) => void;
}) {
  const interchangeOptions = useMemo(() => interchanges.map((ic) => ({
    id: ic.id,
    label: ic.name,
    searchText: `${ic.name} zone ${ic.zone}`,
    zone: ic.zone,
    note: ic.note ?? null,
  })), [interchanges]);

  const renderInterchangeOption = (o: typeof interchangeOptions[number]) => (
    <>
      <div className="text-sm font-medium text-slate-900">{o.label}</div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Zone {o.zone}</span>
        {o.note && (
          <>
            <span className="h-2.5 w-px bg-slate-200" />
            <span className="text-amber-500">{o.note}</span>
          </>
        )}
      </div>
    </>
  );

  const currentSlot = resolveCurrentSlot();

  // Default to Jane Street (25) and Highway 404 (33)
  const [entryId, setEntryId] = useLocalStorage("407-entry", interchanges.length > 0 ? "25" : "");
  const [exitId, setExitId] = useLocalStorage("407-exit", interchanges.length > 0 ? "33" : "");
  const [hasTransponder, setHasTransponder] = useLocalStorage("407-transponder", true);
  const [dayType, setDayType] = useState<DayType>(currentSlot.dayType);
  const [weekdaySlot, setWeekdaySlot] = useState<WeekdaySlot>(
    currentSlot.dayType === "weekday" ? currentSlot.slot as WeekdaySlot : "7am",
  );
  const [weekendSlot, setWeekendSlot] = useState<WeekendSlot>(
    currentSlot.dayType === "weekend_or_holiday" ? currentSlot.slot as WeekendSlot : "10am",
  );

  // Commute-specific state
  const [commuteDays, setCommuteDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [goWeekdaySlot, setGoWeekdaySlot] = useState<WeekdaySlot>("7am");
  const [returnWeekdaySlot, setReturnWeekdaySlot] = useState<WeekdaySlot>("330pm");
  const [goWeekendSlot, setGoWeekendSlot] = useState<WeekendSlot>("10am");
  const [returnWeekendSlot, setReturnWeekendSlot] = useState<WeekendSlot>("7pm");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entry = useMemo(() => interchanges.find((ic) => ic.id === entryId)!, [interchanges, entryId]);
  const exit = useMemo(() => interchanges.find((ic) => ic.id === exitId)!, [interchanges, exitId]);
  const sameInterchange = entryId === exitId;

  // Validate ramp access for the computed direction
  const direction: "eastbound" | "westbound" | null = entry && exit && !sameInterchange
    ? (exit.km > entry.km ? "eastbound" : "westbound")
    : null;

  const routeError = (() => {
    if (!direction || !entry || !exit) return null;
    const ramps = direction === "eastbound"
      ? { entry: entry.eastbound, exit: exit.eastbound }
      : { entry: entry.westbound, exit: exit.westbound };
    if (!ramps.entry.hasOnRamp) return entry.note ?? `${entry.name} does not have a ${direction} on-ramp.`;
    if (!ramps.exit.hasOffRamp) return exit.note ?? `${exit.name} does not have a ${direction} off-ramp.`;
    return null;
  })();

  const hasWeekendDays = commuteDays.includes(0) || commuteDays.includes(6);

  function getTimeSlot(): ResolvedTimeSlot {
    return dayType === "weekday"
      ? { dayType: "weekday", slot: weekdaySlot }
      : { dayType: "weekend_or_holiday", slot: weekendSlot };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "commute") {
        const params = new URLSearchParams({
          entry: entryId,
          exit: exitId,
          days: commuteDays.join(","),
          departure: goWeekdaySlot,
          return: returnWeekdaySlot,
          weekendDeparture: goWeekendSlot,
          weekendReturn: returnWeekendSlot,
          transponder: String(hasTransponder),
        });

        const res = await fetch(`/api/commute?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(typeof data.error === "string" ? data.error : "Request failed");
        }

        onCommuteResult({
          result: await res.json(),
          entryId,
          exitId,
          entryName: entry.name,
          exitName: exit.name,
          commuteDays,
          hasTransponder,
          shareParams: {
            goSlot: goWeekdaySlot,
            returnSlot: returnWeekdaySlot,
            weekendGoSlot: goWeekendSlot,
            weekendReturnSlot: returnWeekendSlot,
          },
        });
      } else {
        const ts = getTimeSlot();
        const params = new URLSearchParams({
          entry: entryId,
          exit: exitId,
          day: ts.dayType === "weekday" ? "weekday" : "weekend",
          slot: ts.slot,
          transponder: String(hasTransponder),
        });

        const res = await fetch(`/api/toll?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(typeof data.error === "string" ? data.error : "Request failed");
        }

        onTollResult({ result: await res.json(), entryId, exitId });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-5">
          <RadioGroup
            value={mode}
            onChange={(v) => onModeChange(v as FormMode)}
            options={[
              { value: "single", label: "Single Trip" },
              { value: "commute", label: "Commute" },
            ]}
          />

          <div className="relative">
            <div className="rounded-xl border border-slate-200">
              <div className="px-3 pb-2 pt-3">
                <span className="mb-1 block text-xs font-medium text-slate-500">Enter at</span>
                <SearchableSelect
                  options={interchangeOptions}
                  value={entryId}
                  onChange={setEntryId}
                  placeholder="Search interchanges..."
                  renderOption={renderInterchangeOption}
                />
              </div>

              <div className="border-t border-slate-100" />

              <div className="px-3 pb-3 pt-2">
                <span className="mb-1 block text-xs font-medium text-slate-500">Exit at</span>
                <SearchableSelect
                  options={interchangeOptions}
                  value={exitId}
                  onChange={setExitId}
                  placeholder="Search interchanges..."
                  renderOption={renderInterchangeOption}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setEntryId(exitId); setExitId(entryId); }}
              aria-label="Swap entry and exit"
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                flex h-9 w-9 items-center justify-center
                rounded-full border border-slate-200 bg-white
                shadow-sm transition-all duration-150
                hover:border-slate-300 hover:shadow-md
                active:scale-90
              "
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
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
                <span className="block text-sm font-medium text-slate-700">Days</span>
                <DayPicker selected={commuteDays} onChange={setCommuteDays} />
              </div>

              <div className="space-y-3">
                <span className="block text-sm font-medium text-slate-700">Weekday schedule</span>
                <div className="grid grid-cols-2 gap-3">
                  <StyledSelect
                    label="Departure"
                    value={goWeekdaySlot}
                    onChange={(v) => setGoWeekdaySlot(v as WeekdaySlot)}
                    options={WEEKDAY_TIME_OPTIONS}
                  />
                  <StyledSelect
                    label="Return"
                    value={returnWeekdaySlot}
                    onChange={(v) => setReturnWeekdaySlot(v as WeekdaySlot)}
                    options={WEEKDAY_TIME_OPTIONS}
                  />
                </div>
              </div>

              {hasWeekendDays && (
                <div className="space-y-3">
                  <span className="block text-sm font-medium text-slate-700">Weekend schedule</span>
                  <div className="grid grid-cols-2 gap-3">
                    <StyledSelect
                      label="Departure"
                      value={goWeekendSlot}
                      onChange={(v) => setGoWeekendSlot(v as WeekendSlot)}
                      options={WEEKEND_TIME_OPTIONS}
                    />
                    <StyledSelect
                      label="Return"
                      value={returnWeekendSlot}
                      onChange={(v) => setReturnWeekendSlot(v as WeekendSlot)}
                      options={WEEKEND_TIME_OPTIONS}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="border-t border-slate-100 pt-4">
            <Toggle
              checked={hasTransponder}
              onChange={setHasTransponder}
              label="I have a transponder"
              detail={!hasTransponder ? "+$5.30 camera charge per trip" : undefined}
            />
          </div>

          <Button
            type="submit"
            disabled={sameInterchange || !!routeError}
            loading={loading}
            className="w-full"
          >
            {mode === "commute" ? "Estimate Commute" : "Calculate Toll"}
          </Button>

          {sameInterchange && (
            <p className="text-center text-xs text-amber-600">
              Entry and exit must be different interchanges.
            </p>
          )}

          {routeError && !sameInterchange && (
            <p className="text-center text-xs text-amber-600">
              {routeError}
            </p>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
