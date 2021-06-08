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
  NodeKind,
  CallExpression,
  FunctionDeclaration,
  ExpressionStatement,
  ReturnStatement
} from "visitor-as/as";

import { SimpleParser, BaseVisitor } from "visitor-as";
import linecol from "line-column";
// -- Imports
class CoverTransform extends BaseVisitor {
  private id: number = 0;
  private linecol: any = 0;
  private globalStatements: Statement[] = [];
  public sources: Source[] = [];
  // Declare properties.
  visitBinaryExpression(expr: BinaryExpression): void {
    const name = expr.range.source.normalizedPath;

    switch (expr.operator) {
      case Token.BAR_BAR:
      case Token.AMPERSAND_AMPERSAND: {
        const rightExpression = expr.right;
        // ID
        const rightId = this.id++;
        const rightLc = this.linecol.fromIndex(rightExpression.range.start);
        const rightLine = rightLc.line;
        const rightCol = rightLc.col;
        // Declare Statement
        const rightDeclareStatement = SimpleParser.parseStatement(
          `__coverDeclare("${name}", ${rightId}, ${rightLine}, ${rightCol}, CoverType.Expression)`,
          true
        );
        const rightDeclareStatementSource = rightDeclareStatement.range.source;
        // Expression
        let rightCoverExpression = SimpleParser.parseExpression(
          `__coverExpression($$REPLACE_ME, ${rightId})`
        ) as CallExpression;

        rightCoverExpression.args[0] = rightExpression;
        expr.right = rightCoverExpression;

        this.sources.push(rightDeclareStatementSource);
        this.globalStatements.push(rightDeclareStatement);

        break;
      }
    }

    super.visitBinaryExpression(expr);
  }

  visitFunctionDeclaration(dec: FunctionDeclaration): void {
    if (dec.body) {
      const name = dec.range.source.normalizedPath;
      const funcId = this.id++;
      const funcLc = this.linecol.fromIndex(dec.range.start);
      const funcLine = funcLc.line;
      const funcCol = funcLc.col;

      const funcDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${funcId}, ${funcLine}, ${funcCol}, CoverType.Function)`,
        true
      );
      const funcDeclareStatementSource = funcDeclareStatement.range.source;
      
      if (dec.body.kind === NodeKind.EXPRESSION) {
        /*const bodyStatement = SimpleParser.parseStatement(`
        {
          __cover(${funcId});
          return $$REPLACE_ME;
        }`) as BlockStatement;
        const bodyReturn = bodyStatement.statements[1] as ReturnStatement
        bodyReturn.value = dec.body
        dec.body = bodyStatement
        this.sources.push(bodyStatement.range.source)*/
      } else {
        const funcCoverStatement = SimpleParser.parseStatement(`__cover(${funcId})`, true);
        const funcCoverStatementSource = funcCoverStatement.range.source;
        const bodyBlock = dec.body as BlockStatement
        bodyBlock.statements.unshift(funcCoverStatement)
        this.sources.push(funcCoverStatementSource)
      }

      this.sources.push(funcDeclareStatementSource);
      this.globalStatements.push(funcDeclareStatement);
    }

    //super.visitFunctionDeclaration(dec);
  }

  visitIfStatement(stmt: IfStatement): void {
    let visitIfTrue = false;
    let visitIfFalse = false;
    const ifTrue = stmt.ifTrue;
    const ifFalse = stmt.ifFalse;
    const name = stmt.range.source.normalizedPath;
    if (ifTrue.kind !== NodeKind.BLOCK) {
      const ifTrueId = this.id++;
      const trueLc = this.linecol.fromIndex(ifTrue.range.start);
      const trueLine = trueLc.line;
      const trueCol = trueLc.col;

      const coverDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${ifTrueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`,
        true
      );
      const coverDeclareStatementSource = coverDeclareStatement.range.source;

      const coverStatement = SimpleParser.parseStatement(
        `{__cover(${ifTrueId})};`,
        true
      ) as BlockStatement;
      coverStatement.statements.push(ifTrue);
      stmt.ifTrue = coverStatement;

      this.sources.push(coverDeclareStatementSource);
      this.globalStatements.push(coverDeclareStatement);
      visitIfTrue = true;
      visitIfFalse = !!ifFalse;
    }
    if (ifFalse && ifFalse.kind !== NodeKind.BLOCK) {
      const ifFalseId = this.id++;
      const falseLc = this.linecol.fromIndex(ifFalse.range.start);
      const falseLine = falseLc.line;
      const falseCol = falseLc.col;

      const coverDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${ifFalseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`,
        true
      );
      const coverDeclareStatementSource = coverDeclareStatement.range.source;

      const coverStatement = SimpleParser.parseStatement(
        `{__cover(${ifFalseId})};`,
        true
      ) as BlockStatement;
      coverStatement.statements.push(ifFalse);
      stmt.ifFalse = coverStatement;

      this.sources.push(coverDeclareStatementSource);
      this.globalStatements.push(coverDeclareStatement);
      visitIfTrue = true;
      visitIfFalse = true;
    }
    if (visitIfTrue || visitIfFalse) {
      if (visitIfTrue) this._visit(ifTrue);
      if (visitIfFalse) this._visit(ifFalse!);
    } else {
      super.visitIfStatement(stmt);
    }
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
      `__coverDeclare("${name}", ${trueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`,
      true
    );
    const trueDeclareStatementSource = trueDeclareStatement.range.source;

    // @ts-ignore
    let trueCoverExpression = SimpleParser.parseExpression(
      `__coverExpression($$REPLACE_ME, ${trueId})`
    );

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
      `__coverDeclare("${name}", ${falseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`,
      true
    );
    const falseDeclareStatementSource = falseDeclareStatement.range.source;

    // @ts-ignore
    const falseCoverExpression = SimpleParser.parseExpression(
      `__coverExpression($$REPLACE_ME, ${falseId})`
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
      `__coverDeclare("${name}", ${coverId}, ${line}, ${col}, CoverType.Block)`,
      true
    );
    const declareStatementSource = declareStatement.range.source;
    const coverStatement = SimpleParser.parseStatement(`__cover(${coverId})`);
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
      }
    }
    let i = 0;
    for (const source of transformer.sources) {
      source.internalPath += `${i++}.ts`;
      parser.sources.push(source);
      // Modify file names (incremental)
    }
  }
};
