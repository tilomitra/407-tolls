"use client";

import { useState } from "react";
import type { TimeSlotCost } from "@407-etr/core";
import { Card } from "../ui/card";

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function TimeChart({
  data,
  currentSlot,
  currentDayType,
}: {
  data: TimeSlotCost[];
  currentSlot: string;
  currentDayType: string;
}) {
  const [open, setOpen] = useState(false);

  const weekday = data.filter((d) => d.dayType === "weekday");
  const weekend = data.filter((d) => d.dayType === "weekend");

  const minCost = Math.min(...data.map((d) => d.totalCents));
  const maxCost = Math.max(...data.map((d) => d.totalCents));
  const currentEntry = data.find(
    (d) =>
      d.slot === currentSlot &&
      ((currentDayType === "weekday" && d.dayType === "weekday") ||
        (currentDayType !== "weekday" && d.dayType === "weekend")),
  );
  const currentCost = currentEntry?.totalCents ?? 0;
  const canSave = currentCost > minCost;
  const savings = currentCost - minCost;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          {canSave ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Save up to {formatDollars(savings)} on this trip
                </p>
                <p className="text-xs text-slate-500">Compare prices across all time slots</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  You&apos;re traveling at the lowest rate
                </p>
                <p className="text-xs text-slate-500">See all time slots</p>
              </div>
            </>
          )}
        </div>

        <svg
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-slate-100">
          <table className="w-full text-xs">
            <tbody>
              <SectionHeader label="Weekday" />
              {weekday.map((s) => (
                <SlotRow
                  key={`wd-${s.slot}`}
                  slot={s}
                  isCurrent={currentDayType === "weekday" && s.slot === currentSlot}
                  isCheapest={s.totalCents === minCost}
                  maxCost={maxCost}
                />
              ))}
              <SectionHeader label="Weekend / Holiday" />
              {weekend.map((s) => (
                <SlotRow
                  key={`we-${s.slot}`}
                  slot={s}
                  isCurrent={currentDayType !== "weekday" && s.slot === currentSlot}
                  isCheapest={s.totalCents === minCost}
                  maxCost={maxCost}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={3} className="px-6 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </td>
    </tr>
  );
}

function SlotRow({
  slot,
  isCurrent,
  isCheapest,
  maxCost,
}: {
  slot: TimeSlotCost;
  isCurrent: boolean;
  isCheapest: boolean;
  maxCost: number;
}) {
  const barPercent = maxCost > 0 ? (slot.totalCents / maxCost) * 100 : 0;

  return (
    <tr className={isCurrent ? "bg-blue-50/60" : "hover:bg-slate-50/50"}>
      <td className={`whitespace-nowrap py-2.5 pl-6 pr-2 ${isCurrent ? "font-medium text-blue-700" : "text-slate-500"}`}>
        {slot.label}
      </td>
      <td className="w-full px-3 py-2.5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isCheapest
                ? "bg-emerald-400"
                : isCurrent
                  ? "bg-blue-500"
                  : "bg-slate-200"
            }`}
            style={{ width: `${Math.max(barPercent, 4)}%` }}
          />
        </div>
      </td>
      <td className={`whitespace-nowrap py-2.5 pl-2 pr-6 text-right tabular-nums ${
        isCheapest
          ? "font-semibold text-emerald-600"
          : isCurrent
            ? "font-semibold text-blue-700"
            : "text-slate-500"
      }`}>
        {formatDollars(slot.totalCents)}
        {isCheapest && (
          <span className="ml-1.5 text-[10px] font-medium text-emerald-500">Lowest</span>
        )}
      </td>
    </tr>
  );
}
