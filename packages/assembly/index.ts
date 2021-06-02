// @ts-ignore: global annotation
@global export const enum CoverType {
  Function,
  Block,
  Expression,
}
// @ts-ignore: external annotation
@global @external("__asCovers", "coverDeclare")
declare function __coverDeclare(file: string, id: u32, line: i32, col: i32, coverType: CoverType): void;
// @ts-ignore: global annotation
@global @external("__asCovers", "cover")
declare function __cover(id: u32): void;

// @ts-ignore: global annotation
@global
function __coverExpression<T>(value: T, id: u32): T {
  __cover(id);
  return value;
}
