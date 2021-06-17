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

import { createPointID } from "./util";

import { SimpleParser, BaseVisitor } from "visitor-as";
// @ts-ignore
import linecol from "line-column";

// Ignored Regex
const ignoredRegex = /^\W*\/\/ @as-covers: ignore.*$/gm;
// -- Imports
class CoverTransform extends BaseVisitor {
  private linecol: any = 0;
  private globalStatements: Statement[] = [];
  public sources: Source[] = [];
  public ignoredLines = new Set<number>();
  // Declare properties.
  visitBinaryExpression(expr: BinaryExpression): void {
    super.visitBinaryExpression(expr);
    const name = expr.range.source.normalizedPath;
    // Switch/case (&& or ||)
    switch (expr.operator) {
      case Token.BAR_BAR:
      case Token.AMPERSAND_AMPERSAND: {
        // If (&& or ||)
        // Get right expression (right side of the || or &&)
        const rightExpression = expr.right;
        // Coordinates
        // Grab and parse line column
        const rightLc = this.linecol.fromIndex(rightExpression.range.start);
        // Turn coordinates into variables
        const rightLine = rightLc.line;
        const rightCol = rightLc.col;
        // Stop if there is a `@as-covers: ignore` comment
        if (this.ignoredLines.has(rightLine)) return;
        // Create id. (Hash)
        const rightId = createPointID(
          name,
          rightLine,
          rightCol,
          "CoverType.Expression"
        );
        // Create Declare Statement.
        const rightDeclareStatement = SimpleParser.parseStatement(
          `__coverDeclare("${name}", ${rightId}, ${rightLine}, ${rightCol}, CoverType.Expression)`,
          true
        );
        // Grab the declare statement source.
        const rightDeclareStatementSource = rightDeclareStatement.range.source;
        // Create new Expression
        let rightCoverExpression = SimpleParser.parseExpression(
          `(__cover(${rightId}), $$REPLACE_ME)`
        ) as ParenthesizedExpression;
        // Replace $$REPLACE_ME with the expresion
        (rightCoverExpression.expression as CommaExpression).expressions[1] =
          rightExpression;
        // Set expression.
        expr.right = rightCoverExpression;

        // Push Declare Statement to sources
        this.sources.push(rightDeclareStatementSource);
        // Push Declare Statement to global statements.
        this.globalStatements.push(rightDeclareStatement);

        break;
      }
    }
  }

