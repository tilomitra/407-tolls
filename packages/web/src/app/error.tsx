"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-amex-eyebrow">Declined</p>
      <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.16em] text-amex-text">Something went wrong</h1>
      <p className="mt-3 text-sm text-amex-text-dim">
        An unexpected error occurred. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 border border-amex-gold bg-amex-gold px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amex-black transition hover:bg-amex-gold-hi"
      >
        Try again
      </button>
    </main>
  );
}
