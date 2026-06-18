// This is the standard broad regression test for AS-Covers.
// If it fails, coverage behavior changed. Run `npm run test:update-snapshots`
// only when the new report shape is intentional.
import loader from "@assemblyscript/loader";
import fs from "fs";
import { Covers } from "../packages/glue/lib/index.js";

const covers = new Covers();
const coverReportSnapshotLocation = "./tests/output/coverReportSnapshot.json";

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function reportPointEntries(fileReport) {
  return Object.entries(fileReport)
    .filter(([key]) => key !== "overview")
    .sort(([left], [right]) => left.localeCompare(right));
}

function formatPoint(fileReport, location) {
  const point = fileReport[location];
  if (!point) return location;
  return `${location} covered=${point.covered} id=${point.id}`;
}

function formatPointList(fileReport, locations) {
  if (locations.length === 0) return "  none";
  return locations.map((location) => `  - ${formatPoint(fileReport, location)}`).join("\n");
}

function reportPoints(report) {
  const lines = [];
  for (const file of Object.keys(report).sort()) {
    lines.push(`${file}:`);
    const entries = reportPointEntries(report[file]);
    if (entries.length === 0) {
      lines.push("  none");
      continue;
    }
    for (const [location, point] of entries) {
      lines.push(`  - ${formatPoint({ [location]: point }, location)}`);
    }
  }
  return lines.join("\n");
}

function diffReports(expected, actual) {
  const diffs = [];
  const files = new Set([...Object.keys(expected), ...Object.keys(actual)]);

  for (const file of Array.from(files).sort()) {
    const expectedFile = expected[file];
    const actualFile = actual[file];

    if (!expectedFile) {
      diffs.push(`Unexpected file in report: ${file}`);
      continue;
    }
    if (!actualFile) {
      diffs.push(`Missing file in report: ${file}`);
      continue;
    }

    const expectedOverview = formatJson(expectedFile.overview);
    const actualOverview = formatJson(actualFile.overview);
    if (expectedOverview !== actualOverview) {
      diffs.push(
        `Coverage stats changed for ${file}.\nExpected overview:\n${expectedOverview}\nActual overview:\n${actualOverview}`
      );
    }

    const expectedPoints = reportPointEntries(expectedFile).map(([location]) => location);
    const actualPoints = reportPointEntries(actualFile).map(([location]) => location);
    const expectedPointSet = new Set(expectedPoints);
    const actualPointSet = new Set(actualPoints);
    const missingPoints = expectedPoints.filter((location) => !actualPointSet.has(location));
    const unexpectedPoints = actualPoints.filter((location) => !expectedPointSet.has(location));

    if (missingPoints.length > 0) {
      diffs.push(
        `Missing points for ${file}:\n${formatPointList(expectedFile, missingPoints)}`
      );
    }

    if (unexpectedPoints.length > 0) {
      diffs.push(
        `Unexpected points for ${file}:\n${formatPointList(actualFile, unexpectedPoints)}`
      );
    }

    const changedPoints = expectedPoints.filter((location) => {
      if (!actualPointSet.has(location)) return false;
      return formatJson(expectedFile[location]) !== formatJson(actualFile[location]);
    });

    if (changedPoints.length > 0) {
      const pointDiffs = changedPoints.map(
        (location) =>
          `  - ${location}\n    expected ${formatJson(expectedFile[location]).trim()}\n    actual   ${formatJson(actualFile[location]).trim()}`
      );
      diffs.push(`Changed points for ${file}:\n${pointDiffs.join("\n")}`);
    }
  }

  return diffs;
}

function assertReportMatchesSnapshot(actualReport) {
  const expectedReport = JSON.parse(
    fs.readFileSync(coverReportSnapshotLocation, "utf8")
  );
  const diffs = diffReports(expectedReport, actualReport);

  if (diffs.length === 0) return;

  throw new Error(
    `Broad coverage snapshot changed.\n\n${diffs.join(
      "\n\n"
    )}\n\nExpected points:\n${reportPoints(
      expectedReport
    )}\n\nActual points:\n${reportPoints(
      actualReport
    )}\n\nIf this coverage behavior is intentional, run npm run test:update-snapshots.`
  );
}

console.log("-- Instantiating module. --");
const wasmModule = loader.instantiateSync(
  fs.readFileSync("./tests/output/output.wasm"),
  covers.installImports({})
);
console.log("-- Registering loader. --");
covers.registerLoader(wasmModule);

console.log("-- Starting module execution --");
wasmModule.exports._start();

const report = covers.toJSON();

if (process.argv.includes("--create")) {
  console.log("-- Creating Snapshot. --");
  fs.writeFileSync(coverReportSnapshotLocation, formatJson(report));
  process.exit(0);
}

assertReportMatchesSnapshot(report);
console.log("Test Result: Passed.");

const output = covers.stringify();
process.stdout.write(output);
