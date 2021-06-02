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
  CallExpression
} from 'visitor-as/as'

import { utils, SimpleParser, BaseVisitor } from 'visitor-as'
import linecol from 'line-column'
// -- Imports
class CoverTransform extends BaseVisitor {
  private id: number = 0
  private linecol: any = 0
  private globalStatements: Statement[] = []
  public sources: Source[] = [];
  private sourceId: number = 0;
  // Declare properties. 
  visitBinaryExpression(expr: BinaryExpression): void {
    if (expr.operator === Token.AMPERSAND_AMPERSAND) {
      // Handle && Symbols

    }
    if (expr.operator === Token.BAR_BAR) {
      // Handle || Symbols
    }
    super.visitBinaryExpression(expr)
  }

  visitIfStatement(stmt: IfStatement): void {
    // How to find if its a block, @jtenner?
    super.visitIfStatement(stmt)
  }

  visitTernaryExpression(expr: TernaryExpression): void {
    /*const coverId = this.id++
    const truthy = expr.ifThen
    const truthyReplacement: CallExpression = SimpleParser.parseExpression(`__coverExpression($$REPLACE_ME, ${coverId})`)
    const source = truthyReplacement.range.source
    //truthy.args[0] = ifThen
    super.visitTernaryExpression(expr)*/
  }

  visitSwitchCase(stmt: SwitchCase): void {
    // unshift statement into statements
    super.visitSwitchCase(stmt)
  }

  visitSource(source: Source) {
    this.globalStatements = []
    this.linecol = linecol(source.text)
    super.visitSource(source)

    source.statements.unshift(...this.globalStatements)
  }

  visitBlockStatement(node: BlockStatement) {
    let coverId = this.id++
    const name = node.range.source.normalizedPath
    const lc = this.linecol.fromIndex(node.range.start)
    const line = lc.line
    const col = lc.col

    const declareStatement = SimpleParser.parseStatement(`__coverDeclare("${name}", ${coverId}, ${line}, ${col}, CoverType.Block)`, true)
    const declareStatementSource = declareStatement.range.source
    const coverStatement = SimpleParser.parseStatement(`__cover(${coverId})`)
    const coverStatementSource = coverStatement.range.source
    this.sources.push(declareStatementSource, coverStatementSource)
    node.statements.unshift(coverStatement)
    this.globalStatements.push(declareStatement)
  }
}

export = class MyTransform extends Transform {
  afterParse(parser: Parser): void {
    const transformer = new CoverTransform()
    for (const source of parser.sources) {
      if (!source.isLibrary && !source.internalPath.startsWith(`~lib/`)) {
        transformer.visit(source)
        console.log('!lib', source.internalPath)
      }
    }
    let i = 0
    for (const source of transformer.sources) {
      source.internalPath += `${i++}.ts`;
      parser.sources.push(source)
      console.log(source.internalPath)
      // Modify file names (incremental)
    }
  }
}