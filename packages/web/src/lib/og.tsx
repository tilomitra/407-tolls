import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import type { Query } from "@/lib/types";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_MAX_NAME_LENGTH = 22;

const INTER_BOLD_URL =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf";
const INTER_SEMIBOLD_URL =
  "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf";

let fontCache: { bold: ArrayBuffer; semibold: ArrayBuffer } | null = null;

export async function loadFonts() {
  if (!fontCache) {
    const [bold, semibold] = await Promise.all([
      fetch(INTER_BOLD_URL).then((res) => res.arrayBuffer()),
      fetch(INTER_SEMIBOLD_URL).then((res) => res.arrayBuffer()),
    ]);
    fontCache = { bold, semibold };
  }
  return [
    { name: "Inter", data: fontCache.bold, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: fontCache.semibold, weight: 600 as const, style: "normal" as const },
  ];
}

function buildOgImageUrl(
  endpoint: "trip" | "commute",
  route: string,
  query: Query,
): string {
  const params = new URLSearchParams({ route });
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") params.set(key, value);
  }
  return `/api/og/${endpoint}?${params}`;
}

export function buildTripOgImageUrl(route: string, query: Query): string {
  return buildOgImageUrl("trip", route, query);
}

export function buildCommuteOgImageUrl(route: string, query: Query): string {
  return buildOgImageUrl("commute", route, query);
}

export function OgDefault() {
  return new ImageResponse(
    <OgCard
      label="Toll Calculator"
      entryName=""
      exitName=""
      priceContent={
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#ededed",
              lineHeight: 1.2,
              textAlign: "center",
              letterSpacing: 2,
            }}
          >
            Calculate Your Toll
          </span>
          <span style={{ fontSize: 22, fontWeight: 600, color: "#a3a09a", textAlign: "center" }}>
            Estimate trips, commute costs, and transponder savings
          </span>
        </div>
      }
      pills={[]}
      ctaText="Try it free →"
    />,
    OG_SIZE,
  );
}

export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function searchParamsToQuery(searchParams: URLSearchParams): Record<string, string> {
  return Object.fromEntries(searchParams);
}

export interface OgBadgeProps {
  variant: "positive" | "negative";
  text: string;
}

export function OgBadge({ variant, text }: OgBadgeProps) {
  const isNegative = variant === "negative";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "7px 18px",
        borderRadius: 0,
        backgroundColor: isNegative
          ? "rgba(196,113,113,0.10)"
          : "rgba(127,178,135,0.10)",
        border: isNegative
          ? "1px solid rgba(196,113,113,0.40)"
          : "1px solid rgba(127,178,135,0.40)",
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: isNegative ? "#c47171" : "#7fb287",
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
    </div>
  );
}

export interface OgCardProps {
  label: string;
  entryName: string;
  exitName: string;
  roundTrip?: boolean;
  priceContent: ReactElement;
  pills: string[];
  ctaText: string;
}

export function OgCard({
  label,
  entryName,
  exitName,
  roundTrip = false,
  priceContent,
  pills,
  ctaText,
}: OgCardProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(197,165,114,0.12), transparent 70%), linear-gradient(180deg, #000000 0%, #050505 100%)",
        fontFamily: "Inter",
        padding: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 1,
          backgroundColor: "#574532",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "40px 56px 44px 56px",
          position: "relative",
          border: "1px solid #1c1c1c",
          margin: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#c5a572",
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            407 · Member · Tolls
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#a3a09a",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
        </div>

        {entryName && exitName && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: "#ededed", letterSpacing: 1 }}>{entryName}</span>
            {roundTrip ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#c5a572" }}>→</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#dcc28e" }}>←</span>
              </div>
            ) : (
              <span style={{ fontSize: 22, fontWeight: 700, color: "#c5a572" }}>→</span>
            )}
            <span style={{ fontSize: 36, fontWeight: 700, color: "#ededed", letterSpacing: 1 }}>{exitName}</span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            flexDirection: "column",
            gap: 18,
          }}
        >
          {priceContent}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {pills.map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                padding: "8px 18px",
                backgroundColor: "rgba(197,165,114,0.05)",
                border: "1px solid #574532",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#dcc28e",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {pill}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#c5a572",
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            407tolls.com
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#6a675f",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {ctaText}
          </span>
        </div>
      </div>
    </div>
  );
}
