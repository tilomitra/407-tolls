// API responses are fresh for 1 hour, then served stale for up to 1 day while revalidating.
export const API_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
} as const;
