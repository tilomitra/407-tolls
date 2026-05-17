import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/ui/header";
import { SwRegister } from "@/components/sw-register";
import { BASE_URL } from "@/lib/constants";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
  viewportFit: "cover",
};

// Runs synchronously before paint to apply the saved theme, avoiding a
// light-to-dark flash on first load. Kept as a string so React doesn't try
// to escape its contents.
const themeBootstrapScript = `(function(){try{var p=localStorage.getItem('407-theme');var d=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

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
  appleWebApp: {
    capable: true,
    title: "407 Tolls",
    statusBarStyle: "default",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-dvh overflow-x-hidden bg-ab-black text-ab-text antialiased">
        <SwRegister />
        <Header />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
