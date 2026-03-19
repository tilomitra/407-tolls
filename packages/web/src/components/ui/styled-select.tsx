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
      {label && <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
            <span className="truncate">{selected?.label ?? value}</span>
            <svg
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </ListboxButton>

          <ListboxOptions className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg focus:outline-none">
            {options.map((o) => (
              <ListboxOption
                key={o.value}
                value={o.value}
                className="cursor-pointer px-3 py-2 text-sm text-slate-900 data-[focus]:bg-blue-50 data-[selected]:font-medium data-[selected]:text-blue-700"
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
