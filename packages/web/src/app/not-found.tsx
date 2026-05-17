import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl font-bold text-ab-gold">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ab-text">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-ab-text-dim">
        The route you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-ab-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ab-gold-hi"
      >
        Plan a trip
      </Link>
    </main>
  );
}
