import type { Query } from "@/lib/types";
import { buildRouteInput } from "@/lib/load-toll-points";
import { resolveSlugRoute } from "@/lib/slugs";
import { parseTimeSlot, parseVehicleClass, getString } from "@/lib/params";

export function buildTripInput(routeParam: string, query: Query) {
  const parsed = resolveSlugRoute(decodeURIComponent(routeParam));
  if (!parsed) return null;

  const vehicleClassId = parseVehicleClass(getString(query, "vehicleClass", "light"));
  const transponder = getString(query, "transponder", "true") !== "false";
  const resolved = buildRouteInput({
    entryId: parsed.entryId,
    exitId: parsed.exitId,
    vehicleClassId,
    hasTransponder: transponder,
  });
  if (!resolved.ok) return null;
  const timeSlot = parseTimeSlot(
    getString(query, "time", "7am"),
    getString(query, "day", "weekday"),
  );

  return { ...parsed, ...resolved, transponder, timeSlot };
}
