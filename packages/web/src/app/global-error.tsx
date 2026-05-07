"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-black text-stone-100">
        <div className="max-w-md px-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.32em]" style={{ color: "#c5a572" }}>
            Declined
          </p>
          <h1 className="mt-2 text-3xl font-bold uppercase tracking-[0.16em]">Something went wrong</h1>
          <p className="mt-3 text-sm" style={{ color: "#a3a09a" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition"
            style={{ background: "#c5a572", color: "#000", border: "1px solid #dcc28e" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
