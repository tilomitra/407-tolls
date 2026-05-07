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
        <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
          {label}
        </span>
      )}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="flex w-full cursor-pointer items-center justify-between border border-amex-line-hi bg-amex-ink px-3 py-2 text-left text-sm text-amex-text transition-colors hover:border-amex-gold-lo focus:outline-none focus:border-amex-gold focus:ring-1 focus:ring-amex-gold">
            <span className="truncate">{selected?.label ?? value}</span>
            <svg
              className="h-4 w-4 shrink-0 text-amex-gold-lo"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </ListboxButton>

          <ListboxOptions className="absolute z-50 mt-1 max-h-52 w-full overflow-auto border border-amex-gold-deep bg-amex-ink py-1 shadow-[0_8px_24px_rgba(0,0,0,0.7)] focus:outline-none">
            {options.map((o) => (
              <ListboxOption
                key={o.value}
                value={o.value}
                className="cursor-pointer px-3 py-2 text-sm text-amex-text-dim data-[focus]:bg-amex-gold-mist data-[focus]:text-amex-gold-hi data-[selected]:font-semibold data-[selected]:text-amex-gold"
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
