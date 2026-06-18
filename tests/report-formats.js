import assert from "node:assert/strict";
import yaml from "yaml";
import { Covers, CoverPointType } from "../packages/glue/lib/index.js";

function createSampleCovers() {
  const filePointers = new Map([[1, "src/sample.ts"]]);
  const covers = new Covers();
  const imports = covers.installImports({});
  covers.registerLoader({
    exports: {
      __getString(pointer) {
        return filePointers.get(pointer);
      },
    },
  });

  imports.__asCovers.coverDeclare(
    1,
    101,
    1,
    1,
    CoverPointType.Expression
  );
  imports.__asCovers.coverDeclare(
    1,
    102,
    2,
    1,
    CoverPointType.Expression
  );
  imports.__asCovers.coverDeclare(1, 201, 3, 1, CoverPointType.Block);
  imports.__asCovers.coverDeclare(1, 301, 4, 1, CoverPointType.Function);

  imports.__asCovers.cover(101);
  imports.__asCovers.cover(201);
  imports.__asCovers.cover(301);

  return covers;
}

const covers = createSampleCovers();
const jsonReport = covers.toJSON();

assert.equal(jsonReport["src/sample.ts"].overview.covered, 3);
assert.equal(jsonReport["src/sample.ts"].overview.uncovered, 1);
assert.equal(jsonReport["src/sample.ts"].overview.total, "75%");
assert.deepEqual(jsonReport["src/sample.ts"].overview.types, {
  block: "100%",
  function: "100%",
  expression: "50%",
});
assert.equal(jsonReport["src/sample.ts"]["src/sample.ts:1:1"].covered, true);
assert.equal(jsonReport["src/sample.ts"]["src/sample.ts:2:1"].covered, false);
assert.equal(jsonReport.total, undefined);

const yamlReport = yaml.parse(covers.toYAML());
assert.deepEqual(yamlReport, jsonReport);

console.log("Report format tests passed.");
