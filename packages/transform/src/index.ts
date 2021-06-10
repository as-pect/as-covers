import {
  ArrowKind,
  BinaryExpression,
  BlockStatement,
  CommaExpression,
  ExpressionStatement,
  FunctionDeclaration,
  IfStatement,
  MethodDeclaration,
  NodeKind,
  ParameterNode,
  ParenthesizedExpression,
  Parser,
  ReturnStatement,
  Source,
  Statement,
  SwitchCase,
  TernaryExpression,
  Token,
  Transform,
} from "visitor-as/as";

import { SimpleParser, BaseVisitor } from "visitor-as";
// @ts-ignore
import linecol from "line-column";
// -- Imports
class CoverTransform extends BaseVisitor {
  private id: number = 0;
  private linecol: any = 0;
  private globalStatements: Statement[] = [];
  public sources: Source[] = [];
  // Declare properties.
  visitBinaryExpression(expr: BinaryExpression): void {
    super.visitBinaryExpression(expr);
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
          `(__cover(${rightId}), $$REPLACE_ME)`
        ) as ParenthesizedExpression;
        (rightCoverExpression.expression as CommaExpression).expressions[1] = rightExpression;
        expr.right = rightCoverExpression;

        this.sources.push(rightDeclareStatementSource);
        this.globalStatements.push(rightDeclareStatement);

        break;
      }
    }


  }

  visitMethodDeclaration(dec: MethodDeclaration): void {
    super.visitMethodDeclaration(dec);
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

      const funcCoverStatement = SimpleParser.parseStatement(
        `__cover(${funcId})`,
        true
      );
      const funcCoverStatementSource = funcCoverStatement.range.source;
      const bodyBlock = dec.body as BlockStatement;
      bodyBlock.statements.unshift(funcCoverStatement);
      this.sources.push(funcCoverStatementSource);

      this.sources.push(funcDeclareStatementSource);
      this.globalStatements.push(funcDeclareStatement);
    }
  }

  visitParemeter(node: ParameterNode): void {
    const name = node.range.source.normalizedPath;

    super.visitParameter(node);

    if (node.initializer) {
      const parmId = this.id++;
      const parmLc = this.linecol.fromIndex(node.initializer.range.start);
      const parmLine = parmLc.line;
      const parmCol = parmLc.col;

      const parmDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${parmId}, ${parmLine}, ${parmCol}, CoverType.Expression)`,
        true
      );
      const parmDeclareStatementSource = parmDeclareStatement.range.source;

      const parmCoverExpression = SimpleParser.parseExpression(
        `(__cover(${parmId}), $$REPLACE_ME)`
      ) as ParenthesizedExpression;

      const parmCoverExpressionSource = parmCoverExpression.range.source;
      (parmCoverExpression.expression as CommaExpression).expressions[1] = node.initializer;
      node.initializer = parmCoverExpression;

      this.sources.push(parmDeclareStatementSource, parmCoverExpressionSource);
      this.globalStatements.push(parmDeclareStatement);
    }
  }

  visitFunctionDeclaration(dec: FunctionDeclaration): void {
    super.visitFunctionDeclaration(dec);
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

      this.sources.push(funcDeclareStatementSource);
      this.globalStatements.push(funcDeclareStatement);

      if (dec.body.kind === NodeKind.EXPRESSION) {
        const bodyStatement = SimpleParser.parseStatement(`
        {
          __cover(${funcId});
          return $$REPLACE_ME;
        }`) as BlockStatement;
        const bodyReturn = bodyStatement.statements[1] as ReturnStatement;
        const body = dec.body as ExpressionStatement;
        dec.arrowKind = ArrowKind.ARROW_SINGLE;
        bodyReturn.value = body.expression;
        this.sources.push(bodyStatement.range.source);
        dec.body = body;
      } else {
        const funcCoverStatement = SimpleParser.parseStatement(
          `__cover(${funcId})`,
          true
        );
        const funcCoverStatementSource = funcCoverStatement.range.source;
        const bodyBlock = dec.body as BlockStatement;
        bodyBlock.statements.unshift(funcCoverStatement);
        this.sources.push(funcCoverStatementSource);
      }
    }
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
    const trueLc = this.linecol.fromIndex(trueExpression.range.start);
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
      `(__cover(${trueId}), $$REPLACE_ME)`
    ) as ParenthesizedExpression;
    (trueCoverExpression.expression as CommaExpression).expressions[1] = trueExpression;
    expr.ifThen = trueCoverExpression;

    this.sources.push(trueDeclareStatementSource);
    this.globalStatements.push(trueDeclareStatement);

    // False
    const falseId = this.id++;
    // Get false cordinates
    const falseLc = this.linecol.fromIndex(falseExpression.range.start);
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
      `(__cover(${falseId}), $$REPLACE_ME)`
    ) as ParenthesizedExpression;
    (falseCoverExpression.expression as CommaExpression).expressions[1] = falseExpression;
    expr.ifElse = falseCoverExpression;

    this.sources.push(falseDeclareStatementSource);
    this.globalStatements.push(falseDeclareStatement);

    super.visitTernaryExpression(expr);
  }

  visitSwitchCase(stmt: SwitchCase): void {
    const name = stmt.range.source.normalizedPath;
    const caseId = this.id++;
    const caseLc = this.linecol.fromIndex(stmt.range.start);
    const caseLine = caseLc.line;
    const caseCol = caseLc.col;
    // Cordinates

    const caseDeclareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${caseId}, ${caseLine}, ${caseCol}, CoverType.Block)`,
      true
    );
    const caseDeclareStatementSource = caseDeclareStatement.range.source;

    const caseCoverStatement = SimpleParser.parseStatement(
      `__cover(${caseId})`
    );
    const caseCoverStatementSource = caseCoverStatement.range.source;

    this.sources.push(caseDeclareStatementSource, caseCoverStatementSource);
    this.globalStatements.push(caseDeclareStatement);

    super.visitSwitchCase(stmt);

    stmt.statements.unshift(caseCoverStatement);
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
    this.globalStatements.push(declareStatement);

    super.visitBlockStatement(node);

    node.statements.unshift(coverStatement);
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
