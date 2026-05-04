import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="group">
          <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src="/favicon.svg" alt="407" className="h-7 w-7 rounded" />
            <span className="text-slate-900 group-hover:text-blue-600 transition-colors">Tolls</span>
          </h1>
        </Link>
        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          2026 Rates
        </span>
      </div>
    </header>
  );
}
