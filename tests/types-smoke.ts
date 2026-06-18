import {
  Covers,
  type CoverPointDiagnostic,
  type CoversOptions,
  type CoverageReportObject,
} from "../packages/glue/lib/index.js";
import {
  Covers as CoreCovers,
  type CoversOptions as CoreCoversOptions,
} from "../packages/core/index.js";

const options: CoversOptions = {
  files: ["src/**/*.ts"],
  strict: true,
};

const covers = new Covers(options);
const coreOptions: CoreCoversOptions = options;
const coreCovers = new CoreCovers(coreOptions);
const report: CoverageReportObject = covers.toJSON();
const diagnostics: CoverPointDiagnostic[] = covers.diagnostics();

covers.resetCoverage();
covers.clearDeclarations();
covers.reset();

void coreCovers;
void report;
void diagnostics;
