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

// Zone colors matched to 407 ETR's official map legend
export const zoneColors: Record<Zone, { bg: string; text: string; dot: string }> = {
  1: { bg: "#e8edf3", text: "#1b365d", dot: "#1b365d" },   // dark navy
  2: { bg: "#dce8f4", text: "#2d5ea0", dot: "#2d5ea0" },   // medium blue
  3: { bg: "#fdf4d8", text: "#b8860b", dot: "#d4a843" },   // gold/yellow
  4: { bg: "#dae4f0", text: "#1e4d8c", dot: "#1e4d8c" },   // royal blue
  5: { bg: "#e8d8f0", text: "#6a2c91", dot: "#6a2c91" },   // purple
  6: { bg: "#fce8d5", text: "#c65d1a", dot: "#e07830" },   // orange
  7: { bg: "#f8d8e8", text: "#c41e5c", dot: "#e84080" },   // pink/magenta
  8: { bg: "#d8f0e0", text: "#2d8c4e", dot: "#3aab5f" },   // green
  9: { bg: "#fce0e0", text: "#c41e3a", dot: "#e04050" },   // red
  10: { bg: "#d8f0ec", text: "#1a7a6a", dot: "#20a090" },   // teal
  11: { bg: "#e8d8f0", text: "#5c2d91", dot: "#7040b0" },   // deep purple
  12: { bg: "#fce0d0", text: "#c44020", dot: "#e06040" },   // coral/red-orange
};

export const FREE_DOT_COLOR = "#059669";
