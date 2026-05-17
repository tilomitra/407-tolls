"use client";

import { useState } from "react";
import type { VehicleClassId, VehicleClass } from "@407-tolls/core";
import { VEHICLE_CLASSES, getVehicleClass } from "@407-tolls/core";
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
          <p className="font-semibold text-white">{vehicleClass.name}</p>
          <p className="mt-0.5 text-white/70">{vehicleClass.description}</p>
        </div>
      }
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 transition-all duration-150 ${
          selected
            ? "border-ab-text bg-ab-card text-ab-text shadow-sm"
            : "border-ab-line bg-ab-card text-ab-text-dim hover:border-ab-line-hi hover:text-ab-text"
        }`}
      >
        {vehicleIcons[vehicleClass.id]}
        <span className="text-[11px] font-semibold leading-tight">
          {vehicleClass.name}
        </span>
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
  const [expanded, setExpanded] = useState(false);
  const selectedClass = getVehicleClass({ id: value });

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ab-line bg-ab-card px-3 py-2.5 text-left text-ab-text transition-all duration-150 hover:border-ab-line-hi"
        aria-expanded="false"
        aria-label={`Vehicle class: ${selectedClass.name}. Tap to change.`}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-ab-text">{vehicleIcons[selectedClass.id]}</span>
          <span className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ab-text-mute">
              Vehicle
            </span>
            <span className="text-sm font-semibold leading-tight">
              {selectedClass.name}
            </span>
          </span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ab-text-dim">
          Change
        </span>
      </button>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-stretch gap-2">
        {VEHICLE_CLASSES.map((vc) => (
          <VehicleOption
            key={vc.id}
            vehicleClass={vc}
            selected={value === vc.id}
            onSelect={() => {
              onChange(vc.id);
              setExpanded(false);
            }}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}
