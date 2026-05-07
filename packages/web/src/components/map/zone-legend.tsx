import { zoneColors, FREE_DOT_COLOR } from "@/lib/design/tokens";
import type { Zone } from "@407-tolls/core";

const ZONE_LABELS: Record<Zone | 0, string> = {
  1: "QEW – Dundas",
  2: "Dundas – Neyagawa",
  3: "Neyagawa – Hwy 403",
  4: "Hwy 403 – Hwy 401",
  5: "Hwy 401 – Hwy 410",
  6: "Hwy 410 – Hwy 427",
  7: "Hwy 427 – Hwy 400",
  8: "Hwy 400 – Yonge",
  9: "Yonge – Hwy 404",
  10: "Hwy 404 – McCowan",
  11: "McCowan – York Durham",
  12: "York Durham – Brock",
  0: "Toll-free (407 East)",
};

export function ZoneLegend() {
  const entries = [
    ...Object.entries(zoneColors).map(([z, c]) => ({
      zone: Number(z) as Zone,
      color: c.dot,
    })),
    { zone: 0 as Zone | 0, color: FREE_DOT_COLOR },
  ];

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-amex-text-dim">
      {entries.map(({ zone, color }) => (
        <div key={zone} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>
            {zone > 0 && <span className="font-medium uppercase tracking-[0.14em] text-amex-gold">Z{zone}</span>}
            {zone > 0 && " "}
            {ZONE_LABELS[zone as keyof typeof ZONE_LABELS]}
          </span>
        </div>
      ))}
    </div>
  );
}
