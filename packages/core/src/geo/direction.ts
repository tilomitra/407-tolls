import type { Direction } from "../types";

export function inferDirection({ entryLng, exitLng }: { entryLng: number; exitLng: number }): Direction {
  return exitLng > entryLng ? "eastbound" : "westbound";
}
