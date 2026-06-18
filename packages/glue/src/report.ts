/**
 * Generic enum for basic types.
 * - Function (0)
 * - Block (1)
 * - Expression (2)
 */
export enum CoverPointType {
  Function,
  Block,
  Expression,
}

/**
 * Data model. Represents file name, line, column, type (enum), and id.
 */
export class CoverPoint {
  public covered: boolean = false;
  constructor(
    public file: string,
    public line: number,
    public col: number,
    public id: number,
    public type: CoverPointType
  ) {}
}

/** A report row for one declared cover point. */
export interface CoveragePointEntry {
  covered: boolean;
  id: number;
  file: string;
  column: number;
  line: number;
}

/** Coverage percentages and counts for a file or total row. */
export interface CoverageOverview {
  covered: number;
  uncovered: number;
  total: string;
  types: {
    block: string;
    function: string;
    expression: string;
  };
}

/** Object report for one source file, keyed by point location. */
export interface CoverageFileReport {
  overview: CoverageOverview;
  [location: string]: CoverageOverview | CoveragePointEntry;
}

/** JSON/YAML-ready report object keyed by source file. */
export type CoverageReportObject = Record<string, CoverageFileReport>;

export type CoverageReportMap = Map<string, CoverPointReport>;

/**
 * Model for reports.
 * Calculates input (CoverPoint[]) and outputs statistics.
 */
export class CoverPointReport {
  public coverPoints: CoverPoint[] = [];
  private calculated: boolean = false;
  private total: number = 0;
  private totalCovered: number = 0;
  private expressionTotal: number = 0;
  private expressionCovered: number = 0;
  public expressionCoveredFinite: boolean = true;
  private blockTotal: number = 0;
  private blockCovered: number = 0;
  public blockCoveredFinite: boolean = true;
  private functionTotal: number = 0;
  private functionCovered: number = 0;
  public functionCoveredFinite: boolean = true;

  /** Calculates the statistics. */
  private calculateStats(): void {
    if (this.calculated) {
      // If already calculated, don't do it again.
      return;
    }
    for (const point of this.coverPoints) {
      const covered = point.covered ? 1 : 0;
      this.total++;
      this.totalCovered += covered;
      // Increment total points, and the covered points.
      switch (point.type) {
        case CoverPointType.Expression: {
          // If its an expression, increment the total expression count.
          this.expressionTotal++;
          // If the expression is covered, increment the exressionCovered variable.
          this.expressionCovered += covered;
          break;
        }
        case CoverPointType.Block: {
          // If its a block, increment the total block count.
          this.blockTotal++;
          // If the block is covered, increment the blockCovered variable.
          this.blockCovered += covered;
          break;
        }
        case CoverPointType.Function: {
          // If its a function, increment the total function count.
          this.functionTotal++;
          // If the function is covered, increment the functionCovered variable.
          this.functionCovered += covered;
          break;
        }
      }
    }
    // Set calculated to true. Prevents you from re-calculating. (not needed)
    this.calculated = true;
    // Just a few checks.
    if (this.blockTotal === 0) this.blockCoveredFinite = false;
    if (this.expressionTotal === 0) this.expressionCoveredFinite = false;
    if (this.functionTotal === 0) this.functionCoveredFinite = false;
  }

  /** Sets this.fileName to a string. */
  constructor(public fileName: string) {}

  /**  Gets the covered percentage as a string. */
  public get coveredPercent(): string {
    this.calculateStats();
    if (this.total === 0) return `N/A`;
    return `${Math.round(10 * (this.totalCovered / this.total) * 100) / 10}%`;
  }

  /** Gets the covered block percentage as a string.*/
  public get coveredBlockPercent(): string {
    this.calculateStats();
    if (this.blockTotal === 0) return `N/A`;
    return `${
      Math.round(10 * (this.blockCovered / this.blockTotal) * 100) / 10
    }%`;
  }

  /** Gets the covered expression percentage as a string. */
  public get coveredExpressionPercent(): string {
    this.calculateStats();
    if (this.expressionTotal === 0) return `N/A`;
    return `${
      Math.round(10 * (this.expressionCovered / this.expressionTotal) * 100) /
      10
    }%`;
  }

  /** Gets the covered function percentage as a string.*/
  public get coveredFunctionPercent(): string {
    this.calculateStats();
    if (this.functionTotal === 0) return `N/A`;
    return `${
      Math.round(10 * (this.functionCovered / this.functionTotal) * 100) / 10
    }%`;
  }

  /** Outputs the total number of covered points.*/
  public get coveredPointsNumber(): number {
    return this.coverPoints.filter((val) => val.covered).length;
  }

  /** Outputs the total number of uncovered points.*/
  public get uncoveredPointsNumber(): number {
    return this.coverPoints.filter((val) => !val.covered).length;
  }
}

/** Splits cover points into per-file reports and a total row. */
export function createCoverageReport(
  coverPoints: Iterable<CoverPoint>
): CoverageReportMap {
  const results: CoverageReportMap = new Map<string, CoverPointReport>();
  const total = new CoverPointReport("total");

  for (const coverPoint of coverPoints) {
    const fileName = coverPoint.file;

    if (!results.has(fileName))
      results.set(fileName, new CoverPointReport(fileName));

    const report = results.get(fileName)!;
    report.coverPoints.push(coverPoint);
    total.coverPoints.push(coverPoint);
  }

  results.set("total", total);
  return results;
}

/** Builds the object shape shared by JSON and YAML adapters. */
export function toCoverageReportObject(
  report: CoverageReportMap,
  includeTotal = false
): CoverageReportObject {
  const result: CoverageReportObject = {};

  for (const [path, reportEntry] of report.entries()) {
    if (!includeTotal && path === "total") continue;

    const fileReport: CoverageFileReport = {
      overview: {
        covered: reportEntry.coveredPointsNumber,
        uncovered: reportEntry.uncoveredPointsNumber,
        total: reportEntry.coveredPercent,
        types: {
          block: reportEntry.coveredBlockPercent,
          function: reportEntry.coveredFunctionPercent,
          expression: reportEntry.coveredExpressionPercent,
        },
      },
    };

    for (const coverPoint of reportEntry.coverPoints) {
      fileReport[
        `${coverPoint.file}:${coverPoint.line}:${coverPoint.col}`
      ] = {
        covered: coverPoint.covered,
        id: coverPoint.id,
        file: coverPoint.file,
        column: coverPoint.col,
        line: coverPoint.line,
      };
    }

    result[path] = fileReport;
  }

  return result;
}
