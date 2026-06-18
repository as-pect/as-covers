import { CoverPoint } from "./report.js";

/** Internal registry for declared cover points and execution events. */
export class CoverPointRegistry {
  private coverPoints = new Map<number, CoverPoint>();

  public declare(point: CoverPoint): CoverPoint {
    const existingPoint = this.coverPoints.get(point.id);
    if (existingPoint) return existingPoint;

    this.coverPoints.set(point.id, point);
    return point;
  }

  public cover(id: number): void {
    const coverPoint = this.coverPoints.get(id);
    if (!coverPoint) return;

    coverPoint.covered = true;
  }

  public reset(): void {
    this.coverPoints.clear();
  }

  public values(): IterableIterator<CoverPoint> {
    return this.coverPoints.values();
  }

  public get size(): number {
    return this.coverPoints.size;
  }
}
