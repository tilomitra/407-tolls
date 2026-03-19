import type { Zone } from "@407-etr/core";

export const colors = {
  brand: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a5f",
  },
  surface: {
    primary: "#ffffff",
    secondary: "#f8fafc",
    tertiary: "#f1f5f9",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
  },
  text: {
    primary: "#0f172a",
    secondary: "#475569",
    tertiary: "#94a3b8",
    inverse: "#ffffff",
  },
  status: {
    success: "#059669",
    successLight: "#ecfdf5",
    successBorder: "#a7f3d0",
    warning: "#d97706",
    warningLight: "#fffbeb",
    warningBorder: "#fde68a",
    error: "#dc2626",
    errorLight: "#fef2f2",
    info: "#2563eb",
    infoLight: "#eff6ff",
  },
  toll: {
    free: "#059669",
    freeLight: "#ecfdf5",
    freeBorder: "#a7f3d0",
    peak: "#dc2626",
    peakLight: "#fef2f2",
    offpeak: "#059669",
  },
} as const;

export const zoneColors: Record<Zone, { bg: string; text: string; dot: string }> = {
  1: { bg: "#eff6ff", text: "#1e3a5f", dot: "#1e3a5f" },
  2: { bg: "#e0f2fe", text: "#0369a1", dot: "#5b9bd5" },
  3: { bg: "#fefce8", text: "#854d0e", dot: "#eab308" },
  4: { bg: "#eff6ff", text: "#1e40af", dot: "#2b5797" },
  5: { bg: "#faf5ff", text: "#6b21a8", dot: "#7030a0" },
  6: { bg: "#fff7ed", text: "#c2410c", dot: "#ed7d31" },
  7: { bg: "#fdf2f8", text: "#be185d", dot: "#ec4899" },
  8: { bg: "#f0fdf4", text: "#166534", dot: "#22c55e" },
  9: { bg: "#fef2f2", text: "#991b1b", dot: "#ef4444" },
  10: { bg: "#f0fdfa", text: "#115e59", dot: "#14b8a6" },
  11: { bg: "#faf5ff", text: "#581c87", dot: "#7c3aed" },
  12: { bg: "#fff7ed", text: "#9a3412", dot: "#f97316" },
};

export const FREE_DOT_COLOR = "#059669";
