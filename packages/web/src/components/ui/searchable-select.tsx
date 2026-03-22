"use client";

import { useState, useMemo, useRef, useCallback, type ReactNode } from "react";
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
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const closingRef = useRef(false);

  const selected = useMemo(() => options.find((o) => o.id === value) ?? null, [options, value]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.searchText.toLowerCase().includes(q));
  }, [query, options]);

  const handleSelect = useCallback(
    (o: T | null) => {
      if (!o) return;
      onChange(o.id);
      setQuery("");
      setOpen(false);
      closingRef.current = true;
      // Blur to dismiss keyboard on mobile; guard with closingRef so
      // the subsequent focus event doesn't reopen the dropdown.
      requestAnimationFrame(() => {
        inputRef.current?.blur();
        // Reset the guard after blur settles.
        requestAnimationFrame(() => {
          closingRef.current = false;
        });
      });
    },
    [onChange],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (closingRef.current) return;
    e.target.select();
    setOpen(true);
  }, []);

  return (
    <Combobox value={selected} onChange={handleSelect} onClose={() => { setQuery(""); setOpen(false); }}>
      <div className="relative">
        <ComboboxInput
          ref={inputRef}
          className="block w-full cursor-pointer appearance-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          displayValue={(o: T | null) => o?.label ?? ""}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={handleFocus}
          placeholder={placeholder}
        />

        {open && (
          <ComboboxOptions
            static
            className="absolute left-0 right-0 z-50 mt-2 max-h-52 overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
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
        )}
      </div>
    </Combobox>
  );
}
