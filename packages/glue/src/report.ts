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

const compareCoverPoints = (left: CoverPoint, right: CoverPoint): number => {
  if (left.line !== right.line) return left.line - right.line;
  if (left.col !== right.col) return left.col - right.col;
  return left.id - right.id;
};

const cloneCoverPoint = (point: CoverPoint): CoverPoint => {
  const clone = new CoverPoint(
    point.file,
    point.line,
    point.col,
    point.id,
    point.type
  );
  clone.covered = point.covered;
  return clone;
};

const functionName = (point: CoverPoint): string => `as_covers_${point.id}`;

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const coveragePointKey = (
  fileReport: CoverageFileReport,
  location: string,
  id: number
): string => {
  if (!Object.prototype.hasOwnProperty.call(fileReport, location)) {
    return location;
  }
  return `${location}#${id}`;
};

/**
 * Model for reports.
 * Calculates input (CoverPoint[]) and outputs statistics.
 */
export class CoverPointReport {
  public coverPoints: CoverPoint[] = [];
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

  /** Calculates the statistics from current cover point state. */
  private calculateStats(): void {
    this.total = 0;
    this.totalCovered = 0;
    this.expressionTotal = 0;
    this.expressionCovered = 0;
    this.blockTotal = 0;
    this.blockCovered = 0;
    this.functionTotal = 0;
    this.functionCovered = 0;

    for (const point of this.coverPoints) {
      const covered = point.covered ? 1 : 0;
      this.total++;
      this.totalCovered += covered;
      // Increment total points, and the covered points.
      switch (point.type) {
        case CoverPointType.Expression: {
          // If its an expression, increment the total expression count.
          this.expressionTotal++;
          // If the expression is covered, increment the expressionCovered variable.
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

    // Just a few checks.
    this.blockCoveredFinite = this.blockTotal !== 0;
    this.expressionCoveredFinite = this.expressionTotal !== 0;
    this.functionCoveredFinite = this.functionTotal !== 0;
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
    const pointSnapshot = cloneCoverPoint(coverPoint);
    const fileName = pointSnapshot.file;

    if (!results.has(fileName))
      results.set(fileName, new CoverPointReport(fileName));

    const report = results.get(fileName)!;
    report.coverPoints.push(pointSnapshot);
    total.coverPoints.push(cloneCoverPoint(pointSnapshot));
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
      const location = `${coverPoint.file}:${coverPoint.line}:${coverPoint.col}`;
      fileReport[coveragePointKey(fileReport, location, coverPoint.id)] = {
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

/** Builds an LCOV adapter from the same report model as other formats. */
export function toLCOV(report: CoverageReportMap): string {
  const records: string[] = ["TN:"];

  for (const [fileName, reportEntry] of report.entries()) {
    if (fileName === "total") continue;

    records.push(`SF:${fileName}`);

    const functionPoints = reportEntry.coverPoints
      .filter((point) => point.type === CoverPointType.Function)
      .sort(compareCoverPoints);

    for (const point of functionPoints) {
      records.push(`FN:${point.line},${functionName(point)}`);
    }

    for (const point of functionPoints) {
      records.push(`FNDA:${point.covered ? 1 : 0},${functionName(point)}`);
    }

    records.push(`FNF:${functionPoints.length}`);
    records.push(
      `FNH:${functionPoints.filter((point) => point.covered).length}`
    );

    const lineHits = new Map<number, number>();
    for (const point of reportEntry.coverPoints) {
      lineHits.set(
        point.line,
        (lineHits.get(point.line) ?? 0) + (point.covered ? 1 : 0)
      );
    }

    const lines = Array.from(lineHits.entries()).sort(
      ([leftLine], [rightLine]) => leftLine - rightLine
    );
    for (const [line, hits] of lines) {
      records.push(`DA:${line},${hits}`);
    }

    records.push(`LF:${lines.length}`);
    records.push(`LH:${lines.filter(([, hits]) => hits > 0).length}`);
    records.push("end_of_record");
  }

  return `${records.join("\n")}\n`;
}

/** Builds a dependency-free HTML summary from the shared report model. */
export function toHTML(report: CoverageReportMap): string {
  const rows: string[] = [];

  for (const [fileName, reportEntry] of report.entries()) {
    if (fileName === "total") continue;

    const uncovered = reportEntry.coverPoints
      .filter((point) => !point.covered)
      .sort(compareCoverPoints)
      .map((point) => `${point.line}:${point.col}`)
      .join(", ");

    rows.push(
      "      <tr>" +
        `<th scope="row">${escapeHTML(fileName)}</th>` +
        `<td>${reportEntry.coveredPercent}</td>` +
        `<td>${reportEntry.coveredBlockPercent}</td>` +
        `<td>${reportEntry.coveredFunctionPercent}</td>` +
        `<td>${reportEntry.coveredExpressionPercent}</td>` +
        `<td>${reportEntry.coveredPointsNumber}</td>` +
        `<td>${reportEntry.uncoveredPointsNumber}</td>` +
        `<td>${escapeHTML(uncovered)}</td>` +
        "</tr>"
    );
  }

  const total = report.get("total");
  const totalRow = total
    ? "      <tr><th scope=\"row\">total</th>" +
      `<td>${total.coveredPercent}</td>` +
      `<td>${total.coveredBlockPercent}</td>` +
      `<td>${total.coveredFunctionPercent}</td>` +
      `<td>${total.coveredExpressionPercent}</td>` +
      `<td>${total.coveredPointsNumber}</td>` +
      `<td>${total.uncoveredPointsNumber}</td><td></td></tr>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>as-covers coverage report</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ccc; padding: 0.4rem; text-align: left; }
    thead, tfoot { background: #f3f3f3; }
  </style>
</head>
<body>
  <h1>as-covers coverage report</h1>
  <table>
    <thead><tr><th>File</th><th>Total</th><th>Block</th><th>Function</th><th>Expression</th><th>Covered</th><th>Uncovered</th><th>Uncovered points</th></tr></thead>
    <tbody>
${rows.join("\n")}
    </tbody>
    <tfoot>
${totalRow}
    </tfoot>
  </table>
</body>
</html>
`;
}
