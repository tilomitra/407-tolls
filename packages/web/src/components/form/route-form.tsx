"use client";

import { useState } from "react";
import type { TollResponse, Direction, ResolvedTimeSlot, Zone, DayType, WeekdaySlot, WeekendSlot } from "@407-etr/core";
import { Card, CardBody } from "../ui/card";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle";
import { RadioGroup } from "../ui/radio-group";

const INTERCHANGES: Array<{ id: string; name: string; zone: Zone }> = [
  { id: "qew", name: "QEW / Highway 403", zone: 1 },
  { id: "appleby", name: "Appleby Line", zone: 2 },
  { id: "bronte", name: "Bronte Road", zone: 2 },
  { id: "neyagawa", name: "Neyagawa Boulevard", zone: 3 },
  { id: "trafalgar", name: "Trafalgar Road", zone: 3 },
  { id: "hwy403", name: "Highway 403", zone: 4 },
  { id: "winston-churchill", name: "Winston Churchill Blvd", zone: 4 },
  { id: "erin-mills", name: "Erin Mills Parkway", zone: 4 },
  { id: "mississauga-rd", name: "Mississauga Road", zone: 4 },
  { id: "creditview", name: "Creditview Road", zone: 5 },
  { id: "mavis", name: "Mavis Road", zone: 5 },
  { id: "hurontario", name: "Hurontario Street", zone: 5 },
  { id: "hwy410", name: "Highway 410", zone: 6 },
  { id: "dixie", name: "Dixie Road", zone: 6 },
  { id: "bramalea", name: "Bramalea Road", zone: 6 },
  { id: "airport", name: "Airport Road", zone: 6 },
  { id: "goreway", name: "Goreway Drive", zone: 6 },
  { id: "hwy427", name: "Highway 427", zone: 7 },
  { id: "hwy27", name: "Highway 27", zone: 7 },
  { id: "pine-valley", name: "Pine Valley Drive", zone: 7 },
  { id: "weston", name: "Weston Road", zone: 7 },
  { id: "hwy400", name: "Highway 400", zone: 8 },
  { id: "jane", name: "Jane Street", zone: 8 },
  { id: "keele", name: "Keele Street", zone: 8 },
  { id: "dufferin", name: "Dufferin Street", zone: 8 },
  { id: "bathurst", name: "Bathurst Street", zone: 8 },
  { id: "yonge", name: "Yonge Street", zone: 9 },
  { id: "bayview", name: "Bayview Avenue", zone: 9 },
  { id: "leslie", name: "Leslie Street", zone: 9 },
  { id: "hwy404", name: "Highway 404", zone: 10 },
  { id: "woodbine", name: "Woodbine Avenue", zone: 10 },
  { id: "warden", name: "Warden Avenue", zone: 10 },
  { id: "kennedy", name: "Kennedy Road", zone: 10 },
  { id: "mccowan", name: "McCowan Road", zone: 11 },
  { id: "markham", name: "Markham Road", zone: 11 },
  { id: "ninth-line", name: "Hwy 48 / Ninth Line", zone: 11 },
  { id: "donald-cousens", name: "Donald Cousens Pkwy", zone: 11 },
  { id: "york-durham", name: "York-Durham Line", zone: 12 },
  { id: "whites", name: "Whites Road", zone: 12 },
  { id: "brock", name: "Brock Road", zone: 12 },
];

const INTERCHANGE_OPTIONS = INTERCHANGES.map((ic) => ({
  value: ic.id,
  label: ic.name,
  detail: `Zone ${ic.zone}`,
}));

const WEEKDAY_TIME_OPTIONS = [
  { value: "5am", label: "5:00 – 6:59 AM" },
  { value: "7am", label: "7:00 – 9:29 AM (AM peak)" },
  { value: "930am", label: "9:30 – 10:29 AM" },
  { value: "1030am", label: "10:30 AM – 2:29 PM" },
  { value: "230pm", label: "2:30 – 3:29 PM" },
  { value: "330pm", label: "3:30 – 5:59 PM (PM peak)" },
  { value: "6pm", label: "6:00 – 8:59 PM" },
  { value: "9pm", label: "9:00 PM – 4:59 AM (overnight)" },
];

const WEEKEND_TIME_OPTIONS = [
  { value: "830am", label: "8:30 – 9:59 AM" },
  { value: "10am", label: "10:00 AM – 6:59 PM" },
  { value: "7pm", label: "7:00 – 8:59 PM" },
  { value: "9pm", label: "9:00 PM – 8:29 AM (overnight)" },
];

const WEEKDAY_BOUNDARIES: Array<[number, WeekdaySlot]> = [
  [300, "5am"], [420, "7am"], [570, "930am"], [630, "1030am"],
  [870, "230pm"], [930, "330pm"], [1080, "6pm"], [1260, "9pm"],
];