  // Method transform.
  visitMethodDeclaration(dec: MethodDeclaration): void {
    super.visitMethodDeclaration(dec);
    if (dec.body) {
      const name = dec.range.source.normalizedPath;
      const funcLc = this.linecol.fromIndex(dec.range.start);
      const funcLine = funcLc.line;
      const funcCol = funcLc.col;
      if (this.ignoredLines.has(funcLine)) return;
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
      if (this.ignoredLines.has(parmLine)) return;
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

  /**
   * This transforms cover declarations.
   * It inserts __cover(id) at the top of the function block
   * Making sure to report if the function is not executed.
   * @param dec FunctionDeclaration
   */
  visitFunctionDeclaration(dec: FunctionDeclaration): void {
    // Call the super.
    super.visitFunctionDeclaration(dec);
    // If there is a function body... (Not empty)
    if (dec.body) {
      // Grab the name
      const name = dec.range.source.normalizedPath;
      // Get coordinates
      const funcLc = this.linecol.fromIndex(dec.range.start);
      // Line
      const funcLine = funcLc.line;
      // Column
      const funcCol = funcLc.col;
      if (this.ignoredLines.has(funcLine)) return;
      // Generate id hash from information
      const funcId = createPointID(
        name,
        funcLine,
        funcCol,
        "CoverType.Function"
      );
      // Create declare statement
      const funcDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${funcId}, ${funcLine}, ${funcCol}, CoverType.Function)`,
        true
      );
      // Grab declare statement source
      const funcDeclareStatementSource = funcDeclareStatement.range.source;

      // Push declare statement to sources
      this.sources.push(funcDeclareStatementSource);
      // Push declare stastement to globalStatements
      this.globalStatements.push(funcDeclareStatement);

      // If the body is an expression, convert it to a block. (We need it to be a block because of multiple lines.)
      if (dec.body.kind === NodeKind.EXPRESSION) {
        // Parse string as BlockStatement. (We replace the function's body with this.)
        const bodyStatement = SimpleParser.parseStatement(`
        {
          __cover(${funcId});
          return $$REPLACE_ME;
        }`) as BlockStatement;
        // Grab the return statement of the body
        const bodyReturn = bodyStatement.statements[1] as ReturnStatement;
        // Grab the body and cast it as an ExpressionStatement
        const body = dec.body as ExpressionStatement;
        // Manipulate the arrowKind. Make sure it works.
        dec.arrowKind = ArrowKind.ARROW_SINGLE;
        // Set the return value as the origianal body.
        bodyReturn.value = body.expression;
        // Push the body statement to sourcesssssssss
        this.sources.push(bodyStatement.range.source);
        // Finally, replace the function body with our generated block-statement body.
        dec.body = body;
      } else {
        // If it isn't an expression (already a block.)
        // Create a cover statement and add it to the top of the function body.
        const funcCoverStatement = SimpleParser.parseStatement(
          `__cover(${funcId})`,
          true
        );
        // Grab the cover statement's source
        const funcCoverStatementSource = funcCoverStatement.range.source;
        // Grab the body and cast it as a BlockStatement
        const bodyBlock = dec.body as BlockStatement;
        // Push the cover statement to the top of the function body.
        bodyBlock.statements.unshift(funcCoverStatement);
        // Push it to the sources
        this.sources.push(funcCoverStatementSource);
      }
    }
  }

  /**
   * This transform converts single-line if statements into a block format because it needs to be multi-lined.
   * This also adds the coverDeclare and cover statements for code coverage.
   * @param stmt IfStatement
   */
  visitIfStatement(stmt: IfStatement): void {
    // If it was visited...
    let visitIfTrue = false;
    let visitIfFalse = false;
    // Grab the stmt.ifTrue/False and make it into a variable.
    const ifTrue = stmt.ifTrue;
    const ifFalse = stmt.ifFalse;
    // Grab the name of the current file
    const name = stmt.range.source.normalizedPath;
    // If its not a block, convert it to a Block kind.
    if (ifTrue.kind !== NodeKind.BLOCK) {
      // Coordinates
      const trueLc = this.linecol.fromIndex(ifTrue.range.start);
      const trueLine = trueLc.line;
      const trueCol = trueLc.col;
      if (this.ignoredLines.has(trueLine)) return
      // Get id from hash
      const ifTrueId = createPointID(
        name,
        trueLine,
        trueCol,
        "CoverType.Expression"
      );
      // Cover Declare statment
      const coverDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${ifTrueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`,
        true
      );
      // Grab coverDeclare source
      const coverDeclareStatementSource = coverDeclareStatement.range.source;
      // Create new cover statement as a block.
      const coverStatement = SimpleParser.parseStatement(
        `{__cover(${ifTrueId})};`,
        true
      ) as BlockStatement;
      // This pushes the old value right below the __cover(id)
      coverStatement.statements.push(ifTrue);
      // Set coverStatement as the if statement's body
      stmt.ifTrue = coverStatement;

      // Push coverDeclare to sources
      this.sources.push(coverDeclareStatementSource);
      // Push coverDeclare to globalStatements
      this.globalStatements.push(coverDeclareStatement);
      // Set variables. This was because this transform was executing twice. These prevent that.
      visitIfTrue = true;
      visitIfFalse = !!ifFalse;
    }
    // Handles false if statements
    if (ifFalse && ifFalse.kind !== NodeKind.BLOCK) {
      // Calculate coordinates
      const falseLc = this.linecol.fromIndex(ifFalse.range.start);
      const falseLine = falseLc.line;
      const falseCol = falseLc.col;

      if (this.ignoredLines.has(falseLine)) return;
      // Create id from hash
      const ifFalseId = createPointID(
        name,
        falseLine,
        falseCol,
        "CoverType.Expression"
      );
      // Create coverDeclare statement
      const coverDeclareStatement = SimpleParser.parseStatement(
        `__coverDeclare("${name}", ${ifFalseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`,
        true
      );
      // Grab coverDeclare statement source
      const coverDeclareStatementSource = coverDeclareStatement.range.source;
      // Create new cover statement as a block.
      const coverStatement = SimpleParser.parseStatement(
        `{__cover(${ifFalseId})};`,
        true
      ) as BlockStatement;
      // Add old body right after __cover(id)
      coverStatement.statements.push(ifFalse);
      // Set the body to the coverStatement
      stmt.ifFalse = coverStatement;
      // Push coverDeclare statement source to sources
      this.sources.push(coverDeclareStatementSource);
      // Push to globalStatements
      this.globalStatements.push(coverDeclareStatement);
      // Double-check prevention
      visitIfTrue = true;
      visitIfFalse = true;
    }
    // Stops it from transfoming twice
    if (visitIfTrue || visitIfFalse) {
      if (visitIfTrue) this._visit(ifTrue);
      if (visitIfFalse) this._visit(ifFalse!);
    } else {
      // Call super.
      super.visitIfStatement(stmt);
    }
  }

