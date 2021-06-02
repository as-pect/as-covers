import 'colors'

import { ASUtil, instantiateSync } from "@assemblyscript/loader";

export const enum CoverPointType {
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
  ) {}
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
    this.coversExpected++
  }

  private cover(id: number): void {
    if (!this.coverPoints.has(id)) throw new Error("Cannot cover point that does not exist.");
    let coverPoint = this.coverPoints.get(id)!;
    coverPoint.covered = true;
    this.coversExecuted++
  }

  public reset(): void {
    this.coverPoints.clear();
  }

  public stringify(config: CoverageRenderConfiguration): string {
    let result = ''
    const line = "=".repeat(config.width);
    const files: Record<string, Array<CoverPoint>> = {};
    for (const cover of this.coverPoints) {
      const { file } = cover[1];
      const index = files[file] = files[file] || [];
      index.push(cover[1]);
    }
    let fileList = Object.keys(files);
    for (const entry of this.coverPoints.entries()) {
      result += `${entry[1].file}:${entry[1].line}:${entry[1].col}\n`.blue
      result += `ID: ${entry[1].id.toString()}\n`.gray
      result += `Type: ${entry[1].type.toString()}\n`.gray
      result += `Covered: ${entry[1].covered}\n`.gray
    }
    return result
  }
}//Overall %, Block %, Function %, Expression %, Remaining