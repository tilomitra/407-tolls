import type { Metadata } from "next";
import { gantries, interchanges, highwayGeometry } from "@/data";
import { PlannerApp } from "@/components/planner-app";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "407 Tolls Trip Planner",
    url: BASE_URL,
    description:
      "Plan a trip on or off the 407 ETR. Compare toll, distance, and time for full-407, partial-407, and no-toll routes.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "CAD" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <PlannerApp
          gantries={gantries}
          interchanges={interchanges}
          highwayGeometry={highwayGeometry}
        />
      </main>
    </>
  );
}
