export function FreeSectionCallout() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
        <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-emerald-900">
          407 East of Brock Road is toll-free
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-emerald-700">
          Brock Rd (Pickering) to Hwy 35/115 (Clarington) — free since June 2025.
          Highways 412 and 418 are also free.
        </p>
      </div>
    </div>
  );
}
