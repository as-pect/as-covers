import { CoverPoint, CoverPointType } from "./report.js";

export interface CoverPointDiagnosticLocation {
  file: string;
  line: number;
  col: number;
  type: CoverPointType;
}

export interface CoverPointCollisionDiagnostic {
  kind: "id-collision";
  id: number;
  existing: CoverPointDiagnosticLocation;
  incoming: CoverPointDiagnosticLocation;
  message: string;
}

export type CoverPointDiagnostic = CoverPointCollisionDiagnostic;

/** Internal registry for declared cover points and execution events. */
export class CoverPointRegistry {
  private coverPoints = new Map<number, CoverPoint>();
  private diagnosticList: CoverPointDiagnostic[] = [];

  public declare(point: CoverPoint): CoverPoint {
    const existingPoint = this.coverPoints.get(point.id);
    if (!existingPoint) {
      this.coverPoints.set(point.id, point);
      return point;
    }

    if (!this.isSamePoint(existingPoint, point)) {
      this.diagnosticList.push({
        kind: "id-collision",
        id: point.id,
        existing: this.toDiagnosticLocation(existingPoint),
        incoming: this.toDiagnosticLocation(point),
        message: `Cover point id ${point.id} was declared for multiple locations.`,
      });
    }

    return existingPoint;
  }

  public cover(id: number): void {
    const coverPoint = this.coverPoints.get(id);
    if (!coverPoint) return;

    coverPoint.covered = true;
  }

  public reset(): void {
    this.coverPoints.clear();
    this.diagnosticList = [];
  }

  public diagnostics(): CoverPointDiagnostic[] {
    return [...this.diagnosticList];
  }

  public values(): IterableIterator<CoverPoint> {
    return this.coverPoints.values();
  }

  public get size(): number {
    return this.coverPoints.size;
  }

  private isSamePoint(left: CoverPoint, right: CoverPoint): boolean {
    return (
      left.file === right.file &&
      left.line === right.line &&
      left.col === right.col &&
      left.type === right.type
    );
  }

  private toDiagnosticLocation(point: CoverPoint): CoverPointDiagnosticLocation {
    return {
      file: point.file,
      line: point.line,
      col: point.col,
      type: point.type,
    };
  }
}
