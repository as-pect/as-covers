/**
 * Import micromatch module. (File globbing)
 */
// @ts-ignore
import mm from "micromatch";
import { CoverPointRegistry } from "./registry.js";
import type { CoverPointDiagnostic } from "./registry.js";
import {
  CoverPoint,
  CoverPointType,
  createCoverageReport,
  toCoverageReportObject,
  toHTML as formatHTML,
  toLCOV as formatLCOV,
  toYAML as formatYAML,
} from "./report.js";
import type { CoverageReportMap, CoverageReportObject } from "./report.js";

export { CoverPoint, CoverPointReport, CoverPointType } from "./report.js";
export type {
  CoverageFileReport,
  CoverageOverview,
  CoveragePointEntry,
  CoverageReportMap,
  CoverageReportObject,
} from "./report.js";
export type {
  CoverPointCollisionDiagnostic,
  CoverPointDiagnostic,
  CoverPointDiagnosticLocation,
  UnknownCoverDiagnostic,
} from "./registry.js";

const tableBorder = {
  topBody: `─`,
  topJoin: `┬`,
  topLeft: `┌`,
  topRight: `┐`,

  bottomBody: `─`,
  bottomJoin: `┴`,
  bottomLeft: `└`,
  bottomRight: `┘`,

  bodyLeft: `│`,
  bodyRight: `│`,
  bodyJoin: `│`,

  joinBody: `─`,
  joinLeft: `├`,
  joinRight: `┤`,
  joinJoin: `┼`,
};

const renderTableSeparator = (
  widths: number[],
  left: string,
  body: string,
  join: string,
  right: string
): string =>
  `${left}${widths
    .map((width) => body.repeat(width + 2))
    .join(join)}${right}\n`;

const renderTableRow = (row: string[], widths: number[]): string =>
  `${tableBorder.bodyLeft}${row
    .map((cell, index) => ` ${cell.padEnd(widths[index] ?? 0)} `)
    .join(tableBorder.bodyJoin)}${tableBorder.bodyRight}\n`;

const renderTextTable = (rows: string[][]): string => {
  if (rows.length === 0) return "";

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalizedRows = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index] ?? "")
  );
  const widths = Array.from({ length: columnCount }, (_, index) =>
    Math.max(...normalizedRows.map((row) => row[index]?.length ?? 0))
  );

  let result = renderTableSeparator(
    widths,
    tableBorder.topLeft,
    tableBorder.topBody,
    tableBorder.topJoin,
    tableBorder.topRight
  );
  result += renderTableRow(normalizedRows[0] ?? [], widths);
  result += renderTableSeparator(
    widths,
    tableBorder.joinLeft,
    tableBorder.joinBody,
    tableBorder.joinJoin,
    tableBorder.joinRight
  );
  for (const row of normalizedRows.slice(1)) {
    result += renderTableRow(row, widths);
  }
  result += renderTableSeparator(
    widths,
    tableBorder.bottomLeft,
    tableBorder.bottomBody,
    tableBorder.bottomJoin,
    tableBorder.bottomRight
  );
  return result;
};

/**
 *
 * @param point - The coverpoint to get the `line:col` of.
 * @returns string
 */
const linecolText = (point: CoverPoint) => `${point.line}:${point.col}`;

const csvCell = (value: string): string => {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, `""`)}"`;
};

const csvRow = (values: string[]): string =>
  `${values.map(csvCell).join(",")}\n`;

/**
 * TODO: later.
 */
export type CoverageRenderConfiguration = {
  width: number;
};

/**
 * Options for configuring coverage collection.
 */
export interface CoversOptions {
  files?: Array<string>;
  strict?: boolean;
}

/**
 * The main class. It houses the initializer, imports, and bindings.
 */
export class Covers {
  private registry = new CoverPointRegistry();
  private ignoredCoverPointIds = new Set<number>();
  public options: CoversOptions;
  // Its any because I can't find the type.
  private loader: any;

  constructor(options: CoversOptions = {}) {
    this.options = {
      files: [...(options.files ?? ["**/*.*"])],
      strict: options.strict === true,
    };
  }

  /**
   * Installs the as-covers imports into the loaded's imports object.
   * @param imports - loader
   * @returns - loader
   */
  installImports(imports: any): any {
    imports.__asCovers = {
      cover: this.cover.bind(this),
      coverDeclare: this.coverDeclare.bind(this),
    };
    return imports;
  }

  /**
   * Sets this.loader to the loader. Lets this access the external loader.
   * @param loader - loader
   */
  registerLoader(loader: any): void {
    this.loader = loader;
  }

