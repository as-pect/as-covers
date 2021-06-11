/**
 * The primary transform file.
 * Inserts __coverDeclare(...) and __cover(id) to facilitate code coverage.
 * __coverDeclare raises the expected count of instances while
 * __cover raises the executed count.
 * To get results, it goes like this:
 * Uncovered: expected - executed
 * Covered: executed
 * Along with this, we get file coordinates that give us information about where the statement occured.
 * If you have any questions, please contact Joshua Tenner or Jairus Tanaka for information. 
 * Also, please view the Contributing Guidelines before submitting changes.
 * Have fun!
 */

// Import visitor-as
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

// Import djb2 hash from util. (string to number)
import { createPointID } from "./util";
// Visitor-as imports
import { SimpleParser, BaseVisitor } from "visitor-as";
// @ts-ignore
import linecol from "line-column";

/**
 * Transform class.
 * This adds the __coverDeclare and __cover wherever they are needed.
 * It covers:
 * - Turnarys
 * - &&
 * - ||
 * - Functions
 * - Switch/Case
 * - If Statements
 * - Blocks
 * - Paremeters
 */
class CoverTransform extends BaseVisitor {
  private linecol: any = 0;
  private globalStatements: Statement[] = [];
  public sources: Source[] = [];

  /**
   * This covers both the && and || operators.
   * It replaces `true || false` to look like this
   * `(__cover(id), $$REPLACE_ME) || (__cover(id), $$REPLACE_ME)`
   * Then, it replaces `$$REPLACE_ME` (aka. args[1]) with this
   * `(__cover(id), true) || (__cover(id), false)`
   * @param expr BinaryExpression
   */
  visitBinaryExpression(expr: BinaryExpression): void {
    // Visit it (super)
    super.visitBinaryExpression(expr);
    // Grab the name
    const name = expr.range.source.normalizedPath;
    // Switch/case (&& or ||)
    switch (expr.operator) {
      case Token.BAR_BAR:
      case Token.AMPERSAND_AMPERSAND: {
        // If (&& or ||)
        // Get right expression (right side of the || or &&)
        const rightExpression = expr.right;
        // Coordinates
        // Start is the char
        const rightLc = this.linecol.fromIndex(rightExpression.range.start);
        const rightLine = rightLc.line;
        const rightCol = rightLc.col;
        const rightId = createPointID(
          name,
          rightLine,
          rightCol,
          "CoverType.Expression"
        );
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
        (rightCoverExpression.expression as CommaExpression).expressions[1] =
          rightExpression;
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
      const funcLc = this.linecol.fromIndex(dec.range.start);
      const funcLine = funcLc.line;
      const funcCol = funcLc.col;
      const funcId = createPointID(
        name,
        funcLine,
        funcCol,
        "CoverType.Function"
      );

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
      const parmLc = this.linecol.fromIndex(node.initializer.range.start);
      const parmLine = parmLc.line;
      const parmCol = parmLc.col;
      const parmId = createPointID(
        name,
        parmLine,
        parmCol,
        "CoverType.Expression"
      );

      const parmDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${parmId}, ${parmLine}, ${parmCol}, CoverType.Expression)`,
        true
      );
      const parmDeclareStatementSource = parmDeclareStatement.range.source;

      const parmCoverExpression = SimpleParser.parseExpression(
        `(__cover(${parmId}), $$REPLACE_ME)`
      ) as ParenthesizedExpression;

      const parmCoverExpressionSource = parmCoverExpression.range.source;
      (parmCoverExpression.expression as CommaExpression).expressions[1] =
        node.initializer;
      node.initializer = parmCoverExpression;

      this.sources.push(parmDeclareStatementSource, parmCoverExpressionSource);
      this.globalStatements.push(parmDeclareStatement);
    }
  }

  visitFunctionDeclaration(dec: FunctionDeclaration): void {
    super.visitFunctionDeclaration(dec);
    if (dec.body) {
      const name = dec.range.source.normalizedPath;
      const funcLc = this.linecol.fromIndex(dec.range.start);
      const funcLine = funcLc.line;
      const funcCol = funcLc.col;
      const funcId = createPointID(
        name,
        funcLine,
        funcCol,
        "CoverType.Function"
      );

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
      const trueLc = this.linecol.fromIndex(ifTrue.range.start);
      const trueLine = trueLc.line;
      const trueCol = trueLc.col;
      const ifTrueId = createPointID(
        name,
        trueLine,
        trueCol,
        "CoverType.Expression"
      );

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
      const falseLc = this.linecol.fromIndex(ifFalse.range.start);
      const falseLine = falseLc.line;
      const falseCol = falseLc.col;
      const ifFalseId = createPointID(
        name,
        falseLine,
        falseCol,
        "CoverType.Expression"
      );

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
    const trueLc = this.linecol.fromIndex(trueExpression.range.start);
    const trueLine = trueLc.line;
    const trueCol = trueLc.col;
    const trueId = createPointID(
      name,
      trueLine,
      trueCol,
      "CoverType.Expression"
    );
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
    (trueCoverExpression.expression as CommaExpression).expressions[1] =
      trueExpression;
    expr.ifThen = trueCoverExpression;

    this.sources.push(trueDeclareStatementSource);
    this.globalStatements.push(trueDeclareStatement);

    // False
    // Get false cordinates
    const falseLc = this.linecol.fromIndex(falseExpression.range.start);
    const falseLine = falseLc.line;
    const falseCol = falseLc.col;
    const falseId = createPointID(
      name,
      falseLine,
      falseCol,
      "CoverType.Expression"
    );
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
    (falseCoverExpression.expression as CommaExpression).expressions[1] =
      falseExpression;
    expr.ifElse = falseCoverExpression;

    this.sources.push(falseDeclareStatementSource);
    this.globalStatements.push(falseDeclareStatement);

    super.visitTernaryExpression(expr);
  }

  visitSwitchCase(stmt: SwitchCase): void {
    const name = stmt.range.source.normalizedPath;
    const caseLc = this.linecol.fromIndex(stmt.range.start);
    const caseLine = caseLc.line;
    const caseCol = caseLc.col;
    const caseId = createPointID(name, caseLine, caseCol, "CoverType.Block");
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
    const name = node.range.source.normalizedPath;
    const blockLC = this.linecol.fromIndex(node.range.start);
    const blockLine = blockLC.line;
    const blockCol = blockLC.col;
    const blockCoverId = createPointID(
      name,
      blockLine,
      blockCol,
      "CoverType.Block"
    );

    const declareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${blockCoverId}, ${blockLine}, ${blockCol}, CoverType.Block)`,
      true
    );
    const declareStatementSource = declareStatement.range.source;
    const coverStatement = SimpleParser.parseStatement(
      `__cover(${blockCoverId})`
    );
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
