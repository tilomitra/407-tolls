import { gantries, interchanges, highwayGeometry } from "@/data";
import { ClientApp } from "@/components/client-app";

export default function Home() {
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
          gantries={gantries}
          interchanges={interchanges}
          highwayGeometry={highwayGeometry}
        />
      </main>

    </div>
  );
}
