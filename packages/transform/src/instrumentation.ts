import {
  BlockStatement,
  CommaExpression,
  Expression,
  Node,
  ParenthesizedExpression,
  Source,
  Statement,
} from "assemblyscript/dist/assemblyscript.js";

import { SimpleParser } from "visitor-as";
import { RangeTransform } from "visitor-as/dist/transformRange.js";
import linecol from "line-column";

import { createPointID } from "./util.js";

const ignoredRegex = /^[\t ]*\/\/ @as-covers: ignore.*$/gm;

export type CoverTypeName =
  | "CoverType.Block"
  | "CoverType.Function"
  | "CoverType.Expression";

interface SourceLocation {
  line: number;
  col: number;
}

interface CoverPointDetails extends SourceLocation {
  file: string;
  id: number;
  type: CoverTypeName;
}

export class SourceInstrumentation {
  public readonly fileName: string;
  private readonly linecol: any;
  private readonly ignoredLines = new Set<number>();
  private readonly declarations: Statement[] = [];

  constructor(source: Source) {
    this.fileName = source.normalizedPath;
    this.linecol = linecol(source.text);

    for (const ignored of source.text.matchAll(ignoredRegex)) {
      this.ignoredLines.add(this.linecol.fromIndex(ignored.index!).line + 1);
    }
  }

  declarePoint(
    node: Node,
    type: CoverTypeName,
    anchor: Node = node
  ): CoverPointDetails | null {
    const point = this.createPoint(node, type);
    if (!point) return null;

    this.declarations.push(this.coverDeclare(point, anchor));
    return point;
  }

  coverStatement(
    point: CoverPointDetails,
    anchor: Node,
    topLevel = false
  ): Statement {
    return this.parseStatement(`__cover(${point.id})`, anchor, topLevel);
  }

  coverBlock(point: CoverPointDetails, anchor: Node): BlockStatement {
    return this.parseStatement(
      `{__cover(${point.id})};`,
      anchor,
      true
    ) as BlockStatement;
  }

  coverExpression(
    point: CoverPointDetails,
    originalExpression: Expression,
    anchor: Node
  ): ParenthesizedExpression {
    const coverExpression = SimpleParser.parseExpression(
      `(__cover(${point.id}), $$REPLACE_ME)`
    ) as ParenthesizedExpression;
    this.applyRange(anchor, coverExpression);
    (coverExpression.expression as CommaExpression).expressions[1] =
      originalExpression;
    return coverExpression;
  }

  prependDeclarations(source: Source): void {
    source.statements.unshift(...this.declarations);
  }

  private createPoint(
    node: Node,
    type: CoverTypeName
  ): CoverPointDetails | null {
    const location = this.locationOf(node);
    if (this.ignoredLines.has(location.line)) return null;

    return {
      ...location,
      file: this.fileName,
      id: createPointID(this.fileName, location.line, location.col, type),
      type,
    };
  }

  private locationOf(node: Node): SourceLocation {
    const location = this.linecol.fromIndex(node.range.start);
    return {
      line: location.line,
      col: location.col,
    };
  }

  private coverDeclare(point: CoverPointDetails, anchor: Node): Statement {
    return this.parseStatement(
      `__coverDeclare("${point.file}", ${point.id}, ${point.line}, ${point.col}, ${point.type})`,
      anchor,
      true
    );
  }

  private parseStatement(
    source: string,
    anchor: Node,
    topLevel = false
  ): Statement {
    const statement = SimpleParser.parseStatement(source, topLevel);
    this.applyRange(anchor, statement);
    return statement;
  }

  private applyRange(node: Node, generated: Node): void {
    new RangeTransform(node).visit(generated);
  }
}
