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

export interface UnknownCoverDiagnostic {
  kind: "unknown-cover";
  id: number;
  message: string;
}

export type CoverPointDiagnostic =
  | CoverPointCollisionDiagnostic
  | UnknownCoverDiagnostic;

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
      this.recordDiagnostic({
        kind: "id-collision",
        id: point.id,
        existing: this.toDiagnosticLocation(existingPoint),
        incoming: this.toDiagnosticLocation(point),
        message: `Cover point id ${point.id} was declared for multiple locations.`,
      });
    }

    return existingPoint;
  }

  public cover(id: number, strict = false): void {
    const coverPoint = this.coverPoints.get(id);
    if (!coverPoint) {
      const diagnostic: UnknownCoverDiagnostic = {
        kind: "unknown-cover",
        id,
        message: `Unknown cover point id ${id} was executed before declaration.`,
      };
      this.recordDiagnostic(diagnostic);
      if (strict) throw new Error(diagnostic.message);
      return;
    }

    coverPoint.covered = true;
  }

  public resetCoverage(): void {
    for (const coverPoint of this.coverPoints.values()) {
      coverPoint.covered = false;
    }
  }

  public clearDeclarations(): void {
    this.coverPoints.clear();
    this.diagnosticList = [];
  }

  public reset(): void {
    this.clearDeclarations();
  }

  public diagnostics(): CoverPointDiagnostic[] {
    return this.diagnosticList.map((diagnostic) =>
      this.cloneDiagnostic(diagnostic)
    );
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

  private cloneDiagnostic(
    diagnostic: CoverPointDiagnostic
  ): CoverPointDiagnostic {
    if (diagnostic.kind === "unknown-cover") {
      return { ...diagnostic };
    }

    return {
      ...diagnostic,
      existing: { ...diagnostic.existing },
      incoming: { ...diagnostic.incoming },
    };
  }

  private recordDiagnostic(diagnostic: CoverPointDiagnostic): void {
    if (
      this.diagnosticList.some((existing) =>
        this.isSameDiagnostic(existing, diagnostic)
      )
    ) {
      return;
    }

    this.diagnosticList.push(diagnostic);
  }

  private isSameDiagnostic(
    left: CoverPointDiagnostic,
    right: CoverPointDiagnostic
  ): boolean {
    if (left.kind !== right.kind || left.id !== right.id) return false;
    if (left.kind === "unknown-cover" && right.kind === "unknown-cover") {
      return true;
    }

    if (left.kind === "id-collision" && right.kind === "id-collision") {
      return (
        this.isSameLocation(left.existing, right.existing) &&
        this.isSameLocation(left.incoming, right.incoming)
      );
    }

    return false;
  }

  private isSameLocation(
    left: CoverPointDiagnosticLocation,
    right: CoverPointDiagnosticLocation
  ): boolean {
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
