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
  const [dayType, setDayType] = useState<DayType>("weekday");
  const [weekdaySlot, setWeekdaySlot] = useState<WeekdaySlot>("7am");
  const [weekendSlot, setWeekendSlot] = useState<WeekendSlot>("10am");

  const vehicleClass = getVehicleClass({ id: vehicleClassId });
  const ready = origin && destination;

  function buildTimeSlot(): ResolvedTimeSlot {
    return dayType === "weekday"
      ? { dayType: "weekday", slot: weekdaySlot }
      : { dayType: "weekend_or_holiday", slot: weekendSlot };
  }

  return (
    <Card>
      <CardBody>
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

          <div className="space-y-3 rounded-xl border border-slate-200 p-3">
            <AddressAutocomplete
              label="From"
              placeholder="Origin address"
              value={originText}
              onChange={setOriginText}
              onResolved={(r) => setOrigin(r)}
            />
            <AddressAutocomplete
              label="To"
              placeholder="Destination address"
              value={destinationText}
              onChange={setDestinationText}
              onResolved={(r) => setDestination(r)}
            />
          </div>

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

          {vehicleClass.hasTransponderOption && (
            <div className="border-t border-slate-100 pt-4">
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
              flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5
              text-sm font-medium text-white shadow-sm transition-colors
              hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400
            "
          >
            {loading ? "Calculating routes…" : "Compare routes"}
          </button>

          {!ready && (originText || destinationText) && (
            <p className="text-center text-xs text-slate-400">
              Pick an address from the dropdown to continue.
            </p>
          )}
        </form>
      </CardBody>
    </Card>
  );
}