const WEEKEND_BOUNDARIES: Array<[number, WeekendSlot]> = [
  [510, "830am"], [600, "10am"], [1140, "7pm"], [1260, "9pm"],
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

export function RouteForm({
  onTollResult,
}: {
  onTollResult: (args: { result: TollResponse; entryId: string; exitId: string }) => void;
}) {
  const currentSlot = resolveCurrentSlot();

  const [entryId, setEntryId] = useState("jane");
  const [exitId, setExitId] = useState("hwy404");
  const [hasTransponder, setHasTransponder] = useState(true);
  const [timeMode, setTimeMode] = useState<"now" | "custom">("now");
  const [dayType, setDayType] = useState<DayType>(currentSlot.dayType);
  const [weekdaySlot, setWeekdaySlot] = useState<WeekdaySlot>(
    currentSlot.dayType === "weekday" ? currentSlot.slot as WeekdaySlot : "7am",
  );
  const [weekendSlot, setWeekendSlot] = useState<WeekendSlot>(
    currentSlot.dayType === "weekend_or_holiday" ? currentSlot.slot as WeekendSlot : "10am",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entry = INTERCHANGES.find((ic) => ic.id === entryId)!;
  const exit = INTERCHANGES.find((ic) => ic.id === exitId)!;
  const sameInterchange = entryId === exitId;

  function getTimeSlot(): ResolvedTimeSlot {
    if (timeMode === "now") {
      const c = resolveCurrentSlot();
      return c.dayType === "weekday"
        ? { dayType: "weekday", slot: c.slot as WeekdaySlot }
        : { dayType: "weekend_or_holiday", slot: c.slot as WeekendSlot };
    }
    return dayType === "weekday"
      ? { dayType: "weekday", slot: weekdaySlot }
      : { dayType: "weekend_or_holiday", slot: weekendSlot };
  }

  function getTimeLabel(): string {
    const ts = getTimeSlot();
    const options = ts.dayType === "weekday" ? WEEKDAY_TIME_OPTIONS : WEEKEND_TIME_OPTIONS;
    const match = options.find((o) => o.value === ts.slot);
    const prefix = ts.dayType === "weekday" ? "Weekday" : "Weekend";
    return `${prefix} ${match?.label ?? ts.slot}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const direction: Direction =
      exit.zone > entry.zone ||
      (exit.zone === entry.zone && INTERCHANGES.indexOf(exit) > INTERCHANGES.indexOf(entry))
        ? "eastbound"
        : "westbound";

    try {
      const res = await fetch("/api/toll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          exitId,
          direction,
          timeSlot: getTimeSlot(),
          hasTransponder,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.error === "string" ? data.error : "Request failed");
      }

      onTollResult({ result: await res.json(), entryId, exitId });
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
          <div className="relative">
            <div className="rounded-xl border border-slate-200">
              <div className="px-3 pb-2 pt-3">
                <span className="mb-1 block text-xs font-medium text-slate-500">Enter at</span>
                <select
                  value={entryId}
                  onChange={(e) => setEntryId(e.target.value)}
                  className="block w-full appearance-none bg-transparent text-sm text-slate-900 focus:outline-none"
                >
                  {INTERCHANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}{opt.detail ? ` — ${opt.detail}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100" />

              <div className="px-3 pb-3 pt-2">
                <span className="mb-1 block text-xs font-medium text-slate-500">Exit at</span>
                <select
                  value={exitId}
                  onChange={(e) => setExitId(e.target.value)}
                  className="block w-full appearance-none bg-transparent text-sm text-slate-900 focus:outline-none"
                >
                  {INTERCHANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}{opt.detail ? ` — ${opt.detail}` : ""}
                    </option>
                  ))}
                </select>
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

          <div className="space-y-3">
            <span className="block text-sm font-medium text-slate-700">When</span>
            <RadioGroup
              value={timeMode}
              onChange={(v) => setTimeMode(v as "now" | "custom")}
              options={[
                { value: "now", label: "Now" },
                { value: "custom", label: "Pick a time" },
              ]}
            />

            {timeMode === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Day"
                  value={dayType}
                  onChange={(v) => setDayType(v as DayType)}
                  options={[
                    { value: "weekday", label: "Weekday" },
                    { value: "weekend_or_holiday", label: "Weekend / Holiday" },
                  ]}
                />
                <Select
                  label="Time"
                  value={dayType === "weekday" ? weekdaySlot : weekendSlot}
                  onChange={(v) => {
                    if (dayType === "weekday") setWeekdaySlot(v as WeekdaySlot);
                    else setWeekendSlot(v as WeekendSlot);
                  }}
                  options={dayType === "weekday" ? WEEKDAY_TIME_OPTIONS : WEEKEND_TIME_OPTIONS}
                />
              </div>
            )}

            <p className="text-xs text-slate-400">{getTimeLabel()}</p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <Toggle
              checked={hasTransponder}
              onChange={setHasTransponder}
              label="I have a transponder"
              detail={!hasTransponder ? "+$4.35 camera charge" : undefined}
            />
          </div>

          <Button
            type="submit"
            disabled={sameInterchange}
            loading={loading}
            className="w-full"
          >
            Calculate Toll
          </Button>

          {sameInterchange && (
            <p className="text-center text-xs text-amber-600">
              Entry and exit must be different interchanges.
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
