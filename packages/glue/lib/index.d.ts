import 'colors';
import { ASUtil } from "@assemblyscript/loader";
export declare enum CoverPointType {
    none = 0,
    Function = 1,
    Block = 2,
    Expression = 3
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
export declare class Covers {
    private coverPoints;
    private loader;
    private coversExecuted;
    private coversExpected;
    installImports(imports: any): any;
    registerLoader(loader: ASUtil): void;
    private coverDeclare;
    private cover;
    reset(): void;
    stringify(config: CoverageRenderConfiguration): string;
}
