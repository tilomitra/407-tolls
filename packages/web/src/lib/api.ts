export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body && typeof body.error === "string" ? body.error : "Request failed";
    throw new ApiError(message, res.status);
  }

  return res.json();
}
