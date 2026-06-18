import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import loader from "@assemblyscript/loader";
import { Covers, CoverPointType } from "../packages/glue/lib/index.js";

const fixtureRoot = path.resolve("tests/fixtures");
const outputRoot = path.resolve("tests/output/fixtures");
const ascPath = path.resolve("node_modules/assemblyscript/bin/asc.js");
const assemblyLibPath = path.resolve("packages/assembly/index.ts");
const transformPath = path.resolve("packages/transform/lib/index.js");

const typeNames = {
  [CoverPointType.Function]: "function",
  [CoverPointType.Block]: "block",
  [CoverPointType.Expression]: "expression",
};

const emptyTypeBreakdown = () => ({
  function: { covered: 0, uncovered: 0 },
  block: { covered: 0, uncovered: 0 },
  expression: { covered: 0, uncovered: 0 },
});

function fixtureNamesFromArgs() {
  const names = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  if (names.length > 0) return names;
  return fs
    .readdirSync(fixtureRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function compileFixture(name, fixtureDir, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const entryPath = path.join(fixtureDir, "index.ts");
  const outFile = path.join(outputDir, "output.wasm");
  const result = spawnSync(
    process.execPath,
    [
      ascPath,
      entryPath,
      "--lib",
      assemblyLibPath,
      "--transform",
      transformPath,
      "--outFile",
      outFile,
      "--exportStart",
      "_start",
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    throw new Error(
      `Fixture ${name} failed to compile.\n${result.stdout}${result.stderr}`
    );
  }

  return outFile;
}

function runFixture(wasmPath) {
  const covers = new Covers();
  const wasmModule = loader.instantiateSync(
    fs.readFileSync(wasmPath),
    covers.installImports({})
  );
  covers.registerLoader(wasmModule);
  wasmModule.exports._start();
  return covers;
}

function toLocation(point) {
  return `${point.file}:${point.line}:${point.col}`;
}

function summarize(covers) {
  const report = covers.createReport();
  report.delete("total");

  const points = [];
  for (const reportEntry of report.values()) {
    points.push(...reportEntry.coverPoints);
  }

  points.sort((left, right) => {
    if (left.file !== right.file) return left.file.localeCompare(right.file);
    if (left.line !== right.line) return left.line - right.line;
    if (left.col !== right.col) return left.col - right.col;
    return typeNames[left.type].localeCompare(typeNames[right.type]);
  });

  const typeBreakdown = emptyTypeBreakdown();
  for (const point of points) {
    const typeName = typeNames[point.type];
    if (!typeName) throw new Error(`Unknown cover point type: ${point.type}`);
    const key = point.covered ? "covered" : "uncovered";
    typeBreakdown[typeName][key]++;
  }

  return {
    pointCount: points.length,
    covered: points.filter((point) => point.covered).map(toLocation),
    uncovered: points.filter((point) => !point.covered).map(toLocation),
    typeBreakdown,
  };
}

function expectedPath(fixtureDir) {
  return path.join(fixtureDir, "expected.json");
}

function readExpected(fixtureDir) {
  return JSON.parse(fs.readFileSync(expectedPath(fixtureDir), "utf8"));
}

function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertFixture(name, actual, expected) {
  const actualJson = formatJson(actual);
  const expectedJson = formatJson(expected);
  if (actualJson !== expectedJson) {
    throw new Error(
      `Fixture ${name} coverage summary changed.\n\nExpected:\n${expectedJson}\nActual:\n${actualJson}`
    );
  }
}

const fixtureNames = fixtureNamesFromArgs();
const updateExpected = process.argv.includes("--update");
let passed = 0;
for (const name of fixtureNames) {
  const fixtureDir = path.join(fixtureRoot, name);
  const outputDir = path.join(outputRoot, name);
  const wasmPath = compileFixture(name, fixtureDir, outputDir);
  const actual = summarize(runFixture(wasmPath));

  if (updateExpected) {
    fs.writeFileSync(expectedPath(fixtureDir), formatJson(actual));
    console.log(`↻ ${name}`);
  } else {
    assertFixture(name, actual, readExpected(fixtureDir));
    console.log(`✓ ${name}`);
  }
  passed++;
}

console.log(
  updateExpected
    ? `Coverage fixture snapshots updated: ${passed}`
    : `Coverage fixtures passed: ${passed}`
);
