export declare enum CoverPointType {
    Function = 0,
    Block = 1,
    Expression = 2
}
export declare type CoverageRenderConfiguration = {
    width: number;
};
export declare class CoverPoint {
    file: string;
    line: number;
    col: number;
    id: number;
    type: CoverPointType;
    covered: boolean;
    constructor(file: string, line: number, col: number, id: number, type: CoverPointType);
}
declare class CoverPointReport {
    fileName: string;
    coverPoints: CoverPoint[];
    private calculated;
    private total;
    private totalCovered;
    private expressionTotal;
    private expressionCovered;
    private blockTotal;
    private blockCovered;
    private functionTotal;
    private functionCovered;
    private calculateStats;
    constructor(fileName: string);
    get coveredPercent(): number;
    get coveredBlockPercent(): number;
    get coveredExpressionPercent(): number;
    get coveredFunctionPercent(): number;
}
export declare class Covers {
    private coverPoints;
    private loader;
    installImports(imports: any): any;
    registerLoader(loader: any): void;
    private coverDeclare;
    private cover;
    reset(): void;
    createReport(): Map<string, CoverPointReport>;
    stringify(): string;
}
export {};
