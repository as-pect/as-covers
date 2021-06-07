// npx asc myTest.ts ./packages/assembly/index.ts --transform ./packages/transform/src/index.ts --textFile output.wat

import {
  BlockStatement,
  Transform,
  Source,
  Statement,
  Parser,
  TernaryExpression,
  IfStatement,
  BinaryExpression,
  Token,
  SwitchCase,
  CallExpression,
  Expression,
  NodeKind,
} from "visitor-as/as";

import { utils, SimpleParser, BaseVisitor } from "visitor-as";
import linecol from "line-column";
// -- Imports
class CoverTransform extends BaseVisitor {
  private id: number = 0;
  private linecol: any = 0;
  private globalStatements: Statement[] = [];
  public sources: Source[] = [];
  private sourceId: number = 0;
  // Declare properties.
  visitBinaryExpression(expr: BinaryExpression): void {
    const left = expr.left;
    // Handle || Symbols
    const name = expr.range.source.normalizedPath;

    const leftId = this.id++;
    // ID

    const leftLc = this.linecol.fromIndex(expr.range.start);
    const leftLine = leftLc.line;
    const leftCol = leftLc.col;
    // Left

    // Left Declare Statement
    const leftDeclareStatement = SimpleParser.parseStatement(
      `coverDeclare("${name}", ${leftId}, ${leftLine}, ${leftCol}, CoverType.Expression)`,
      true
    );
    const leftDeclareStatementSource = leftDeclareStatement.range.source;

    let leftCoverStatement: Statement | null = null;
    // @ts-ignore
    if (left.text === "true") {
      leftCoverStatement = SimpleParser.parseStatement(`cover(${leftId})`);
    }

    // Add declare statements to sources
    if (leftCoverStatement == null) {
      this.sources.push(leftDeclareStatementSource);
    } else {
      this.sources.push(
        leftDeclareStatementSource,
        leftCoverStatement.range.source
      );
    }

    if (leftCoverStatement == null) {
      this.globalStatements.push(leftDeclareStatement);
    } else {
      this.globalStatements.push(leftDeclareStatement, leftCoverStatement);
    }

    super.visitBinaryExpression(expr);
  }

  visitIfStatement(stmt: IfStatement): void {
    if (stmt.kind !== NodeKind.BLOCK) {
      // TODO: Covert non-blocks to block type.
    }
    super.visitIfStatement(stmt);
  }

  visitTernaryExpression(expr: TernaryExpression): void {
    const trueExpression = expr.ifThen;
    const falseExpression = expr.ifElse;
    const name = expr.range.source.normalizedPath;

    // True
    const trueId = this.id++;
    const trueLc = this.linecol.fromIndex(expr.range.start);
    const trueLine = trueLc.line;
    const trueCol = trueLc.col;
    // Cordinates

    const trueDeclareStatement = SimpleParser.parseStatement(
      `coverDeclare("${name}", ${trueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`,
      true
    );
    const trueDeclareStatementSource = trueDeclareStatement.range.source;

    // @ts-ignore
    let trueCoverExpression = SimpleParser.parseExpression(
      `coverExpression('${trueExpression.value}', ${trueId})`
    );
    // Pretty sure this only works for strings.

    console.log(expr.ifThen);
    // @ts-ignore
    trueCoverExpression.args[0] = trueExpression;

    expr.ifThen = trueCoverExpression;

    this.sources.push(trueDeclareStatementSource);
    this.globalStatements.push(trueDeclareStatement);

    // False
    const falseId = this.id++;
    // Get false cordinates
    let step = 0;
    let i = 0;
    for (
      i = expr.range.start;
      i < expr.range.source.text.length && step < 3;
      i++
    ) {
      const char = expr.range.source.text[i];
      if (step === 0 && char === "?") {
        step++;
      } else if (step === 1 && char === ":") {
        step++;
      } else if (step === 2 && char !== " ") {
        i--;
        step++;
      }
    }
    const falseLc = this.linecol.fromIndex(i);
    const falseLine = falseLc.line;
    const falseCol = falseLc.col;
    // Cordinates

    const falseDeclareStatement = SimpleParser.parseStatement(
      `coverDeclare("${name}", ${falseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`,
      true
    );
    const falseDeclareStatementSource = falseDeclareStatement.range.source;

    // @ts-ignore
    const falseCoverExpression = SimpleParser.parseExpression(
      `coverExpression('${falseExpression.value}', ${falseId})`
    );

    // @ts-ignore
    falseCoverExpression.args[0] = falseExpression;

    expr.ifElse = falseCoverExpression;

    this.sources.push(falseDeclareStatementSource);
    this.globalStatements.push(falseDeclareStatement);

    super.visitTernaryExpression(expr);
  }

  visitSwitchCase(stmt: SwitchCase): void {
    // unshift statement into statements
    super.visitSwitchCase(stmt);
  }

  visitSource(source: Source) {
    this.globalStatements = [];
    this.linecol = linecol(source.text);
    super.visitSource(source);

    source.statements.unshift(...this.globalStatements);
  }

  visitBlockStatement(node: BlockStatement) {
    let coverId = this.id++;
    const name = node.range.source.normalizedPath;
    const lc = this.linecol.fromIndex(node.range.start);
    const line = lc.line;
    const col = lc.col;

    const declareStatement = SimpleParser.parseStatement(
      `coverDeclare("${name}", ${coverId}, ${line}, ${col}, CoverType.Block)`,
      true
    );
    const declareStatementSource = declareStatement.range.source;
    const coverStatement = SimpleParser.parseStatement(`cover(${coverId})`);
    const coverStatementSource = coverStatement.range.source;
    this.sources.push(declareStatementSource, coverStatementSource);
    node.statements.unshift(coverStatement);
    this.globalStatements.push(declareStatement);
  }
}

export = class MyTransform extends Transform {
  afterParse(parser: Parser): void {
    const transformer = new CoverTransform();
    for (const source of parser.sources) {
      if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
        transformer.visit(source);
        console.log("!lib", source.internalPath);
      }
    }
    let i = 0;
    for (const source of transformer.sources) {
      source.internalPath += `${i++}.ts`;
      parser.sources.push(source);
      console.log(source.internalPath);
      // Modify file names (incremental)
    }
  }
};
