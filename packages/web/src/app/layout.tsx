import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { BASE_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1222",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "407 ETR Toll Calculator — Estimate Trip & Commute Costs",
    template: "%s | 407 ETR Toll Calculator",
  },
  description:
    "Calculate 407 ETR toll costs for any route. Compare transponder savings, estimate commute costs, and find the cheapest on-ramps.",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "407 ETR Toll Calculator",
    images: [{ url: "/api/og/home", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
