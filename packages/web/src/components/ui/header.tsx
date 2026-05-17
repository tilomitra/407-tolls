import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ab-line bg-ab-black/90 backdrop-blur supports-[backdrop-filter]:bg-ab-black/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full px-2 py-1 -mx-2 transition-colors hover:bg-ab-ink"
        >
          <RauschMark />
          <span className="text-base font-semibold tracking-tight text-ab-gold-hi group-hover:text-ab-gold transition-colors">
            407 tolls
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center rounded-full border border-ab-line bg-ab-ink px-3 py-1 text-[11px] font-medium text-ab-text-dim">
            2026 rates
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function RauschMark() {
  return (
    <span
      aria-hidden
      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-ab-gold text-white shadow-sm"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Stylized highway curve mark */}
        <path d="M6 22 C 10 8, 22 8, 26 22" />
        <circle cx="16" cy="14" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
