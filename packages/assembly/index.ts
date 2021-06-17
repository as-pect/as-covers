/**
 * CoverTypes enum
 * Identifier for basic type.
 * - Function (0)
 * - Block (1)
 * - Expression (2)
 */
export const enum CoverType {
  Function,
  Block,
  Expression,
}
/**
 * Tells the Cover that there is an expected cover at (file:line:col)
 * @param file - File name
 * @param id - Id hash
 * @param line - Line
 * @param col - Column
 * @param coverType - CoverType (enum)
 */
// @ts-ignore: external annotation
@external("__asCovers", "coverDeclare")
// External
export declare function __coverDeclare(file: string, id: u32, line: i32, col: i32, coverType: CoverType): void;
/**
 * Triggers on execution and tells Cover that (***) Executed.
 * @param id - Id hash
 */
// @ts-ignore: external annotation
@external("__asCovers", "cover")
// External
export declare function __cover(id: u32): void;