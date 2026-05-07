import type { Zone } from "@407-tolls/core";

export const colors = {
  brand: {
    50: "#1a1408",
    100: "#2d2417",
    200: "#574532",
    500: "#c5a572",
    600: "#dcc28e",
    700: "#dcc28e",
    900: "#000000",
  },
  surface: {
    primary: "#0c0c0c",
    secondary: "#050505",
    tertiary: "#141414",
    border: "#1c1c1c",
    borderHover: "#2a2a2a",
  },
  text: {
    primary: "#ededed",
    secondary: "#a3a09a",
    tertiary: "#6a675f",
    inverse: "#000000",
  },
  status: {
    success: "#7fb287",
    successLight: "#1f3a26",
    successBorder: "#3a5e44",
    warning: "#d8a85a",
    warningLight: "#3a2c14",
    warningBorder: "#574532",
    error: "#c47171",
    errorLight: "#3a1c1c",
    info: "#c5a572",
    infoLight: "#1a1408",
  },
  toll: {
    free: "#7fb287",
    freeLight: "#1f3a26",
    freeBorder: "#3a5e44",
    peak: "#c47171",
    peakLight: "#3a1c1c",
    offpeak: "#7fb287",
  },
} as const;

// Zone colors retuned for the dark Amex-black theme.
// `dot` is used on the (light) MapLibre basemap and keeps the original 407 ETR
// hue. `bg`/`text` are used in dark-surface zone badges, so we use deep tinted
// backgrounds with a brighter tinted foreground.
export const zoneColors: Record<Zone, { bg: string; text: string; dot: string }> = {
  1: { bg: "#0f1924", text: "#7c98c2", dot: "#1b365d" },
  2: { bg: "#0f1c2c", text: "#85a8d0", dot: "#2d5ea0" },
  3: { bg: "#241b08", text: "#dcc28e", dot: "#d4a843" },
  4: { bg: "#0f1d30", text: "#7fa4d4", dot: "#1e4d8c" },
  5: { bg: "#1d1226", text: "#b88dd0", dot: "#6a2c91" },
  6: { bg: "#241608", text: "#e09870", dot: "#e07830" },
  7: { bg: "#241018", text: "#e07ea2", dot: "#e84080" },
  8: { bg: "#0c2014", text: "#7fcc94", dot: "#3aab5f" },
  9: { bg: "#241010", text: "#e07c84", dot: "#e04050" },
  10: { bg: "#0c1f1c", text: "#74c5b8", dot: "#20a090" },
  11: { bg: "#1a1226", text: "#a690d4", dot: "#7040b0" },
  12: { bg: "#241208", text: "#e08470", dot: "#e06040" },
};

export const FREE_DOT_COLOR = "#7fb287";
