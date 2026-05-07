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
  allowCurrentLocation = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onResolved: (resolved: ResolvedAddress | null) => void;
  allowCurrentLocation?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isCurrentLocation, setIsCurrentLocation] = useState(false);
  const sessionTokenRef = useRef(generateSessionToken());
  const containerRef = useRef<HTMLDivElement>(null);

  function handleCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        setIsCurrentLocation(true);
        onChange("Current Location");
        onResolved({
          address: "Current Location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setGeoLoading(false);
        setGeoError("Location access denied");
      },
      { timeout: 10000 },
    );
  }

  useEffect(() => {
    if (isCurrentLocation || !value || value.length < 2) {
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
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-amex-text-mute">
          {label}
        </span>
        {allowCurrentLocation && (
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={geoLoading}
            title="Use current location"
            className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amex-gold hover:text-amex-gold-hi disabled:text-amex-text-faint"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-3.5"
            >
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0 1 10 4v.528c2.46.441 4.371 2.495 4.371 5.007a4.876 4.876 0 0 1-1.28 3.321l2.2 2.2a.75.75 0 1 1-1.06 1.061l-2.2-2.2A4.876 4.876 0 0 1 10 14.904a4.876 4.876 0 0 1-3.031-1.007l-2.2 2.2a.75.75 0 1 1-1.061-1.06l2.2-2.2A4.876 4.876 0 0 1 5.629 9.535C5.629 7.023 7.54 4.969 10 4.528V4a1 1 0 0 1 .617-.924ZM10 6a3.376 3.376 0 0 0-3.371 3.535A3.376 3.376 0 0 0 10 12.904a3.376 3.376 0 0 0 3.371-3.369A3.376 3.376 0 0 0 10 6Zm0 2a1.376 1.376 0 1 1 0 2.751A1.376 1.376 0 0 1 10 8Z"
                clipRule="evenodd"
              />
            </svg>
            {geoLoading ? "Locating…" : "Locate"}
          </button>
        )}
      </div>
      {geoError && <p className="mb-1 text-xs text-amex-ruby">{geoError}</p>}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setIsCurrentLocation(false);
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
          w-full border border-amex-line-hi bg-amex-ink px-3 py-2
          text-sm text-amex-text placeholder:text-amex-text-mute
          focus:border-amex-gold focus:outline-none focus:ring-1 focus:ring-amex-gold
        "
        autoComplete="off"
      />
      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden border border-amex-gold-deep bg-amex-ink shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-amex-text-mute">Searching…</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={s.placeId}
              type="button"
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => void selectSuggestion(s)}
              className={`flex w-full flex-col items-start px-3 py-2 text-left transition-colors ${
                i === activeIdx ? "bg-amex-gold-mist text-amex-gold-hi" : "hover:bg-amex-elev"
              }`}
            >
              <span className="text-sm font-medium text-amex-text">{s.mainText}</span>
              {s.secondaryText && (
                <span className="text-xs text-amex-text-mute">{s.secondaryText}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
