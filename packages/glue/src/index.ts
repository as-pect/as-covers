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
 * TODO: later.
 */
export type CoverageRenderConfiguration = {
  width: number;
};

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

/**
 * Model for reports.
 * Calculates input (CoverPoint[]) and outputs statistics
 */
class CoverPointReport {
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

/**
 * Covers option interface
 */
interface ICoversOptions {
  files?: Array<string>;
}

/**
 * The main class. It houses the initializer, imports, and bindings.
 */
export class Covers {
  private coverPoints = new Map<number, CoverPoint>();
  // Its any because I can't find the type.
  private loader: any;

  constructor(
    public options: ICoversOptions = {
      files: ["**/*.*"],
    }
  ) {}

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
    console.log("registering loader", loader);
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
    console.log("-- Declaring cover point. --", id);
    // Cover points are immutable. (so it's already been added)
    if (this.coverPoints.has(id)) return;
    // Get filePath. Needs --exportRuntime flag.
    const filePath = this.loader!.exports.__getString(filePtr);
    // Ignore if it shouldn't be covered.
    if (!mm.isMatch(filePath, this.options.files)) return;
    // Create new CoverPoint and add it to the main points.
    let coverPoint = new CoverPoint(filePath, line, col, id, coverType);
    // Sets CoverPoint inside of this.coverPoints
    this.coverPoints.set(id, coverPoint);
  }

  /**
   * Lets Covers know if a cover point has been executed.
   * @param id - The id of the point.
   */
  private cover(id: number): void {
    // If it should be ignored, return.
    if (!this.coverPoints.has(id)) return;
    // Grab the CoverPoint
    let coverPoint = this.coverPoints.get(id)!;
    // Set it to covered
    coverPoint.covered = true;
  }

  /**
   * Clears all coverPoints.
   * Useful if user wants to clear everything.
   * Will result in an error if anything is executed afterwards.
   */
  public reset(): void {
    // Clear (Very very unsafe!)
    this.coverPoints.clear();
  }

  /**
   * Basic report.
   * Splits everything up into files and calculates statistics.
   * Gets the total statistics and pushes it to the end.
   * @returns Map<string, CoverPointReport>
   */
  public createReport(): Map<string, CoverPointReport> {
    // The model map to return.
    const results = new Map<string, CoverPointReport>();
    // Create total statistics. (Appears at the end.)
    const total = new CoverPointReport("total");

    for (const [_, coverPoint] of this.coverPoints) {
      // Grab filename
      const fileName = coverPoint.file;

      if (!results.has(fileName))
        results.set(fileName, new CoverPointReport(fileName));
      // Ensure it exists

      const report = results.get(fileName)!;
      // Grab report

      // Push stuff to the report and total
      report.coverPoints.push(coverPoint);
      total.coverPoints.push(coverPoint);
    }
    results.set("total", total);

    // Return it.
    return results;
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
    // Create the report
    const report = this.createReport();
    report.delete("total");
    // Result object
    let result = {};
    // Loop over entries
    for (const [path, reportEntry] of report.entries()) {
      // @ts-ignore
      // Add path if it isn't there.
      if (!result[path]) result[path] = {};
      // @ts-ignore
      // Add basic overview for that file
      result[path]["overview"] = {
        covered: reportEntry.coveredPointsNumber,
        uncovered: reportEntry.uncoveredPointsNumber,
        total: reportEntry.coveredPercent,
        types: {
          block: reportEntry.coveredBlockPercent,
          function: reportEntry.coveredFunctionPercent,
          expression: reportEntry.expressionCoveredFinite,
        },
      };

      // insert the data
      for (const coverPoint of reportEntry.coverPoints) {
        // @ts-ignore
        const data = (result[path][
          // Gets the file and location.
          `${coverPoint.file}:${coverPoint.line}:${coverPoint.col}`
        ] = {});
        // @ts-ignore
        // Add covered prop
        data["covered"] = coverPoint.covered;
        // @ts-ignore
        // add id prop
        data["id"] = coverPoint.id;
        // @ts-ignore
        // add file prop
        data["file"] = coverPoint.file;
        // @ts-ignore
        // add col prop
        data["column"] = coverPoint.col;
        // @ts-ignore
        // add line prop
        data["line"] = coverPoint.line;
      }
    }
    return yaml.stringify(result);
  }
  /**
   * Outputs report as CSV
   * @returns String
   */
  public toCSV(): string {
    let result = "File,Covered,ID,Column,Line\n";
    const report = this.createReport();
    for (const [_, reportEntry] of report.entries()) {
      for (const coverPoint of reportEntry.coverPoints) {
        let res = [];
        // File and location
        res.push(coverPoint.file);
        // Add covered prop
        res.push(coverPoint.covered ? "true" : "false");
        // add id prop
        res.push(coverPoint.id.toString());
        // add col prop
        res.push(coverPoint.col.toString());
        // add line prop
        res.push(coverPoint.line.toString());

        // Push it all to result (CSV Format)
        result += `${res.join(",")}\n`;
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
  public toJSON(): Object {
    // Create the report
    const report = this.createReport();
    report.delete("total");
    // Result object
    let result = {};
    // Loop over entries
    for (const [path, reportEntry] of report.entries()) {
      // @ts-ignore
      // Add path if it isn't there.
      if (!result[path]) result[path] = {};
      // @ts-ignore
      // Add basic overview for that file
      result[path]["overview"] = {
        covered: reportEntry.coveredPointsNumber,
        uncovered: reportEntry.uncoveredPointsNumber,
        total: reportEntry.coveredPercent,
        types: {
          block: reportEntry.coveredBlockPercent,
          function: reportEntry.coveredFunctionPercent,
          expression: reportEntry.expressionCoveredFinite,
        },
      };

      // insert the data
      for (const coverPoint of reportEntry.coverPoints) {
        // @ts-ignore
        const data = (result[path][
          // Gets the file and location.
          `${coverPoint.file}:${coverPoint.line}:${coverPoint.col}`
        ] = {});
        // @ts-ignore
        // Add covered prop
        data["covered"] = coverPoint.covered;
        // @ts-ignore
        // add id prop
        data["id"] = coverPoint.id;
        // @ts-ignore
        // add file prop
        data["file"] = coverPoint.file;
        // @ts-ignore
        // add col prop
        data["column"] = coverPoint.col;
        // @ts-ignore
        // add line prop
        data["line"] = coverPoint.line;
      }
    }
    return result;
  }
}
