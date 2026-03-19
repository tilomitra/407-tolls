export function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatLargeDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
