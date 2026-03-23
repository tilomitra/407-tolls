import type { Metadata } from "next";
import { gantries, interchanges, highwayGeometry } from "@/data";
import { ClientApp } from "@/components/client-app";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "407 ETR Toll Calculator",
    url: BASE_URL,
    description:
      "Calculate 407 ETR toll costs for any route. Compare transponder savings, estimate commute costs, and find the cheapest on-ramps.",
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
        <ClientApp
          gantries={gantries}
          interchanges={interchanges}
          highwayGeometry={highwayGeometry}
        />
      </main>
    </>
  );
}
