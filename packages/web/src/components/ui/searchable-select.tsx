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
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

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
      justSelectedRef.current = true;
      setTimeout(() => {
        inputRef.current?.blur();
        justSelectedRef.current = false;
      }, 0);
    },
    [onChange],
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (justSelectedRef.current) {
      e.target.blur();
      return;
    }
    e.target.select();
  }, []);

  return (
    <Combobox value={selected} onChange={handleSelect} onClose={() => setQuery("")} immediate>
      <div className="relative">
        <ComboboxInput
          ref={inputRef}
          className="block w-full cursor-pointer appearance-none bg-transparent text-sm text-ab-text placeholder:text-ab-text-mute focus:outline-none"
          displayValue={(o: T | null) => o?.label ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
        />

        <ComboboxOptions className="absolute left-0 right-0 z-50 mt-2 max-h-60 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-ab-line bg-ab-card py-2 shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-sm text-ab-text-mute">No results</div>
          ) : (
            filtered.map((o) => (
              <ComboboxOption
                key={o.id}
                value={o}
                className="cursor-pointer px-4 py-2 data-[focus]:bg-ab-ink data-[selected]:bg-ab-gold-mist"
              >
                {renderOption ? renderOption(o) : (
                  <div className="text-sm text-ab-text">{o.label}</div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
