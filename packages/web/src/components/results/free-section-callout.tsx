export function FreeSectionCallout() {
  return (
    <div className="flex items-start gap-3 border border-[color:var(--color-amex-emerald)]/40 bg-amex-emerald-deep/30 px-4 py-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-[color:var(--color-amex-emerald)]/50 bg-amex-black">
        <svg className="h-3 w-3 text-amex-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-amex-emerald">
          407 East of Brock Road is toll-free
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-amex-text-dim">
          Brock Rd (Pickering) to Hwy 35/115 (Clarington), free since June 2025.
          Highways 412 and 418 are also free.
        </p>
      </div>
    </div>
  );
}
