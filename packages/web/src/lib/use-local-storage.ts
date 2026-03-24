"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T, override?: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(override ?? defaultValue);

  // Read from localStorage after hydration (not during SSR).
  // If an override is provided (e.g. from URL params), use it
  // instead and persist it to localStorage.
  useEffect(() => {
    if (override !== undefined) {
      try {
        localStorage.setItem(key, JSON.stringify(override));
      } catch {
        // Storage full or unavailable
      }
      return;
    }
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch {
      // Corrupt data or private browsing
    }
  }, [key, override]);

  function update(newValue: T) {
    setValue(newValue);
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch {
      // Storage full or unavailable
    }
  }

  return [value, update];
}
