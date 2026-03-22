import type { VehicleClassId, TripType, DayOfWeek } from "@407-etr/core";

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
