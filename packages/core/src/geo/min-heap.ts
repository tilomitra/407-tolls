/**
 * Fixed-capacity max-heap that retains only the k smallest items seen.
 *
 * How it works:
 *   - The heap is a max-heap, so the LARGEST of the k items is always at the root.
 *   - For each new item, if it's smaller than the root, it replaces the root
 *     and gets bubbled down to restore heap order.
 *   - Items larger than the root are discarded — they can't be in the top k.
 *   - drain() extracts items in ascending order by repeatedly removing the root.
 *
 * Time:  O(n log k) for n pushes, O(k log k) for drain
 * Space: O(k)
 */
export class BoundedMaxHeap<T> {
  private heap: T[];
  private readonly compare: (a: T, b: T) => number;
  readonly capacity: number;

  constructor({
    capacity,
    compare,
  }: {
    capacity: number;
    compare: (a: T, b: T) => number;
  }) {
    this.capacity = capacity;
    this.compare = compare;
    this.heap = [];
  }

  get size(): number {
    return this.heap.length;
  }

  push(item: T): void {
    if (this.heap.length < this.capacity) {
      this.heap.push(item);
      this.bubbleUp(this.heap.length - 1);
    } else if (this.compare(item, this.heap[0]!) < 0) {
      // New item is smaller than the largest in our top-k — replace root
      this.heap[0] = item;
      this.bubbleDown(0);
    }
  }

  drain(): T[] {
    const result: T[] = new Array(this.heap.length);
    for (let i = this.heap.length - 1; i >= 0; i--) {
      result[i] = this.heap[0]!;
      this.heap[0] = this.heap.pop()!;
      if (this.heap.length > 0) this.bubbleDown(0);
    }
    return result;
  }

  /**
   * Move item at index i UP toward the root while it's larger than its parent.
   * Used after inserting at the bottom of the heap.
   */
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.heap[i]!, this.heap[parent]!) <= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  /**
   * Move item at index i DOWN by swapping with its largest child.
   * Used after replacing the root to restore max-heap property.
   */
  private bubbleDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && this.compare(this.heap[left]!, this.heap[largest]!) > 0) {
        largest = left;
      }
      if (right < n && this.compare(this.heap[right]!, this.heap[largest]!) > 0) {
        largest = right;
      }
      if (largest === i) break;

      this.swap(i, largest);
      i = largest;
    }
  }

  private swap(i: number, j: number): void {
    const tmp = this.heap[i]!;
    this.heap[i] = this.heap[j]!;
    this.heap[j] = tmp;
  }
}
