import 'colors';
import { ASUtil } from "@assemblyscript/loader";
export declare const enum CoverPointType {
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
export declare class Covers {
    private coverPoints;
    private loader;
    installImports(imports: any): any;
    registerLoader(loader: ASUtil): void;
    private coverDeclare;
    private cover;
    reset(): void;
    stringify(config: CoverageRenderConfiguration): string;
}
