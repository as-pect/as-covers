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
