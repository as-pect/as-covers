// @ts-ignore: global annotation
export const enum CoverType {
  Function,
  Block,
  Expression,
}
// @ts-ignore: external annotation
@external("__asCovers", "coverDeclare")
export declare function __coverDeclare(file: string, id: u32, line: i32, col: i32, coverType: CoverType): void;
// @ts-ignore: external annotation
@external("__asCovers", "cover")
export declare function __cover(id: u32): void;
