import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TollPoint, Interchange } from "@407-etr/core";
import { ClientApp } from "@/components/client-app";

export const dynamic = "force-dynamic";

const DATA_DIR = join(process.cwd(), "..", "..", "data");

function loadJSON<T>(filename: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, filename), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const tollPoints = loadJSON<TollPoint[]>("407-toll-points.json", []);
  const interchanges = loadJSON<Interchange[]>("interchanges.json", []);
  const highwayGeometry = loadJSON<Array<[number, number]>>("highway-geometry.json", []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              407 ETR Savings Tool
            </h1>
            <p className="text-sm text-slate-500">
              Compare on-ramps. See exactly what you&apos;ll pay.
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            2026 Rates
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ClientApp
          tollPoints={tollPoints}
          interchanges={interchanges}
          highwayGeometry={highwayGeometry}
        />
      </main>
    </div>
  );
}
