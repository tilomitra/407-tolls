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
          className="block w-full cursor-pointer appearance-none bg-transparent text-sm text-amex-text placeholder:text-amex-text-mute focus:outline-none"
          displayValue={(o: T | null) => o?.label ?? ""}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
        />

        <ComboboxOptions className="absolute left-0 right-0 z-50 mt-2 max-h-52 overflow-y-auto overflow-x-hidden border border-amex-gold-deep bg-amex-ink shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-amex-text-mute">No results</div>
          ) : (
            filtered.map((o) => (
              <ComboboxOption
                key={o.id}
                value={o}
                className="cursor-pointer px-3 py-2 data-[focus]:bg-amex-gold-mist data-[selected]:bg-amex-gold-mist"
              >
                {renderOption ? renderOption(o) : (
                  <div className="text-sm text-amex-text">{o.label}</div>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
