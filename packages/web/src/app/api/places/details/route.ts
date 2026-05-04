import { NextResponse } from "next/server";

const PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;

interface PlaceDetailsResponse {
  location?: { latitude: number; longitude: number };
  formattedAddress?: string;
  displayName?: { text: string };
}

export async function POST(req: Request) {
  if (!PLACES_API_KEY) {
    return NextResponse.json({ error: "Places API not configured" }, { status: 500 });
  }
  const { placeId, sessionToken } = (await req.json()) as {
    placeId?: string;
    sessionToken?: string;
  };
  if (!placeId) {
    return NextResponse.json({ error: "Missing placeId" }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": PLACES_API_KEY,
      "X-Goog-FieldMask": "location,formattedAddress,displayName",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Places: ${res.status}` }, { status: 502 });
  }

  const data = (await res.json()) as PlaceDetailsResponse;
  if (!data.location) {
    return NextResponse.json({ error: "No location for place" }, { status: 404 });
  }

  return NextResponse.json({
    lat: data.location.latitude,
    lng: data.location.longitude,
    address: data.formattedAddress ?? data.displayName?.text ?? "",
  });
}
