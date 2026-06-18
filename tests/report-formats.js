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

function createHtmlCovers() {
  const filePointers = new Map([[1, 'src/<sample>&"report".ts']]);
  const covers = new Covers();
  const imports = covers.installImports({});
  covers.registerLoader({
    exports: {
      __getString(pointer) {
        return filePointers.get(pointer);
      },
    },
  });

  imports.__asCovers.coverDeclare(1, 501, 1, 1, CoverPointType.Block);
  imports.__asCovers.coverDeclare(1, 502, 2, 1, CoverPointType.Block);
  imports.__asCovers.cover(501);

  return covers;
}

function createCsvCovers() {
  const filePointers = new Map([[1, "src/a,\"b\"\n.ts"]]);
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
    401,
    5,
    6,
    CoverPointType.Expression
  );
  imports.__asCovers.coverDeclare(1, 402, 7, 8, CoverPointType.Block);
  imports.__asCovers.cover(401);

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

assert.equal(
  covers.toLCOV(),
  "TN:\n" +
    "SF:src/sample.ts\n" +
    "FN:4,as_covers_301\n" +
    "FNDA:1,as_covers_301\n" +
    "FNF:1\n" +
    "FNH:1\n" +
    "DA:1,1\n" +
    "DA:2,0\n" +
    "DA:3,1\n" +
    "DA:4,1\n" +
    "LF:4\n" +
    "LH:3\n" +
    "end_of_record\n"
);

const htmlReport = createHtmlCovers().toHTML();
assert.match(htmlReport, /^<!doctype html>/);
assert.match(htmlReport, /src\/&lt;sample&gt;&amp;&quot;report&quot;\.ts/);
assert.match(htmlReport, /<td>50%<\/td>/);
assert.match(htmlReport, /<td>2:1<\/td>/);

assert.equal(
  createCsvCovers().toCSV(),
  'File,Covered,ID,Column,Line\n' +
    '"src/a,""b""\n.ts",true,401,6,5\n' +
    '"src/a,""b""\n.ts",false,402,8,7\n'
);

console.log("Report format tests passed.");