  /**
   * Tells Covers that a specific line/column should be executed (cover(id)).
   * Adds id to main coverPoints
   * @param filePtr - The pointer to the filename
   * @param id - A specific hash representing the file, col, and line.
   * @param line - Specifies which line it should occur on
   * @param col - Specifies which column it should occur on
   * @param coverType - Enum value. Function, Exression, or Block.
   */

  private coverDeclare(
    filePtr: number,
    id: number,
    line: number,
    col: number,
    coverType: CoverPointType
  ): void {
    // Get filePath. Needs --exportRuntime flag.
    const getString = this.loader?.exports?.__getString;
    if (typeof getString !== "function") {
      throw new Error(
        "Covers.registerLoader(loader) must be called before coverage declarations run."
      );
    }
    const filePath = getString.call(this.loader.exports, filePtr);
    if (typeof filePath !== "string") {
      throw new Error(
        "Covers loader __getString(filePtr) must return a source file string."
      );
    }
    // Ignore if it shouldn't be covered.
    const filePatterns = this.options.files ?? ["**/*.*"];
    if (!mm.isMatch(filePath, filePatterns)) {
      this.ignoredCoverPointIds.add(id);
      return;
    }
    this.ignoredCoverPointIds.delete(id);
    // Create new CoverPoint and add it to the registry.
    const coverPoint = new CoverPoint(filePath, line, col, id, coverType);
    this.registry.declare(coverPoint);
  }

  /**
   * Lets Covers know if a cover point has been executed.
   * @param id - The id of the point.
   */
  private cover(id: number): void {
    if (this.ignoredCoverPointIds.has(id)) return;
    this.registry.cover(id, this.options.strict === true);
  }

  /**
   * Clears execution state while preserving declared cover points.
   */
  public resetCoverage(): void {
    this.registry.resetCoverage();
  }

  /**
   * Clears declared cover points and diagnostics.
   */
  public clearDeclarations(): void {
    this.registry.clearDeclarations();
    this.ignoredCoverPointIds.clear();
  }

  /**
   * Backward-compatible alias for clearing declared cover points.
   */
  public reset(): void {
    this.clearDeclarations();
  }

  public diagnostics(): CoverPointDiagnostic[] {
    return this.registry.diagnostics();
  }

  /**
   * Basic report.
   * Splits everything up into files and calculates statistics.
   * Gets the total statistics and pushes it to the end.
   * @returns Map<string, CoverPointReport>
   */
  public createReport(): CoverageReportMap {
    return createCoverageReport(this.registry.values());
  }

  /**
   * Returns a table that can be logged.
   * Provides a basic visual overview of statistics.
   * @returns string - Table
   */
  public stringify(): string {
    // Grab report statistics
    const report = this.createReport();
    return renderTextTable([
      ["File", "Total", "Block", "Func", "Expr", "Uncovered"],
      ...Array.from(report).map(([file, rep], i) => {
        const uncoveredPoints = rep.coverPoints.filter((val) => !val.covered);
        return [
          file,
          rep.coveredPercent,
          rep.coveredBlockPercent,
          rep.coveredFunctionPercent,
          rep.coveredExpressionPercent,
          i === report.size - 1
            ? ""
            : uncoveredPoints.length > 6
            ? `${uncoveredPoints.slice(0, 6).map(linecolText).join(", ")}...`
            : uncoveredPoints.map(linecolText).join(", "),
        ];
      }),
    ]);
  }

  /**
   * Outputs report as YAML
   * @returns String
   */

  public toYAML(): string {
    return formatYAML(this.createReport());
  }
  /**
   * Outputs report as LCOV.
   * @returns String
   */
  public toLCOV(): string {
    return formatLCOV(this.createReport());
  }

  /**
   * Outputs report as HTML.
   * @returns String
   */
  public toHTML(): string {
    return formatHTML(this.createReport());
  }

  /**
   * Outputs report as CSV
   * @returns String
   */
  public toCSV(): string {
    let result = csvRow(["File", "Covered", "ID", "Column", "Line"]);
    const report = this.createReport();
    for (const [file, reportEntry] of report.entries()) {
      if (file === "total") continue;

      for (const coverPoint of reportEntry.coverPoints) {
        result += csvRow([
          coverPoint.file,
          coverPoint.covered ? "true" : "false",
          coverPoint.id.toString(),
          coverPoint.col.toString(),
          coverPoint.line.toString(),
        ]);
      }
    }
    // Resolve CSV
    return result;
  }
  /**
   * Output a JSON report.
   * Provides a report that can be easily read or saved. (.json)
   * @returns Object
   */
  public toJSON(): CoverageReportObject {
    return toCoverageReportObject(this.createReport());
  }
}
