"use client";

import { useState, useMemo, type ReactNode } from "react";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";

export interface SearchableSelectOption {
  id: string;
  label: string;
  searchText: string;
}

export function SearchableSelect<T extends SearchableSelectOption>({
  options,
  value,
  onChange,
  placeholder = "Search...",
  renderOption,
}: {
  options: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  renderOption?: (option: T) => ReactNode;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.searchText.toLowerCase().includes(q));
  }, [query, options]);

  return (
    <Combobox
      value={selected}
      onChange={(o) => {
        if (o) {
          onChange(o.id);
          // Blur the input to dismiss the mobile keyboard and restore scroll position.
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        }
      }}
      onClose={() => setQuery("")}
      immediate
    >
      <div className="relative">
        <ComboboxInput
          className="block w-full cursor-pointer appearance-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          displayValue={(o: T | null) => o?.label ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
        />

        <ComboboxOptions className="absolute left-0 right-0 z-50 mt-2 max-h-52 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No results</div>
          ) : (
            filtered.map((o) => (
              <ComboboxOption
                key={o.id}
                value={o}
                className="cursor-pointer px-3 py-2 data-[focus]:bg-blue-50 data-[selected]:bg-blue-50"
              >
                {renderOption ? (
                  renderOption(o)
                ) : (
                  <div className="text-sm text-slate-900">{o.label}</div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
