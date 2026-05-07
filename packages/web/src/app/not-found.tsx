import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-amex-eyebrow">404 · Member</p>
      <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.16em] text-amex-text">Page not found</h1>
      <p className="mt-3 text-sm text-amex-text-dim">
        The route you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 border border-amex-gold bg-amex-gold px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amex-black transition hover:bg-amex-gold-hi"
      >
        Calculate a toll
      </Link>
    </main>
  );
}