  /**
   * Adds a cover statement Inside of a ternary expession.
   * a ? b : c
   * becomes
   * a ? (__cover(id), b) : (__cover(id), c)
   * @param expr TernaryExpression
   */
  visitTernaryExpression(expr: TernaryExpression): void {
    // Cast the ifThen/Else into their own variables. (Prevents circularness)
    const trueExpression = expr.ifThen;
    const falseExpression = expr.ifElse;
    // Get the file name
    const name = expr.range.source.normalizedPath;

    // Handle the true side. (left)
    // Calculate coordinates
    const trueLc = this.linecol.fromIndex(trueExpression.range.start);
    const trueLine = trueLc.line;
    const trueCol = trueLc.col;
    if (this.ignoredLines.has(trueLine)) return;
    // Create id from hash
    const trueId = createPointID(
      name,
      trueLine,
      trueCol,
      "CoverType.Expression"
    );
    // Create declare statement
    const trueDeclareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${trueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`,
      true
    );
    const trueDeclareStatementSource = trueDeclareStatement.range.source;

    // Create cover expression
    let trueCoverExpression = SimpleParser.parseExpression(
      `(__cover(${trueId}), $$REPLACE_ME)`
    ) as ParenthesizedExpression;
    // Replace $$REPLACE_ME with the original value
    (trueCoverExpression.expression as CommaExpression).expressions[1] =
      trueExpression;
    // Set the left (true) side to the cover expression
    expr.ifThen = trueCoverExpression;

    // Push declare statement to global and sources
    this.sources.push(trueDeclareStatementSource);
    this.globalStatements.push(trueDeclareStatement);

    // False
    // Get false cordinates
    const falseLc = this.linecol.fromIndex(falseExpression.range.start);
    const falseLine = falseLc.line;
    const falseCol = falseLc.col;
    if (this.ignoredLines.has(falseLine)) return;
    // Create id from hash
    const falseId = createPointID(
      name,
      falseLine,
      falseCol,
      "CoverType.Expression"
    );
    // Create coverDeclare staterment
    const falseDeclareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${falseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`,
      true
    );
    const falseDeclareStatementSource = falseDeclareStatement.range.source;

    // Create cover expression and cast a ParenthesizedExpression
    const falseCoverExpression = SimpleParser.parseExpression(
      `(__cover(${falseId}), $$REPLACE_ME)`
    ) as ParenthesizedExpression;
    // Replace $$REPLACE_ME with the original value
    (falseCoverExpression.expression as CommaExpression).expressions[1] =
      falseExpression;
    // Set the false (right) side as the cover expression
    expr.ifElse = falseCoverExpression;

    // Push to global and sources
    this.sources.push(falseDeclareStatementSource);
    this.globalStatements.push(falseDeclareStatement);

    // Call to super
    super.visitTernaryExpression(expr);
  }
  /**
   * Visits switch/case statements.
   * Puts a cover statement inside of each case (or default)
   * @param stmt - SwitchCase
   */
  visitSwitchCase(stmt: SwitchCase): void {
    // Get the current file name
    const name = stmt.range.source.normalizedPath;
    // Calculate coordinates
    const caseLc = this.linecol.fromIndex(stmt.range.start);
    const caseLine = caseLc.line;
    const caseCol = caseLc.col;
    if (this.ignoredLines.has(caseLine)) return;
    // Create id from hash
    const caseId = createPointID(name, caseLine, caseCol, "CoverType.Block");
    // Create declare statement
    const caseDeclareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${caseId}, ${caseLine}, ${caseCol}, CoverType.Block)`,
      true
    );
    // Get declare statement source
    const caseDeclareStatementSource = caseDeclareStatement.range.source;

    // Create a cover statement
    const caseCoverStatement = SimpleParser.parseStatement(
      `__cover(${caseId})`
    );
    // Get cover statement source
    const caseCoverStatementSource = caseCoverStatement.range.source;

    // Push declare statement and cover to sources
    this.sources.push(caseDeclareStatementSource, caseCoverStatementSource);
    // Push declare to global
    this.globalStatements.push(caseDeclareStatement);
    // Call super
    super.visitSwitchCase(stmt);
    // Push cover statement to the top of the case statement
    stmt.statements.unshift(caseCoverStatement);
  }

  /**
   * Visits each block statement and creates a declare and cover statement.
   * @param node - BlockStatement
   */
  visitBlockStatement(node: BlockStatement) {
    // Get the file name
    const name = node.range.source.normalizedPath;
    // Calculate coordinates
    const blockLC = this.linecol.fromIndex(node.range.start);
    const blockLine = blockLC.line;
    const blockCol = blockLC.col;
    if (this.ignoredLines.has(blockLine)) return;
    // Create id from hash
    const blockCoverId = createPointID(
      name,
      blockLine,
      blockCol,
      "CoverType.Block"
    );

    // Create declare statement
    const declareStatement = SimpleParser.parseStatement(
      `__coverDeclare("${name}", ${blockCoverId}, ${blockLine}, ${blockCol}, CoverType.Block)`,
      true
    );
    const declareStatementSource = declareStatement.range.source;
    // Create cover statement
    const coverStatement = SimpleParser.parseStatement(
      `__cover(${blockCoverId})`
    );
    const coverStatementSource = coverStatement.range.source;
    // Push cover and declare to sources
    this.sources.push(declareStatementSource, coverStatementSource);
    // Push declare to global
    this.globalStatements.push(declareStatement);
    // Call to super
    super.visitBlockStatement(node);
    // Push cover statements to the top of the block.
    node.statements.unshift(coverStatement);
  }

  // VisitSource utility.
  visitSource(source: Source) {
    // Grab the file text
    const text: string = source.text;
    // Create globalStatements array.
    this.globalStatements = [];
    // Create linecol function. (Base it off of the file text)
    this.linecol = linecol(text);
    // Find @as-covers: ignore comments (Regex)
    const foundIgnores = text.matchAll(ignoredRegex);
    // Loop over all the found results
    for (const ignored of foundIgnores) {
      // Calculate line coordinates from linecol
      const line = this.linecol.fromIndex(ignored.index!).line + 1;
      // Add it into the set.
      this.ignoredLines.add(line);
    }
    // Visit each source
    super.visitSource(source);
    // Push global statements to that source.
    source.statements.unshift(...this.globalStatements);
  }
}

// Transform class
export = class MyTransform extends Transform {
  // Trigger the transform after parse.
  afterParse(parser: Parser): void {
    // Create new transform
    const transformer = new CoverTransform();
    // Loop over every source
    for (const source of parser.sources) {
      // Ignore all lib (std lib). Visit everything else.
      if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
        transformer.visit(source);
      }
    }
    // Create different file names to prevent interference (increment)
    let i = 0;
    for (const source of transformer.sources) {
      source.internalPath += `${i++}.ts`;
      parser.sources.push(source);
      // Modify file names (incremental)
    }
  }
};
