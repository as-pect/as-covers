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
  BinaryExpression,
  BlockStatement,
  ExpressionStatement,
  FunctionDeclaration,
  IfStatement,
  MethodDeclaration,
  NodeKind,
  ParameterNode,
  Node,
  Parser,
  Source,
  SwitchCase,
  TernaryExpression,
  Token,
} from "assemblyscript/dist/assemblyscript.js";

import { Transform } from "assemblyscript/dist/transform.js";

import { BaseVisitor } from "visitor-as";

import { SourceInstrumentation } from "./instrumentation.js";

// -- Imports
class CoverTransform extends BaseVisitor {
  private instrumentation!: SourceInstrumentation;
  public entry: Source | null = null;

  // Declare properties.
  visitBinaryExpression(expr: BinaryExpression): void {
    super.visitBinaryExpression(expr);

    switch (expr.operator) {
      case Token.Bar_Bar:
      case Token.Ampersand_Ampersand: {
        const rightExpression = expr.right;
        const rightPoint = this.instrumentation.declarePoint(
          rightExpression,
          "CoverType.Expression",
          expr
        );
        if (!rightPoint) return;

        expr.right = this.instrumentation.coverExpression(
          rightPoint,
          rightExpression,
          expr
        );
        break;
      }
    }
  }

  // Method transform.
  visitMethodDeclaration(dec: MethodDeclaration): void {
    super.visitMethodDeclaration(dec);
    if (dec.body) {
      const funcPoint = this.instrumentation.declarePoint(
        dec,
        "CoverType.Function"
      );
      if (!funcPoint) return;

      const funcCoverStatement = this.instrumentation.coverStatement(
        funcPoint,
        dec,
        true
      );
      const bodyBlock = dec.body as BlockStatement;
      bodyBlock.statements.unshift(funcCoverStatement);
    }
  }

  visitParameter(node: ParameterNode): void {
    super.visitParameter(node);

    const initializer = node.initializer;
    if (initializer) {
      const parmPoint = this.instrumentation.declarePoint(
        initializer,
        "CoverType.Expression",
        node
      );
      if (!parmPoint) return;

      node.initializer = this.instrumentation.coverExpression(
        parmPoint,
        initializer,
        node
      );
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
      const funcPoint = this.instrumentation.declarePoint(
        dec,
        "CoverType.Function"
      );
      if (!funcPoint) return;

      // Handle arrow expression bodies.
      if (!(dec.body instanceof BlockStatement)) {
        if (!(dec.body instanceof ExpressionStatement)) {
          throw new TypeError(
            "Expected function declaration body to be a block or expression"
          );
        }

        const expr = (dec.body as ExpressionStatement).expression;
        dec.body = Node.createBlockStatement(
          [Node.createReturnStatement(expr, expr.range)],
          expr.range
        );
      }

      const funcCoverStatement = this.instrumentation.coverStatement(
        funcPoint,
        dec,
        true
      );
      const bodyBlock = dec.body as BlockStatement;
      // Push the cover statement to the top of the function body.
      bodyBlock.statements.unshift(funcCoverStatement);
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

    // If its not a block, convert it to a Block kind.
    if (ifTrue.kind !== NodeKind.Block) {
      const ifTruePoint = this.instrumentation.declarePoint(
        ifTrue,
        "CoverType.Expression"
      );
      if (ifTruePoint) {
        const coverStatement = this.instrumentation.coverBlock(
          ifTruePoint,
          ifTrue
        );
        // This pushes the old value right below the __cover(id)
        coverStatement.statements.push(ifTrue);
        // Set coverStatement as the if statement's body
        stmt.ifTrue = coverStatement;

        // Set variables. This was because this transform was executing twice. These prevent that.
        visitIfTrue = true;
        visitIfFalse = !!ifFalse;
      }
    }
    // Handles false if statements
    if (ifFalse && ifFalse.kind !== NodeKind.Block) {
      const ifFalsePoint = this.instrumentation.declarePoint(
        ifFalse,
        "CoverType.Expression"
      );
      if (ifFalsePoint) {
        const coverStatement = this.instrumentation.coverBlock(
          ifFalsePoint,
          ifFalse
        );
        // Add old body right after __cover(id)
        coverStatement.statements.push(ifFalse);
        // Set the body to the coverStatement
        stmt.ifFalse = coverStatement;

        // Double-check prevention
        visitIfTrue = true;
        visitIfFalse = true;
      }
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
    // Call to super first.
    super.visitTernaryExpression(expr);
    // Cast the ifThen/Else into their own variables. (Prevents circularness)
    const trueExpression = expr.ifThen;
    const falseExpression = expr.ifElse;

    const truePoint = this.instrumentation.declarePoint(
      trueExpression,
      "CoverType.Expression"
    );
    if (truePoint) {
      // Set the left (true) side to the cover expression
      expr.ifThen = this.instrumentation.coverExpression(
        truePoint,
        trueExpression,
        trueExpression
      );
    }

    const falsePoint = this.instrumentation.declarePoint(
      falseExpression,
      "CoverType.Expression"
    );
    if (falsePoint) {
      // Set the false (right) side as the cover expression
      expr.ifElse = this.instrumentation.coverExpression(
        falsePoint,
        falseExpression,
        falseExpression
      );
    }
  }
  /**
   * Visits switch/case statements.
   * Puts a cover statement inside of each case (or default)
   * @param stmt - SwitchCase
   */
  visitSwitchCase(stmt: SwitchCase): void {
    const casePoint = this.instrumentation.declarePoint(
      stmt,
      "CoverType.Block"
    );
    if (!casePoint) return;

    const caseCoverStatement = this.instrumentation.coverStatement(
      casePoint,
      stmt
    );
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
    const blockPoint = this.instrumentation.declarePoint(
      node,
      "CoverType.Block"
    );
    if (!blockPoint) return;

    const coverStatement = this.instrumentation.coverStatement(
      blockPoint,
      node
    );
    // Call to super
    super.visitBlockStatement(node);
    // Push cover statements to the top of the block.
    node.statements.unshift(coverStatement);
  }

  // VisitSource utility.
  visitSource(source: Source) {
    this.instrumentation = new SourceInstrumentation(source);
    // Visit each source
    super.visitSource(source);
    // Push global statements to that source.
    this.instrumentation.prependDeclarations(source);
  }
}

// Transform class
export default class MyTransform extends Transform {
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
  }
};
