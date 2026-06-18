/**
 * Import micromatch module. (File globbing)
 */
// @ts-ignore
import mm from "micromatch";
/**
 * Import `table` module for report text output
 */
import { table } from "table";

/**
 * Import YAML formatter
 */
import yaml from "yaml";

import { CoverPointRegistry } from "./registry.js";
import type { CoverPointDiagnostic } from "./registry.js";
import {
  CoverPoint,
  CoverPointType,
  createCoverageReport,
  toCoverageReportObject,
  toHTML as formatHTML,
  toLCOV as formatLCOV,
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

/** This configuration is used for ascii table output. */
const tableConfig = {
  border: {
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
  },
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
      files: ["**/*.*"],
      strict: false,
      ...options,
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
    const filePath = this.loader!.exports.__getString(filePtr);
    // Ignore if it shouldn't be covered.
    if (!mm.isMatch(filePath, this.options.files)) {
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
    // Returns an array formatted with the `table` module. Makes it look really nice!
    return table(
      [
        // Main titles for columns
        ["File", "Total", "Block", "Func", "Expr", "Uncovered"],
        // Loops over all files and generates a report for each.
        ...Array.from(report).map(([file, rep], i) => {
          const uncoveredPoints = rep.coverPoints.filter((val) => !val.covered);
          return [
            // File name
            file,
            // Total covered for that file (percent)
            rep.coveredPercent,
            // Block percent
            rep.coveredBlockPercent,
            // Func percentage
            rep.coveredFunctionPercent,
            // Expr Percentage
            rep.coveredExpressionPercent,
            // Some stuff to limit uncovered points length.
            i === report.size - 1
              ? ""
              : uncoveredPoints.length > 6
              ? `${uncoveredPoints.slice(0, 6).map(linecolText).join(", ")}...`
              : uncoveredPoints.map(linecolText).join(", "),
          ];
        }),
      ],
      // Table config. (top)
      tableConfig
    );
  }

  /**
   * Outputs report as YAML
   * @returns String
   */

  public toYAML(): string {
    return yaml.stringify(toCoverageReportObject(this.createReport()));
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
