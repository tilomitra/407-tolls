"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-ab-text">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-ab-text-dim">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-ab-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ab-gold-hi"
      >
        Try again
      </button>
    </main>
  );
}
