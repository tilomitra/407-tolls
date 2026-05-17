export function FreeSectionCallout() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[color:var(--color-ab-emerald)]/20 bg-ab-emerald-deep px-4 py-4">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ab-emerald text-white">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-ab-emerald">
          407 East of Brock Road is toll-free
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ab-text-dim">
          Brock Rd (Pickering) to Hwy 35/115 (Clarington), free since June 2025.
          Highways 412 and 418 are also free.
        </p>
      </div>
    </div>
  );
}
