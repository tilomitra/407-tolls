import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-amex-line bg-amex-black/95 backdrop-blur supports-[backdrop-filter]:bg-amex-black/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="group flex items-center gap-3">
          <CenturionMark />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-amex-gold">
              407 · Member
            </span>
            <span className="mt-1 text-base font-semibold tracking-[0.18em] text-amex-text uppercase group-hover:text-amex-gold-hi transition-colors">
              Tolls
            </span>
          </div>
        </Link>
        <span className="border border-amex-gold-deep px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-amex-gold">
          2026 · Rates
        </span>
      </div>
    </header>
  );
}

function CenturionMark() {
  return (
    <span
      aria-hidden
      className="relative flex h-9 w-9 items-center justify-center border border-amex-gold-deep bg-amex-black"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-5 w-5 text-amex-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        {/* abstract centurion-style helmet glyph */}
        <path d="M6 22 V12 L16 6 L26 12 V22" />
        <path d="M11 22 V14 L16 11 L21 14 V22" />
        <line x1="6" y1="26" x2="26" y2="26" />
      </svg>
    </span>
  );
}
