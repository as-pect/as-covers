"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const as_1 = require("visitor-as/as");
const visitor_as_1 = require("visitor-as");
// @ts-ignore
const line_column_1 = __importDefault(require("line-column"));
// -- Imports
class CoverTransform extends visitor_as_1.BaseVisitor {
    id = 0;
    linecol = 0;
    globalStatements = [];
    sources = [];
    // Declare properties.
    visitBinaryExpression(expr) {
        super.visitBinaryExpression(expr);
        const name = expr.range.source.normalizedPath;
        switch (expr.operator) {
            case as_1.Token.BAR_BAR:
            case as_1.Token.AMPERSAND_AMPERSAND: {
                const rightExpression = expr.right;
                // ID
                const rightId = this.id++;
                const rightLc = this.linecol.fromIndex(rightExpression.range.start);
                const rightLine = rightLc.line;
                const rightCol = rightLc.col;
                // Declare Statement
                const rightDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${rightId}, ${rightLine}, ${rightCol}, CoverType.Expression)`, true);
                const rightDeclareStatementSource = rightDeclareStatement.range.source;
                // Expression
                let rightCoverExpression = visitor_as_1.SimpleParser.parseExpression(`(__cover(${rightId}), $$REPLACE_ME)`);
                rightCoverExpression.expression.expressions[1] = rightExpression;
                expr.right = rightCoverExpression;
                this.sources.push(rightDeclareStatementSource);
                this.globalStatements.push(rightDeclareStatement);
                break;
            }
        }
    }
    visitMethodDeclaration(dec) {
        super.visitMethodDeclaration(dec);
        if (dec.body) {
            const name = dec.range.source.normalizedPath;
            const funcId = this.id++;
            const funcLc = this.linecol.fromIndex(dec.range.start);
            const funcLine = funcLc.line;
            const funcCol = funcLc.col;
            const funcDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${funcId}, ${funcLine}, ${funcCol}, CoverType.Function)`, true);
            const funcDeclareStatementSource = funcDeclareStatement.range.source;
            const funcCoverStatement = visitor_as_1.SimpleParser.parseStatement(`__cover(${funcId})`, true);
            const funcCoverStatementSource = funcCoverStatement.range.source;
            const bodyBlock = dec.body;
            bodyBlock.statements.unshift(funcCoverStatement);
            this.sources.push(funcCoverStatementSource);
            this.sources.push(funcDeclareStatementSource);
            this.globalStatements.push(funcDeclareStatement);
        }
    }
    visitParemeter(node) {
        const name = node.range.source.normalizedPath;
        super.visitParameter(node);
        if (node.initializer) {
            const parmId = this.id++;
            const parmLc = this.linecol.fromIndex(node.initializer.range.start);
            const parmLine = parmLc.line;
            const parmCol = parmLc.col;
            const parmDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${parmId}, ${parmLine}, ${parmCol}, CoverType.Expression)`, true);
            const parmDeclareStatementSource = parmDeclareStatement.range.source;
            const parmCoverExpression = visitor_as_1.SimpleParser.parseExpression(`(__cover(${parmId}), $$REPLACE_ME)`);
            const parmCoverExpressionSource = parmCoverExpression.range.source;
            parmCoverExpression.expression.expressions[1] = node.initializer;
            node.initializer = parmCoverExpression;
            this.sources.push(parmDeclareStatementSource, parmCoverExpressionSource);
            this.globalStatements.push(parmDeclareStatement);
        }
    }
    visitFunctionDeclaration(dec) {
        super.visitFunctionDeclaration(dec);
        if (dec.body) {
            const name = dec.range.source.normalizedPath;
            const funcId = this.id++;
            const funcLc = this.linecol.fromIndex(dec.range.start);
            const funcLine = funcLc.line;
            const funcCol = funcLc.col;
            const funcDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${funcId}, ${funcLine}, ${funcCol}, CoverType.Function)`, true);
            const funcDeclareStatementSource = funcDeclareStatement.range.source;
            this.sources.push(funcDeclareStatementSource);
            this.globalStatements.push(funcDeclareStatement);
            if (dec.body.kind === as_1.NodeKind.EXPRESSION) {
                const bodyStatement = visitor_as_1.SimpleParser.parseStatement(`
        {
          __cover(${funcId});
          return $$REPLACE_ME;
        }`);
                const bodyReturn = bodyStatement.statements[1];
                const body = dec.body;
                dec.arrowKind = 2 /* ARROW_SINGLE */;
                bodyReturn.value = body.expression;
                this.sources.push(bodyStatement.range.source);
                dec.body = body;
            }
            else {
                const funcCoverStatement = visitor_as_1.SimpleParser.parseStatement(`__cover(${funcId})`, true);
                const funcCoverStatementSource = funcCoverStatement.range.source;
                const bodyBlock = dec.body;
                bodyBlock.statements.unshift(funcCoverStatement);
                this.sources.push(funcCoverStatementSource);
            }
        }
    }
    visitIfStatement(stmt) {
        let visitIfTrue = false;
        let visitIfFalse = false;
        const ifTrue = stmt.ifTrue;
        const ifFalse = stmt.ifFalse;
        const name = stmt.range.source.normalizedPath;
        if (ifTrue.kind !== as_1.NodeKind.BLOCK) {
            const ifTrueId = this.id++;
            const trueLc = this.linecol.fromIndex(ifTrue.range.start);
            const trueLine = trueLc.line;
            const trueCol = trueLc.col;
            const coverDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${ifTrueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`, true);
            const coverDeclareStatementSource = coverDeclareStatement.range.source;
            const coverStatement = visitor_as_1.SimpleParser.parseStatement(`{__cover(${ifTrueId})};`, true);
            coverStatement.statements.push(ifTrue);
            stmt.ifTrue = coverStatement;
            this.sources.push(coverDeclareStatementSource);
            this.globalStatements.push(coverDeclareStatement);
            visitIfTrue = true;
            visitIfFalse = !!ifFalse;
        }
        if (ifFalse && ifFalse.kind !== as_1.NodeKind.BLOCK) {
            const ifFalseId = this.id++;
            const falseLc = this.linecol.fromIndex(ifFalse.range.start);
            const falseLine = falseLc.line;
            const falseCol = falseLc.col;
            const coverDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${ifFalseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`, true);
            const coverDeclareStatementSource = coverDeclareStatement.range.source;
            const coverStatement = visitor_as_1.SimpleParser.parseStatement(`{__cover(${ifFalseId})};`, true);
            coverStatement.statements.push(ifFalse);
            stmt.ifFalse = coverStatement;
            this.sources.push(coverDeclareStatementSource);
            this.globalStatements.push(coverDeclareStatement);
            visitIfTrue = true;
            visitIfFalse = true;
        }
        if (visitIfTrue || visitIfFalse) {
            if (visitIfTrue)
                this._visit(ifTrue);
            if (visitIfFalse)
                this._visit(ifFalse);
        }
        else {
            super.visitIfStatement(stmt);
        }
    }
    visitTernaryExpression(expr) {
        const trueExpression = expr.ifThen;
        const falseExpression = expr.ifElse;
        const name = expr.range.source.normalizedPath;
        // True
        const trueId = this.id++;
        const trueLc = this.linecol.fromIndex(trueExpression.range.start);
        const trueLine = trueLc.line;
        const trueCol = trueLc.col;
        // Cordinates
        const trueDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${trueId}, ${trueLine}, ${trueCol}, CoverType.Expression)`, true);
        const trueDeclareStatementSource = trueDeclareStatement.range.source;
        // @ts-ignore
        let trueCoverExpression = visitor_as_1.SimpleParser.parseExpression(`(__cover(${trueId}), $$REPLACE_ME)`);
        trueCoverExpression.expression.expressions[1] = trueExpression;
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
        const falseDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${falseId}, ${falseLine}, ${falseCol}, CoverType.Expression)`, true);
        const falseDeclareStatementSource = falseDeclareStatement.range.source;
        // @ts-ignore
        const falseCoverExpression = visitor_as_1.SimpleParser.parseExpression(`(__cover(${falseId}), $$REPLACE_ME)`);
        falseCoverExpression.expression.expressions[1] = falseExpression;
        expr.ifElse = falseCoverExpression;
        this.sources.push(falseDeclareStatementSource);
        this.globalStatements.push(falseDeclareStatement);
        super.visitTernaryExpression(expr);
    }
    visitSwitchCase(stmt) {
        const name = stmt.range.source.normalizedPath;
        const caseId = this.id++;
        const caseLc = this.linecol.fromIndex(stmt.range.start);
        const caseLine = caseLc.line;
        const caseCol = caseLc.col;
        // Cordinates
        const caseDeclareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${caseId}, ${caseLine}, ${caseCol}, CoverType.Block)`, true);
        const caseDeclareStatementSource = caseDeclareStatement.range.source;
        const caseCoverStatement = visitor_as_1.SimpleParser.parseStatement(`__cover(${caseId})`);
        const caseCoverStatementSource = caseCoverStatement.range.source;
        this.sources.push(caseDeclareStatementSource, caseCoverStatementSource);
        this.globalStatements.push(caseDeclareStatement);
        super.visitSwitchCase(stmt);
        stmt.statements.unshift(caseCoverStatement);
    }
    visitSource(source) {
        this.globalStatements = [];
        this.linecol = line_column_1.default(source.text);
        super.visitSource(source);
        source.statements.unshift(...this.globalStatements);
    }
    visitBlockStatement(node) {
        let coverId = this.id++;
        const name = node.range.source.normalizedPath;
        const lc = this.linecol.fromIndex(node.range.start);
        const line = lc.line;
        const col = lc.col;
        const declareStatement = visitor_as_1.SimpleParser.parseStatement(`__coverDeclare("${name}", ${coverId}, ${line}, ${col}, CoverType.Block)`, true);
        const declareStatementSource = declareStatement.range.source;
        const coverStatement = visitor_as_1.SimpleParser.parseStatement(`__cover(${coverId})`);
        const coverStatementSource = coverStatement.range.source;
        this.sources.push(declareStatementSource, coverStatementSource);
        this.globalStatements.push(declareStatement);
        super.visitBlockStatement(node);
        node.statements.unshift(coverStatement);
    }
}
module.exports = class MyTransform extends as_1.Transform {
    afterParse(parser) {
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
//# sourceMappingURL=index.js.map