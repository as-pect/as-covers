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

import { table } from "table";

const linecol = (point: CoverPoint) => `${point.line}:${point.col}`;

export enum CoverPointType {
  Function,
  Block,
  Expression,
}

export type CoverageRenderConfiguration = {
  width: number;
};

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

  private calculateStats(): void {
    if (this.calculated) {
      return;
    }
    for (const point of this.coverPoints) {
      const covered = point.covered ? 1 : 0;
      this.total++;
      this.totalCovered += covered;
      switch (point.type) {
        case CoverPointType.Expression: {
          this.expressionTotal++;
          this.expressionCovered += covered;
          break;
        }
        case CoverPointType.Block: {
          this.blockTotal++;
          this.blockCovered += covered;
          break;
        }
        case CoverPointType.Function: {
          this.functionTotal++;
          this.functionCovered += covered;
          break;
        }
      }
    }
    this.calculated = true;
    if (this.blockTotal === 0) this.blockCoveredFinite = false;
    if (this.expressionTotal === 0) this.expressionCoveredFinite = false;
    if (this.functionTotal === 0) this.functionCoveredFinite = false;
  }
  constructor(public fileName: string) {}
  public get coveredPercent(): string {
    this.calculateStats();
    if (this.total === 0) return `N/A%`;
    return `${Math.round(10 * (this.totalCovered / this.total) * 100) / 10}%`;
  }
  public get coveredBlockPercent(): string {
    this.calculateStats();
    if (this.blockTotal === 0) return `N/A%`;
    return `${Math.round(10 * (this.blockCovered / this.blockTotal) * 100) / 10}%`;
  }
  public get coveredExpressionPercent(): string {
    this.calculateStats();
    if (this.expressionTotal === 0) return `N/A%`;
    return `${
      Math.round(10 * (this.expressionCovered / this.expressionTotal) * 100) /
      10
    }%`;
  }
  public get coveredFunctionPercent(): string {
    this.calculateStats();
    if (this.functionTotal === 0) return `N/A%`;
    return `${
      Math.round(10 * (this.functionCovered / this.functionTotal) * 100) / 10
    }%`;
  }
}

export class Covers {
  private coverPoints = new Map<number, CoverPoint>();
  // @ts-ignore
  private loader: any;

  installImports(imports: any): any {
    imports.__asCovers = {
      cover: this.cover.bind(this),
      coverDeclare: this.coverDeclare.bind(this),
    };
    return imports;
  }

  registerLoader(loader: any): void {
    this.loader = loader;
  }

  private coverDeclare(
    filePtr: number,
    id: number,
    line: number,
    col: number,
    coverType: CoverPointType
  ): void {
    const filePath = this.loader!.exports.__getString(filePtr);
    let coverPoint = new CoverPoint(filePath, line, col, id, coverType);
    //if (this.coverPoints.has(id))
    //throw new Error("Cannot add dupliate cover point.");
    this.coverPoints.set(id, coverPoint);
  }

  private cover(id: number): void {
    if (!this.coverPoints.has(id))
      throw new Error("Cannot cover point that does not exist.");
    let coverPoint = this.coverPoints.get(id)!;
    coverPoint.covered = true;
  }

  public reset(): void {
    this.coverPoints.clear();
  }

  public createReport(): Map<string, CoverPointReport> {
    const results = new Map<string, CoverPointReport>();

    for (const [_, coverPoint] of this.coverPoints) {
      const fileName = coverPoint.file;

      if (!results.has(fileName))
        results.set(fileName, new CoverPointReport(fileName));
      // Ensure it exists

      const report = results.get(fileName)!;
      // Grab report

      report.coverPoints.push(coverPoint);
    }

    return results;
  }

  public stringify(): string {
    const report = this.createReport();
    return table(
      [
        ["File", "Total", "Block", "Func", "Expr", "Uncovered"],
        ...Array.from(report).map(([file, rep]) => {
          const uncoveredPoints = rep.coverPoints.filter((val) => !val.covered);
          return [
            file,
            rep.coveredPercent,
            rep.coveredBlockPercent,
            rep.coveredFunctionPercent,
            rep.coveredExpressionPercent,
            uncoveredPoints.length > 6
              ? `${uncoveredPoints.slice(0, 6).map(linecol).join(", ")},...`
              : uncoveredPoints.map(linecol).join(", "),
          ];
        }),
      ],
      tableConfig
    );
  }
  // Output as a JSON object. Useful for viewing and manipulating results.
  public toJSON(): Object {
    const report = this.createReport()
    let result = {}
    for (const [path, reportEntry] of report.entries()) {
      const coveredPoints = reportEntry.coverPoints.filter((val) => val.covered);
      const uncoveredPoints = reportEntry.coverPoints.filter((val) => !val.covered);
      // @ts-ignore
      result['overview'] = {
        covered: coveredPoints.length,
        uncovered: uncoveredPoints.length,
        types: {
          total: reportEntry.coveredPercent,
          block: reportEntry.coveredBlockPercent,
          function: reportEntry.coveredFunctionPercent,
          expression: reportEntry.expressionCoveredFinite,
        }
      }
      // @ts-ignore
      if (!result[path]) result[path] = {}

      for (const coverPoint of reportEntry.coverPoints) {
        // @ts-ignore
        const data = result[path][`${coverPoint.file}:${coverPoint.line}:${coverPoint.col}`] = {}
        // @ts-ignore
        data['covered'] = coverPoint.covered
        // @ts-ignore
        data['id'] = coverPoint.id
        // @ts-ignore
        data['file'] = coverPoint.file
        // @ts-ignore
        data['column'] = coverPoint.col
        // @ts-ignore
        data['line'] = coverPoint.line

      }

    }
    return result
  }
}
