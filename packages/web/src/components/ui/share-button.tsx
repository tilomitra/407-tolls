"use client";

import { useState, useCallback } from "react";

export function ShareButton({ url }: { url?: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const raw = url ?? window.location.href;
    const shareUrl = raw.startsWith("/") ? `${window.location.origin}${raw}` : raw;

    // Use native share on mobile if available
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <button
      type="button"
      onClick={handleShare}
      className="
        flex items-center gap-1.5 rounded-lg border border-slate-200
        px-3 py-1.5 text-xs font-medium text-slate-600
        transition-all duration-150
        hover:border-slate-300 hover:bg-slate-50
        active:scale-95
      "
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
