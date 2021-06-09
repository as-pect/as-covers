/// <reference types="assemblyscript/dist/assemblyscript" />
import { Parser } from "visitor-as/as";
declare const _default: {
    new (): {
        afterParse(parser: Parser): void;
        readonly program: import("visitor-as/as").Program;
        readonly baseDir: string;
        readonly stdout: import("assemblyscript/cli/asc").OutputStream;
        readonly stderr: import("assemblyscript/cli/asc").OutputStream;
        readonly log: {
            (...data: any[]): void;
            (message?: any, ...optionalParams: any[]): void;
        };
        writeFile(filename: string, contents: string | Uint8Array, baseDir: string): boolean;
        readFile(filename: string, baseDir: string): string | null;
        listFiles(dirname: string, baseDir: string): string[] | null;
        afterInitialize?(program: import("visitor-as/as").Program): void;
        afterCompile?(module: import("visitor-as/as").Module): void;
    };
};
export = _default;
