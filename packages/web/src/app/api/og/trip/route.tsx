import { ImageResponse } from "next/og";
import { calculateToll, getVehicleClass } from "@407-etr/core";
import { buildTripInput } from "@/lib/build-trip-input";
import { formatDollars } from "@/lib/format";
import { OG_SIZE, OG_MAX_NAME_LENGTH, loadFonts, OgFallback, OgCard, OgBadge, truncate, searchParamsToQuery } from "@/lib/og";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeParam = searchParams.get("route");
  if (!routeParam) return OgFallback();

  const trip = buildTripInput(routeParam, searchParamsToQuery(searchParams));
  if (!trip) return OgFallback();

  const result = calculateToll({
    ...trip.route,
    timeSlot: trip.timeSlot,
    hasTransponder: trip.transponder,
  });

  const vehicleClass = getVehicleClass({ id: trip.route.vehicleClassId });
  const totalKm = result.perZone.reduce((sum, z) => sum + z.distanceKm, 0);
  const zoneCount = result.perZone.length;
  const fonts = await loadFonts();

  const price = formatDollars(result.totalCents);

  const withTransponder = calculateToll({
    ...trip.route,
    timeSlot: trip.timeSlot,
    hasTransponder: true,
  });
  const withoutTransponder = calculateToll({
    ...trip.route,
    timeSlot: trip.timeSlot,
    hasTransponder: false,
  });
  const diffCents = withoutTransponder.totalCents - withTransponder.totalCents;
  const savings = diffCents > 0
    ? trip.transponder
      ? { variant: "positive" as const, text: `Saving ${formatDollars(diffCents)} with transponder` }
      : { variant: "negative" as const, text: `Paying ${formatDollars(diffCents)} extra without transponder` }
    : null;

  return new ImageResponse(
    <OgCard
      label="Toll Estimate"
      entryName={truncate(trip.entry.name, OG_MAX_NAME_LENGTH)}
      exitName={truncate(trip.exit.name, OG_MAX_NAME_LENGTH)}
      priceContent={
        <>
          <span
            style={{
              fontSize: 136,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: -3,
            }}
          >
            {price}
          </span>
          {savings && <OgBadge variant={savings.variant} text={savings.text} />}
        </>
      }
      pills={[`${totalKm.toFixed(1)} km`, `${zoneCount} zones`, vehicleClass.name]}
      ctaText="Calculate your toll →"
    />,
    { ...OG_SIZE, fonts },
  );
}
