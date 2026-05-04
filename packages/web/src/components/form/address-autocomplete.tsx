"use client";

import { useEffect, useRef, useState } from "react";

export interface ResolvedAddress {
  address: string;
  lat: number;
  lng: number;
}

interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

function generateSessionToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onResolved,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onResolved: (resolved: ResolvedAddress | null) => void;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const sessionTokenRef = useRef(generateSessionToken());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: value,
            sessionToken: sessionTokenRef.current,
          }),
        });
        if (!res.ok) throw new Error(`Autocomplete ${res.status}`);
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (!cancelled) setSuggestions(data.suggestions ?? []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function selectSuggestion(s: Suggestion) {
    setOpen(false);
    setSuggestions([]);
    const display = s.secondaryText ? `${s.mainText}, ${s.secondaryText}` : s.mainText;
    onChange(display);

    try {
      const res = await fetch("/api/places/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: s.placeId,
          sessionToken: sessionTokenRef.current,
        }),
      });
      if (!res.ok) throw new Error(`Details ${res.status}`);
      const data = (await res.json()) as { lat: number; lng: number; address: string };
      onResolved({ address: data.address || display, lat: data.lat, lng: data.lng });
    } catch {
      onResolved(null);
    } finally {
      sessionTokenRef.current = generateSessionToken();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIdx(-1);
          onResolved(null);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || suggestions.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && activeIdx >= 0) {
            e.preventDefault();
            void selectSuggestion(suggestions[activeIdx]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        className="
          w-full rounded-lg border border-slate-200 bg-white px-3 py-2
          text-sm text-slate-900 placeholder:text-slate-400
          focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
        "
        autoComplete="off"
      />
      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-400">Searching…</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={s.placeId}
              type="button"
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => void selectSuggestion(s)}
              className={`flex w-full flex-col items-start px-3 py-2 text-left transition-colors ${
                i === activeIdx ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              <span className="text-sm font-medium text-slate-900">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-xs text-slate-500">{s.secondaryText}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
