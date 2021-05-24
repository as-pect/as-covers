import {
  AssertionKind,
  BinaryExpression,
  BlockStatement,
  Expression,
  FunctionDeclaration,
  IfStatement,
  MethodDeclaration,
  NodeKind,
  Parser,
  Range,
  Source,
  Statement,
  TernaryExpression,
  Token,
  Transform,
  TypeNode,
} from "visitor-as/as";
import {
  BaseVisitor,
} from "visitor-as";
const lineColumn = require("line-column");
// __coverDeclare("file", line, col, type, id);
// __cover(id);

function numberParameter(value: number, numType: string, range: Range): Expression {
  // value as numType
  return TypeNode.createAssertionExpression(
    AssertionKind.AS,
    TypeNode.createIntegerLiteralExpression(f64_as_i64(value), range),
    TypeNode.createNamedType(
      TypeNode.createSimpleTypeName(numType, range),
      null,
      false,
      range,
    ),
    range,
  );
}

function createDeclareCall(path: string, linecol: any, coverType: string, id: number, range: Range): Statement {
  return TypeNode.createExpressionStatement(
    TypeNode.createCallExpression(
      TypeNode.createIdentifierExpression("__coverDeclare", range),
      null,
      [
        // "filename.ts"
        TypeNode.createStringLiteralExpression(path, range),
        // line as u32
        numberParameter(linecol.line, "u32", range),
        // col as u32
        numberParameter(linecol.column, "u32", range),
        // CoverType.Block
        TypeNode.createPropertyAccessExpression(
          TypeNode.createIdentifierExpression("CoverType", range),
          TypeNode.createIdentifierExpression(coverType, range),
          range,
        ),
        // id
        numberParameter(id, "u32", range),
      ],
      range,
    )
  );
}

function createCoverCall(id: number, range: Range): Statement {
  // __cover(id)
  return TypeNode.createExpressionStatement(
    TypeNode.createCallExpression(
      TypeNode.createIdentifierExpression("__cover", range),
      null,
      [
        numberParameter(id, "u32", range),
      ],
      range,
    ),
  );
}

function createCoverExpressionCall(expression: Expression, id: number, range: Range): Expression {
  // __coverExpression(value, id)
  return  TypeNode.createCallExpression(
    TypeNode.createIdentifierExpression("__coverExpression", range),
    null,
    [
      expression,
      numberParameter(id, "u32", range),
    ],
    range,
  );
}

class CoverTransform extends BaseVisitor {
  private id: number = 0;
  public globalStatements: Statement[] = [];
  private linecol: { fromIndex(val: number): { line: number, column: number } } = null as any;
  private covered: Set<Statement> = new Set();

  public reset(): void {
    this.globalStatements = [];
    this.covered.clear();
  }

  public visitSource(source: Source): void {
    this.linecol = lineColumn(source.text);
    super.visitSource(source);
  }

  public visitTernaryExpression(expression: TernaryExpression): void {
    // let a = b ? __coverExpression(c, id) : __coverExpression(d, id);
    const linecol = this.linecol.fromIndex(expression.range.start);

    const ifThenId = this.id++;
    this.globalStatements.unshift(
      createDeclareCall(
        expression.range.source.normalizedPath,
        linecol,
        "Expression",
        ifThenId,
        expression.range,
      ),
    );
    expression.ifThen = createCoverExpressionCall(expression.ifThen, ifThenId, expression.range);

    const ifElseId = this.id++;
    this.globalStatements.unshift(
      createDeclareCall(
        expression.range.source.normalizedPath,
        linecol,
        "Expression",
        ifElseId,
        expression.range,
      ),
    );
    expression.ifElse = createCoverExpressionCall(expression.ifElse, ifElseId, expression.range);

    super.visitTernaryExpression(expression);
  }

  public visitBinaryExpression(expression: BinaryExpression): void {
    switch (expression.operator) {
      // &&
      case Token.AMPERSAND_AMPERSAND:
      // ||
      case Token.BAR_BAR: {
        const linecol = this.linecol.fromIndex(expression.range.start);
        const binaryExpressionId = this.id++;
        const declareStatement = createDeclareCall(
          expression.range.source.normalizedPath,
          linecol,
          "Expression",
          binaryExpressionId,
          expression.range,
        );
        // __declareCover(...)
        this.globalStatements.unshift(declareStatement);
        expression.right = createCoverExpressionCall(expression.right, binaryExpressionId, expression.range);
      }
      default: break;
    }
    super.visitBinaryExpression(expression);
  }

  public visitMethodDeclaration(node: MethodDeclaration): void {
    if (node.body && node.body.kind == NodeKind.BLOCK) {
      const linecol = this.linecol.fromIndex(node.range.start);
      const functionId = this.id++;
      this.globalStatements.unshift(createDeclareCall(node.range.source.normalizedPath, linecol, "Function", functionId, node.range));
      (node.body as BlockStatement).statements.unshift(createCoverCall(functionId, node.range));
    } else {
      console.warn("Method declaration without a body.");
    }
    super.visitMethodDeclaration(node);
  }

  public visitFunctionDeclaration(node: FunctionDeclaration): void {
    if (node.body && node.body.kind == NodeKind.BLOCK) {
      const linecol = this.linecol.fromIndex(node.range.start);
      const functionId = this.id++;
      this.globalStatements.unshift(createDeclareCall(node.range.source.normalizedPath, linecol, "Function", functionId, node.range));
      (node.body as BlockStatement).statements.unshift(createCoverCall(functionId, node.range));
    } else {
      // Ask dcode :D
    }
    super.visitFunctionDeclaration(node);
  }

  public visitBlockStatement(node: BlockStatement): void {
    if (this.covered.has(node)) return super.visitBlockStatement(node);
    this.covered.add(node);

    const linecol = this.linecol.fromIndex(node.range.start);
    const blockId = this.id++;
    // declare the block
    const blockDeclare = createDeclareCall(node.range.source.normalizedPath, linecol, "Block", blockId, node.range);
    this.globalStatements.unshift(blockDeclare);

    // create the cover call
    node.statements.unshift(createCoverCall(blockId, node.range));

    // visit children
    super.visitBlockStatement(node);
  }

  public visitIfStatement(node: IfStatement): void {
    if (this.covered.has(node)) return super.visitIfStatement(node);
    this.covered.add(node);

    const linecol = this.linecol.fromIndex(node.range.start);

    if (node.ifTrue.kind != NodeKind.BLOCK) {
      node.ifTrue = this.injectBlock(node.ifTrue, linecol);
    }

    if (node.ifFalse && node.ifFalse.kind != NodeKind.BLOCK) {
      node.ifFalse = this.injectBlock(node.ifFalse, lineColumn);
    }

    // delegate visiting to the parent function
    super.visit(node);
  }

  private injectBlock(node: Statement, linecol: any): BlockStatement {
    const blockId = this.id++;
    const blockDeclare = createDeclareCall(node.range.source.normalizedPath, linecol, "Block", blockId, node.range);
    // __coverDeclare(fileName, line, col, type, id);
    this.globalStatements.unshift(blockDeclare);
    const newBlock = TypeNode.createBlockStatement([
      // __cover(id)
      createCoverCall(blockId, node.range),
      node,
    ], node.range);
    return newBlock;
  }
}

export = class MyTransform extends Transform {
  afterParse(parser: Parser): void {
    let v = new CoverTransform();

    for (const source of parser.sources) {
      v.visit(source);
      for (const statement of v.globalStatements) {
        source.statements.unshift(statement);
      }
      v.reset();
    }
  }
}