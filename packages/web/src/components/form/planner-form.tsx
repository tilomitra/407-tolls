"use client";

import { useState } from "react";
import type {
  DayType,
  ResolvedTimeSlot,
  VehicleClassId,
  WeekdaySlot,
  WeekendSlot,
} from "@407-tolls/core";
import { getVehicleClass } from "@407-tolls/core";
import { Card, CardBody } from "../ui/card";
import { StyledSelect } from "../ui/styled-select";
import { Toggle } from "../ui/toggle";
import { VehicleClassSelector } from "./vehicle-class-selector";
import { AddressAutocomplete, type ResolvedAddress } from "./address-autocomplete";
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

function resolveCurrentSlot(): ResolvedTimeSlot {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;

  if (day === 0 || day === 6) {
    // Weekend
    let slot: WeekendSlot;
    if (mins >= 8 * 60 + 30 && mins < 10 * 60) slot = "830am";
    else if (mins >= 10 * 60 && mins < 19 * 60) slot = "10am";
    else if (mins >= 19 * 60 && mins < 21 * 60) slot = "7pm";
    else slot = "9pm";
    return { dayType: "weekend_or_holiday", slot };
  } else {
    // Weekday
    let slot: WeekdaySlot;
    if (mins >= 5 * 60 && mins < 7 * 60) slot = "5am";
    else if (mins >= 7 * 60 && mins < 9 * 60 + 30) slot = "7am";
    else if (mins >= 9 * 60 + 30 && mins < 10 * 60 + 30) slot = "930am";
    else if (mins >= 10 * 60 + 30 && mins < 14 * 60 + 30) slot = "1030am";
    else if (mins >= 14 * 60 + 30 && mins < 15 * 60 + 30) slot = "230pm";
    else if (mins >= 15 * 60 + 30 && mins < 18 * 60) slot = "330pm";
    else if (mins >= 18 * 60 && mins < 21 * 60) slot = "6pm";
    else slot = "9pm";
    return { dayType: "weekday", slot };
  }
}

export interface PlannerFormValues {
  origin: ResolvedAddress;
  destination: ResolvedAddress;
  timeSlot: ResolvedTimeSlot;
  vehicleClassId: VehicleClassId;
  hasTransponder: boolean;
}

export function PlannerForm({
  onSubmit,
  loading,
}: {
  onSubmit: (values: PlannerFormValues) => void;
  loading: boolean;
}) {
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<ResolvedAddress | null>(null);
  const [destination, setDestination] = useState<ResolvedAddress | null>(null);

  const [vehicleClassId, setVehicleClassId] = useLocalStorage<VehicleClassId>(
    "407-vehicle-class",
    "light",
  );
  const [hasTransponder, setHasTransponder] = useLocalStorage("407-transponder", true);
  const [timing, setTiming] = useState<"now" | "later">("now");
  const [dayType, setDayType] = useState<DayType>("weekday");
  const [weekdaySlot, setWeekdaySlot] = useState<WeekdaySlot>("7am");
  const [weekendSlot, setWeekendSlot] = useState<WeekendSlot>("10am");

  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const ready = origin && destination;

  function buildTimeSlot(): ResolvedTimeSlot {
    if (timing === "now") return resolveCurrentSlot();
    return dayType === "weekday"
      ? { dayType: "weekday", slot: weekdaySlot }
      : { dayType: "weekend_or_holiday", slot: weekendSlot };
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-5 flex items-center justify-between">
          <span className="text-amex-eyebrow">Itinerary</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-faint">
            Member · 407
          </span>
        </div>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            onSubmit({
              origin: origin!,
              destination: destination!,
              timeSlot: buildTimeSlot(),
              vehicleClassId,
              hasTransponder,
            });
          }}
        >
          <VehicleClassSelector value={vehicleClassId} onChange={setVehicleClassId} />

          <div className="relative border border-amex-line-hi p-3">
            <div className="space-y-3">
              <AddressAutocomplete
                label="From"
                placeholder="Origin address"
                value={originText}
                onChange={setOriginText}
                onResolved={(r) => setOrigin(r)}
                allowCurrentLocation
              />
              <AddressAutocomplete
                label="To"
                placeholder="Destination address"
                value={destinationText}
                onChange={setDestinationText}
                onResolved={(r) => setDestination(r)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setOriginText(destinationText);
                setDestinationText(originText);
                setOrigin(destination);
                setDestination(origin);
              }}
              title="Swap origin and destination"
              className="absolute right-3 top-1/2 -translate-y-1/2 border border-amex-gold-deep bg-amex-ink p-1.5 text-amex-gold-lo transition-colors hover:border-amex-gold hover:text-amex-gold-hi"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0 .04 1.06l2.1 1.95H6.75a.75.75 0 0 0 0 1.5h8.59l-2.1 1.95a.75.75 0 1 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 0 0-1.06.04Zm-6.4 8a.75.75 0 0 0-1.06-.04l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h8.59a.75.75 0 0 0 0-1.5H4.66l2.1-1.95a.75.75 0 0 0 .04-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Timing toggle */}
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["now", "later"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTiming(opt)}
                  className={`
                    border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors
                    ${timing === opt
                      ? "border-amex-gold bg-amex-gold-mist text-amex-gold-hi"
                      : "border-amex-line-hi bg-amex-ink text-amex-text-dim hover:border-amex-gold-lo"
                    }
                  `}
                >
                  {opt === "now" ? "Depart Now" : "Schedule"}
                </button>
              ))}
            </div>

            {timing === "later" && (
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
            )}
          </div>

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

          <button
            type="submit"
            disabled={!ready || loading}
            className="
              relative flex w-full items-center justify-center gap-2 border border-amex-gold bg-amex-gold px-4 py-3
              text-[11px] font-semibold uppercase tracking-[0.28em] text-amex-black transition-all
              hover:bg-amex-gold-hi hover:border-amex-gold-hi
              disabled:cursor-not-allowed disabled:border-amex-line-hi disabled:bg-amex-elev disabled:text-amex-text-faint
            "
          >
            {loading && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {loading ? "Calculating" : "Compare Routes"}
          </button>

          {!ready && (originText || destinationText) && (
            <p className="text-center text-[10px] uppercase tracking-[0.18em] text-amex-text-mute">
              Select an address from the dropdown to continue
            </p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
