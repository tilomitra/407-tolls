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

    // Binary search on longitude. Close but not exact since
    // same lng can be far in lat where the road curves.
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

    // Check 10 polyline points on each side by actual 2D distance.
    const scanRadius = 10;
    const scanStart = Math.max(0, lo - scanRadius);
    const scanEnd = Math.min(this.sortedByLng.length - 1, lo + scanRadius);

    let bestIdx = this.sortedByLng[lo]!.idx;
    let bestDist = Infinity;

    for (let i = scanStart; i <= scanEnd; i++) {
      const polylineIdx = this.sortedByLng[i]!.idx;
      const coord = this.points[polylineIdx]!;
      const dx = coord[0] - target[0];
      const dy = coord[1] - target[1];
      const dist = dx * dx + dy * dy;
      
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = polylineIdx;
      }
    }

    return bestIdx;
  }
}
