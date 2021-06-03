import 'colors'

import { ASUtil, instantiateSync } from "@assemblyscript/loader";

export enum CoverPointType {
  none,
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

export class Covers {
  private coverPoints = new Map<number, CoverPoint>();
  // @ts-ignore
  private loader: ASUtil

  private coversExecuted = 0

  private coversExpected = 0

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
    const fileData = new Map<string, {
      expected: 0,
      executed: 0,
      data: Array<CoverPoint>
    }>()

    for (const cover of this.coverPoints) {
      const { file } = cover[1];
      const index = files[file] = files[file] || [];
      index.push(cover[1]);

      if (!fileData.has(file)) fileData.set(file, {
        expected: 0,
        executed: 0,
        data: Array<CoverPoint>()
      })
      // Ensure all files are stored

      const fdata = fileData.get(file)

      // @ts-ignore.
      if (cover[1].covered) {
        // @ts-ignore
        fdata.executed++
      }

      // @ts-ignore.
      fdata.expected++

      // @ts-ignore
      fdata.data.push(cover[1])

    }

    result += `\n\nAS-Covers Results\n`.blue

    result += `=================\n\n`.gray

    for (const [file, data] of fileData.entries()) {
      
      result += `${file} - Results\n`.blue
      result += ` - Expected: ${data.expected}\n`.gray
      result += ` - Executed: ${data.executed}\n`.gray
      result += ` - Coverage: ${Math.round(100*(data.executed / data.expected) * 100) / 100}\n`.gray

    }

    result += `\n`
    result += `Total Expected: ${this.coversExpected}\n`.blue
    result += `Total Executed: ${this.coversExecuted}\n`.blue
    result += `Total Coverage: ${Math.round(100*(this.coversExecuted / this.coversExpected) * 100)/100}%\n`.blue

    return result
  }
}//Overall %, Block %, Function %, Expression %, Remaining

function fromEnum(value: any): string {
  let res = ''
  for (const key in CoverPointType) {
    if (CoverPointType[key] === value) {
      return res = key
    }
  }
  return res
}