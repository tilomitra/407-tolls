import { ImageResponse } from "next/og";
import { computeCommuteEstimate, getVehicleClass } from "@407-etr/core";
import { parseRoute } from "@/lib/params";
import { buildCommuteInput } from "@/lib/build-commute-input";
import { formatDollars, formatLargeDollars, formatCommuteDays } from "@/lib/format";
import { OG_SIZE, OG_MAX_NAME_LENGTH, loadFonts, OgFallback, OgCard, OgBadge, truncate, searchParamsToQuery } from "@/lib/og";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const routeParam = searchParams.get("route");
  if (!routeParam) return OgFallback();

  const parsed = parseRoute(decodeURIComponent(routeParam));
  if (!parsed) return OgFallback();

  const query = searchParamsToQuery(searchParams);
  const transponder = searchParams.get("transponder") !== "false";
  const resolved = buildCommuteInput(query, transponder, parsed.entryId, parsed.exitId);
  if (!resolved) return OgFallback();

  const estimate = computeCommuteEstimate(resolved.commuteInput);
  const vehicleClass = getVehicleClass({ id: resolved.commuteInput.route.vehicleClassId });

  const withInput = {
    ...resolved.commuteInput,
    route: { ...resolved.commuteInput.route, hasTransponder: true },
  };
  const withoutInput = {
    ...resolved.commuteInput,
    route: { ...resolved.commuteInput.route, hasTransponder: false },
  };
  const diffCents =
    computeCommuteEstimate(withoutInput).perMonthCents -
    computeCommuteEstimate(withInput).perMonthCents;
  const savings = diffCents > 0
    ? transponder
      ? { variant: "positive" as const, text: `Saving ${formatDollars(diffCents)}/mo with transponder` }
      : { variant: "negative" as const, text: `Paying ${formatDollars(diffCents)}/mo extra without transponder` }
    : null;

  const monthly = formatDollars(estimate.perMonthCents);
  const yearly = formatLargeDollars(estimate.perYearCents);
  const dayLabel = formatCommuteDays(resolved.days);
  const tripLabel = resolved.tripType === "round_trip" ? "Round trip" : "One way";
  const fonts = await loadFonts();

  return new ImageResponse(
    <OgCard
      label="Commute Cost"
      entryName={truncate(resolved.entry.name, OG_MAX_NAME_LENGTH)}
      exitName={truncate(resolved.exit.name, OG_MAX_NAME_LENGTH)}
      priceContent={
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: 112,
                  fontWeight: 700,
                  color: "#ffffff",
                  lineHeight: 1,
                  letterSpacing: -3,
                }}
              >
                {monthly}
              </span>
              <span style={{ fontSize: 36, fontWeight: 600, color: "#3b82f6", marginLeft: 6 }}>
                /mo
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <span
                style={{
                  fontSize: 44,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  lineHeight: 1,
                  letterSpacing: -1,
                }}
              >
                {yearly}
              </span>
              <span style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>
                /yr
              </span>
            </div>
          </div>
          {savings && <OgBadge variant={savings.variant} text={savings.text} />}
        </>
      }
      pills={[dayLabel, vehicleClass.name, tripLabel]}
      ctaText="Calculate your commute →"
    />,
    { ...OG_SIZE, fonts },
  );
}
