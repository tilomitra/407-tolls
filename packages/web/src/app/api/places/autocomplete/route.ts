import { NextResponse } from "next/server";

const PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

interface PlacesAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: {
        mainText?: { text: string };
        secondaryText?: { text: string };
      };
    };
  }>;
}

export async function POST(req: Request) {
  if (!PLACES_API_KEY) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }
  const { input, sessionToken } = (await req.json()) as {
    input?: string;
    sessionToken?: string;
  };
  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_API_KEY,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ["ca"],
      sessionToken,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Places: ${res.status}` }, { status: 502 });
  }

  const data = (await res.json()) as PlacesAutocompleteResponse;
  const suggestions = (data.suggestions ?? [])
    .map((s) => s.placePrediction)
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({
      placeId: p.placeId,
      mainText: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      secondaryText: p.structuredFormat?.secondaryText?.text ?? "",
    }));

  return NextResponse.json({ suggestions });
}
