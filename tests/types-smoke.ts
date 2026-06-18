import {
  Covers,
  type CoverPointDiagnostic,
  type CoversOptions,
  type CoverageReportObject,
} from "../packages/glue/lib/index.js";

const options: CoversOptions = {
  files: ["src/**/*.ts"],
  strict: true,
};

const covers = new Covers(options);
const report: CoverageReportObject = covers.toJSON();
const diagnostics: CoverPointDiagnostic[] = covers.diagnostics();

covers.resetCoverage();
covers.clearDeclarations();
covers.reset();

void report;
void diagnostics;
