"use client";

import { useMemo } from "react";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";

export interface StyledSelectOption {
  value: string;
  label: string;
}

export function StyledSelect({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: StyledSelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  return (
    <div>
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-ab-text-dim">
          {label}
        </span>
      )}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-ab-line-hi bg-ab-card px-4 py-2.5 text-left text-sm text-ab-text transition-colors hover:border-ab-text focus:outline-none focus:border-ab-text focus:ring-2 focus:ring-ab-gold/30">
            <span className="truncate">{selected?.label ?? value}</span>
            <svg
              className="h-4 w-4 shrink-0 text-ab-text-dim"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </ListboxButton>

          <ListboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-ab-line bg-ab-card py-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)] focus:outline-none">
            {options.map((o) => (
              <ListboxOption
                key={o.value}
                value={o.value}
                className="cursor-pointer px-4 py-2 text-sm text-ab-text data-[focus]:bg-ab-ink data-[selected]:font-semibold data-[selected]:text-ab-gold"
              >
                {o.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
