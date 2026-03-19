import { gantries, interchanges, highwayGeometry } from "@/data";
import { ClientApp } from "@/components/client-app";

export default function Home() {
  return (
    <div>
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
