import type { Direction } from "../types";

export function inferDirection({ entryLng, exitLng }: { entryLng: number; exitLng: number }): Direction {
  return exitLng > entryLng ? "eastbound" : "westbound";
}

export function flipDirection(direction: Direction): Direction {
  return direction === "eastbound" ? "westbound" : "eastbound";
}
