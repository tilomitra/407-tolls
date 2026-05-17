"use client";

import { useState, useMemo } from "react";
import type { TimeSlotCost } from "@407-tolls/core";
import { Card } from "../ui/card";
import { formatDollars } from "@/lib/format";

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

  const weekday = useMemo(() => data.filter((d) => d.dayType === "weekday"), [data]);
  const weekend = useMemo(() => data.filter((d) => d.dayType !== "weekday"), [data]);

  const { minCost, maxCost } = useMemo(() => ({
    minCost: Math.min(...data.map((d) => d.totalCents)),
    maxCost: Math.max(...data.map((d) => d.totalCents)),
  }), [data]);

  const currentEntry = useMemo(() => data.find(
    (d) =>
      d.slot === currentSlot &&
      ((currentDayType === "weekday" && d.dayType === "weekday") ||
        (currentDayType !== "weekday" && d.dayType !== "weekday")),
  ), [data, currentSlot, currentDayType]);
  const currentCost = currentEntry?.totalCents ?? 0;
  const canSave = currentCost > minCost;
  const savings = currentCost - minCost;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-ab-ink"
      >
        <div className="flex items-center gap-3">
          {canSave ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ab-gold-mist">
                <svg className="h-5 w-5 text-ab-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ab-text">
                  Save up to {formatDollars(savings)} off-peak
                </p>
                <p className="text-xs text-ab-text-dim">
                  Lowest {formatDollars(minCost)} · Peak {formatDollars(maxCost)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ab-emerald-deep">
                <svg className="h-5 w-5 text-ab-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ab-text">
                  You&apos;re traveling at the lowest rate
                </p>
                <p className="text-xs text-ab-text-dim">See all time slots</p>
              </div>
            </>
          )}
        </div>

        <svg
          className={`h-5 w-5 shrink-0 text-ab-text-dim transition-transform duration-200 ${open ? "rotate-180" : ""}`}
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
        <div className="border-t border-ab-line">
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
      <td colSpan={3} className="px-6 pb-1.5 pt-3 text-xs font-semibold text-ab-gold">
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
    <tr className={isCurrent ? "bg-ab-gold-mist" : "hover:bg-ab-ink"}>
      <td className={`whitespace-nowrap py-2.5 pl-6 pr-2 text-xs ${isCurrent ? "font-semibold text-ab-gold-hi" : "text-ab-text-dim"}`}>
        {slot.label}
      </td>
      <td className="w-full px-3 py-2.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ab-line-mute">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isCheapest
                ? "bg-ab-emerald"
                : isCurrent
                  ? "bg-ab-gold"
                  : "bg-ab-line-hi"
            }`}
            style={{ width: `${Math.max(barPercent, 4)}%` }}
          />
        </div>
      </td>
      <td className={`whitespace-nowrap py-2.5 pl-2 pr-6 text-right tabular-nums ${
        isCheapest
          ? "font-semibold text-ab-emerald"
          : isCurrent
            ? "font-semibold text-ab-gold-hi"
            : "text-ab-text-dim"
      }`}>
        {formatDollars(slot.totalCents)}
        {isCheapest && (
          <span className="ml-1.5 text-[10px] font-semibold text-ab-emerald">Lowest</span>
        )}
      </td>
    </tr>
  );
}
