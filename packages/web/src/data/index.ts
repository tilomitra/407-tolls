import type { TollPoint, Interchange } from "@407-etr/core";

import rawGantries from "./407-etr-gantries.json";
import rawInterchanges from "./407-etr-interchanges.json";
import rawHighwayGeometry from "./407-etr-highway-geometry.json";

export const gantries = rawGantries as unknown as TollPoint[];
export const interchanges = rawInterchanges as unknown as Interchange[];
export const highwayGeometry = rawHighwayGeometry as Array<[number, number]>;
