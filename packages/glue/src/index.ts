import { table } from 'table'

import { ASUtil } from "@assemblyscript/loader";

const linecol = (point: CoverPoint) => `${point.line}:${point.col}`

export enum CoverPointType {
  Function,
  Block,
  Expression,
}

export type CoverageRenderConfiguration = {
  width: number;
}

export class CoverPoint {
  public covered: boolean = false;
  constructor(
    public file: string,
    public line: number,
    public col: number,
    public id: number,
    public type: CoverPointType,
  ) { }
}

class CoverPointReport {
  public coverPoints: CoverPoint[] = []
  private calculated: boolean = false
  private total: number = 0
  private totalCovered: number = 0
  private expressionTotal: number = 0
  private expressionCovered: number = 0
  private blockTotal: number = 0
  private blockCovered: number = 0
  private functionTotal: number = 0
  private functionCovered: number = 0
  private calculateStats(): void {
    if (this.calculated) {
      return
    }
    for (const point of this.coverPoints) {
      const covered = point.covered ? 1 : 0
      this.total++
      this.totalCovered += covered
      switch (point.type) {
        case CoverPointType.Expression: {
          this.expressionTotal++
          this.expressionCovered += covered
          break
        }
        case CoverPointType.Block: {
          this.blockTotal++
          this.blockCovered += covered
          break
        }
        case CoverPointType.Function: {
          this.functionTotal++
          this.functionCovered += covered
          break
        }
      }
    }
    this.calculated = true
  }
  constructor(public fileName: string) {
  }
  public get coveredPercent(): number {
    this.calculateStats()
    if (this.totalCovered === 0) return 100
    return Math.round(10 * (this.totalCovered / this.total) * 100) / 10
  }
  public get coveredBlockPercent(): number {
    this.calculateStats()
    if (this.blockTotal === 0) return 100
    return Math.round(10 * (this.blockCovered / this.blockTotal) * 100) / 10
  }
  public get coveredExpressionPercent(): number {
    this.calculateStats()
    if (this.expressionTotal === 0) return 100
    return Math.round(10 * (this.expressionCovered / this.expressionTotal) * 100) / 10
  }
  public get coveredFunctionPercent(): number {
    this.calculateStats()
    if (this.functionTotal === 0) return 100
    return Math.round(10 * (this.functionCovered / this.functionTotal) * 100) / 10
  }

}

export class Covers {
  private coverPoints = new Map<number, CoverPoint>();
  // @ts-ignore
  private loader: ASUtil

  installImports(imports: any): any {
    imports.__asCovers = {
      cover: this.cover.bind(this),
      coverDeclare: this.coverDeclare.bind(this),
    };
    return imports;
  }

  registerLoader(loader: ASUtil): void {
    this.loader = loader;
  }

  private coverDeclare(filePtr: number, id: number, line: number, col: number, coverType: CoverPointType): void {
    const filePath = this.loader!.exports.__getString(filePtr)
    let coverPoint = new CoverPoint(filePath, line, col, id, coverType);
    if (this.coverPoints.has(id)) throw new Error("Cannot add dupliate cover point.");
    this.coverPoints.set(id, coverPoint);
  }

  private cover(id: number): void {
    if (!this.coverPoints.has(id)) throw new Error("Cannot cover point that does not exist.");
    let coverPoint = this.coverPoints.get(id)!;
    coverPoint.covered = true;
  }

  public reset(): void {
    this.coverPoints.clear();
  }

  public createReport(): Map<string, CoverPointReport> {

    const results = new Map<string, CoverPointReport>()

    for (const [_, coverPoint] of this.coverPoints) {

      const fileName = coverPoint.file

      if (!results.has(fileName)) results.set(fileName, new CoverPointReport(fileName))
      // Ensure it exists

      const report = results.get(fileName)!
      // Grab report

      report.coverPoints.push(coverPoint)

    }

    return results

  }

  public stringify(): string {
    const report = this.createReport()
    return table([
      ['File', 'Total', 'Block', 'Func', 'Expr', 'Uncovered'],
      ...Array.from(report).map(([file, rep]) => {
        const uncoveredPoints = rep.coverPoints.filter((val) => !val.covered)
        return [
          file,
          `${rep.coveredPercent}%`,
          `${rep.coveredBlockPercent}%`,
          `${rep.coveredFunctionPercent}%`,
          `${rep.coveredExpressionPercent}%`,
          uncoveredPoints.length > 6
            ? `${uncoveredPoints.slice(0, 6).map(linecol).join(', ')},...`
            : uncoveredPoints.map(linecol).join(', ')
        ]
      })
    ])

  }
}