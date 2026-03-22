"use client";

import type { VehicleClassId, VehicleClass } from "@407-etr/core";
import { VEHICLE_CLASSES } from "@407-etr/core";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

const vehicleIcons: Record<VehicleClassId, React.ReactNode> = {
  motorcycle: (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M9 17h6" />
      <path d="M5 14l4-7h4l3 5" />
      <path d="M16 12l3 5" />
      <path d="M9 7l-1 3" />
    </svg>
  ),
  light: (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a2 2 0 100 4 2 2 0 000-4zm14 0a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  medium: (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M18 11h2a2 2 0 012 2v2a2 2 0 01-2 2h-2" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="14" cy="17" r="2" />
    </svg>
  ),
  heavy_single: (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="6" width="15" height="11" rx="1" />
      <path d="M16 9h4l3 4v4h-7V9z" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="20" cy="17" r="2" />
    </svg>
  ),
  heavy_multi: (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="8" width="10" height="9" rx="1" />
      <path d="M11 11h4l3 3v3h-7V11z" />
      <rect x="18" y="8" width="5" height="9" rx="1" />
      <circle cx="5" cy="17" r="2" />
      <circle cx="15" cy="17" r="2" />
      <circle cx="21" cy="17" r="2" />
    </svg>
  ),
};

function VehicleOption({
  vehicleClass,
  selected,
  onSelect,
}: {
  vehicleClass: VehicleClass;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Tooltip
      content={
        <div>
          <p className="font-medium text-slate-900">{vehicleClass.name}</p>
          <p className="mt-0.5">{vehicleClass.description}</p>
        </div>
      }
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all duration-150 ${
          selected
            ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
            : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        }`}
      >
        {vehicleIcons[vehicleClass.id]}
        <span className="text-[10px] font-medium leading-tight">{vehicleClass.name}</span>
      </button>
    </Tooltip>
  );
}

export function VehicleClassSelector({
  value,
  onChange,
}: {
  value: VehicleClassId;
  onChange: (id: VehicleClassId) => void;
}) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {VEHICLE_CLASSES.map((vc) => (
          <VehicleOption
            key={vc.id}
            vehicleClass={vc}
            selected={value === vc.id}
            onSelect={() => onChange(vc.id)}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
