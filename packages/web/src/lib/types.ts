import type { VehicleClassId, TripType, DayOfWeek } from "@407-tolls/core";

export type SearchParamValue = string | string[] | undefined;
export type Query = Record<string, SearchParamValue>;

export interface TollQueryParams {
  entryId: string;
  exitId: string;
  vehicleClassId: VehicleClassId;
  hasTransponder: boolean;
  dayType: string;
  slot: string;
}

export interface CommuteQueryParams {
  entryId: string;
  exitId: string;
  vehicleClassId: VehicleClassId;
  tripType: TripType;
  commuteDays: DayOfWeek[];
  hasTransponder: boolean;
  goSlot: string;
  returnSlot?: string;
  weekendGoSlot: string;
  weekendReturnSlot?: string;
}
