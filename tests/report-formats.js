import assert from "node:assert/strict";
import yaml from "yaml";
import { Covers, CoverPointType } from "../packages/glue/lib/index.js";

function createCovers(file, points, coveredIds) {
  const covers = new Covers();
  const imports = covers.installImports({});
  covers.registerLoader({
    exports: {
      __getString() {
        return file;
      },
    },
  });

  for (const { id, line, col, type } of points) {
    imports.__asCovers.coverDeclare(1, id, line, col, type);
  }

  for (const id of coveredIds) {
    imports.__asCovers.cover(id);
  }

  return covers;
}

function createSampleCovers() {
  return createCovers(
    "src/sample.ts",
    [
      { id: 101, line: 1, col: 1, type: CoverPointType.Expression },
      { id: 102, line: 2, col: 1, type: CoverPointType.Expression },
      { id: 201, line: 3, col: 1, type: CoverPointType.Block },
      { id: 301, line: 4, col: 1, type: CoverPointType.Function },
    ],
    [101, 201, 301]
  );
}

function createHtmlCovers() {
  return createCovers(
    'src/<sample>&"report".ts',
    [
      { id: 501, line: 1, col: 1, type: CoverPointType.Block },
      { id: 502, line: 2, col: 1, type: CoverPointType.Block },
    ],
    [501]
  );
}

function createCsvCovers() {
  return createCovers(
    "src/a,\"b\"\n.ts",
    [
      { id: 401, line: 5, col: 6, type: CoverPointType.Expression },
      { id: 402, line: 7, col: 8, type: CoverPointType.Block },
    ],
    [401]
  );
}

function createDuplicateLocationCovers() {
  return createCovers(
    "src/duplicate-location.ts",
    [
      { id: 701, line: 3, col: 5, type: CoverPointType.Block },
      { id: 702, line: 3, col: 5, type: CoverPointType.Expression },
    ],
    [701]
  );
}

function parseLCOV(output) {
  const records = [];
  let current = null;

  for (const line of output.trimEnd().split(/\r?\n/)) {
    if (line === "TN:") continue;

    if (line.startsWith("SF:")) {
      current = {
        sourceFile: line.slice(3),
        functions: {},
        functionHits: {},
        lineHits: {},
        totals: {},
      };
      continue;
    }

    if (!current) {
      throw new Error(`LCOV line appeared before a source file: ${line}`);
    }

    if (line.startsWith("FN:")) {
      const [lineNumber, name] = line.slice(3).split(",");
      current.functions[name] = Number(lineNumber);
    } else if (line.startsWith("FNDA:")) {
      const [hits, name] = line.slice(5).split(",");
      current.functionHits[name] = Number(hits);
    } else if (line.startsWith("FNF:")) {
      current.totals.foundFunctions = Number(line.slice(4));
    } else if (line.startsWith("FNH:")) {
      current.totals.hitFunctions = Number(line.slice(4));
    } else if (line.startsWith("DA:")) {
      const [lineNumber, hits] = line.slice(3).split(",");
      current.lineHits[lineNumber] = Number(hits);
    } else if (line.startsWith("LF:")) {
      current.totals.foundLines = Number(line.slice(3));
    } else if (line.startsWith("LH:")) {
      current.totals.hitLines = Number(line.slice(3));
    } else if (line === "end_of_record") {
      records.push(current);
      current = null;
    } else {
      throw new Error(`Unrecognized LCOV line: ${line}`);
    }
  }

  return records;
}

function parseCSV(output) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < output.length; index++) {
    const char = output[index];

    if (inQuotes) {
      if (char === '"' && output[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
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

const duplicateLocationReport = createDuplicateLocationCovers().toJSON();
const duplicateLocationEntries = Object.values(
  duplicateLocationReport["src/duplicate-location.ts"]
).filter((entry) => entry.id !== undefined);
assert.deepEqual(
  duplicateLocationEntries.map((entry) => entry.id).sort(),
  [701, 702]
);

const liveCovers = createCsvCovers();
const liveReport = liveCovers.createReport().get("total");
assert.equal(liveReport.coveredPercent, "50%");
liveReport.coverPoints[1].covered = true;
assert.equal(liveReport.coveredPointsNumber, 2);
assert.equal(liveReport.coveredPercent, "100%");
assert.equal(liveReport.coveredBlockPercent, "100%");

const isolatedCovers = createCsvCovers();
const isolatedReport = isolatedCovers.createReport().get("total");
isolatedReport.coverPoints[0].covered = false;
assert.equal(isolatedCovers.createReport().get("total").coveredPointsNumber, 1);

assert.deepEqual(parseLCOV(covers.toLCOV()), [
  {
    sourceFile: "src/sample.ts",
    functions: { as_covers_301: 4 },
    functionHits: { as_covers_301: 1 },
    lineHits: { 1: 1, 2: 0, 3: 1, 4: 1 },
    totals: {
      foundFunctions: 1,
      hitFunctions: 1,
      foundLines: 4,
      hitLines: 3,
    },
  },
]);

const htmlReport = createHtmlCovers().toHTML();
assert.match(htmlReport, /^<!doctype html>/);
assert.match(htmlReport, /src\/&lt;sample&gt;&amp;&quot;report&quot;\.ts/);
assert.match(htmlReport, /<td>50%<\/td>/);
assert.match(htmlReport, /<td>2:1<\/td>/);

assert.deepEqual(parseCSV(createCsvCovers().toCSV()), [
  ["File", "Covered", "ID", "Column", "Line"],
  ['src/a,"b"\n.ts', "true", "401", "6", "5"],
  ['src/a,"b"\n.ts', "false", "402", "8", "7"],
]);

console.log("Report format tests passed.");
