"use client";

import type { VehicleClassId, VehicleClass } from "@407-etr/core";
import { VEHICLE_CLASSES } from "@407-etr/core";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

const iconClass = "h-7 w-7";

const vehicleIcons: Record<VehicleClassId, React.ReactNode> = {
  motorcycle: (
    <svg className={iconClass} viewBox="0 0 32 32" fill="currentColor">
      <circle cx="6" cy="23" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="23" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 23h12" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6 19l3-6h3l2 3h6l2-5h2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 11l4 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="10" r="2" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg className={iconClass} viewBox="0 0 32 32" fill="currentColor">
      <path d="M6 22h20v-6l-2-4H8L6 16v6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 12l-2 4h20l-2-4" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="16" x2="26" y2="16" stroke="currentColor" strokeWidth="2" />
      <circle cx="10" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="22" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  medium: (
    <svg className={iconClass} viewBox="0 0 32 32" fill="currentColor">
      <rect x="3" y="10" width="18" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M21 14h5l3 4v4h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="8" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="25" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  heavy_single: (
    <svg className={iconClass} viewBox="0 0 32 32" fill="currentColor">
      <rect x="2" y="8" width="18" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 12h6l4 5v5h-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="20" y1="8" x2="20" y2="22" stroke="currentColor" strokeWidth="2" />
      <circle cx="8" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="26" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  heavy_multi: (
    <svg className={iconClass} viewBox="0 0 36 32" fill="currentColor">
      <rect x="14" y="8" width="12" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M26 12h5l3 5v5h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="2" y="10" width="12" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="14" y1="10" x2="14" y2="22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="7" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="30" cy="22" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
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
