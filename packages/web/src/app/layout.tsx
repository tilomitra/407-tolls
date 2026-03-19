import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/ui/footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "407 ETR Savings Tool",
  description: "Find cheaper on-ramps on the 407 ETR and see how much you could save.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <Footer />
      </body>
    </html>
  );
}
