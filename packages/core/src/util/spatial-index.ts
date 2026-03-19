/**
 * Longitude-sorted spatial index for fast nearest-point lookups on a polyline.
 *
 * Binary search on longitude narrows candidates from O(n) to O(log n),
 * then a linear scan over nearby points finds the closest point on the polyline.
 *
 * With our 669-point polyline, brute-force is already <1ms so this is
 * overkill. Would start to matter at 10k+ points or frequent lookups.
 */
export class PolylineSpatialIndex {
  private readonly points: Array<[number, number]>;
  private readonly sortedByLng: Array<{ lng: number; idx: number }>;

  constructor(points: Array<[number, number]>) {
    this.points = points;
    this.sortedByLng = points
      .map((p, idx) => ({ lng: p[0], idx }))
      .sort((a, b) => a.lng - b.lng);
  }

  findNearest(target: [number, number]): number {
    const targetLng = target[0];

    // Binary search for the closest longitude
    let lo = 0;
    let hi = this.sortedByLng.length - 1;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.sortedByLng[mid]!.lng < targetLng) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // Scan a window around the match to find the true nearest by 2D distance
    const scanRadius = 10;
    const scanStart = Math.max(0, lo - scanRadius);
    const scanEnd = Math.min(this.sortedByLng.length - 1, lo + scanRadius);

    let bestIdx = this.sortedByLng[lo]!.idx;
    let bestDist = Infinity;

    for (let i = scanStart; i <= scanEnd; i++) {
      const pointIdx = this.sortedByLng[i]!.idx;
      const p = this.points[pointIdx]!;
      const dx = p[0] - target[0];
      const dy = p[1] - target[1];
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = pointIdx;
      }
    }

    return bestIdx;
  }
}
