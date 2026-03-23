import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-500">
        The route you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        Calculate a toll
      </Link>
    </main>
  );
}
