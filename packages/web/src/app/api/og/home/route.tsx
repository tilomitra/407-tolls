import { OgDefault } from "@/lib/og";

export const runtime = "nodejs";

export function GET() {
  return OgDefault();
}
