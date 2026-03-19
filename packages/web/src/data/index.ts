import type { TollPoint, Interchange } from "@407-etr/core";

import rawTollPoints from "./407-toll-points.json";
import rawInterchanges from "./interchanges.json";
import rawHighwayGeometry from "./highway-geometry.json";

export const tollPoints = rawTollPoints as unknown as TollPoint[];
export const interchanges = rawInterchanges as unknown as Interchange[];
export const highwayGeometry = rawHighwayGeometry as Array<[number, number]>;
