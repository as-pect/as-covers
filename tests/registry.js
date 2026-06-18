import assert from "node:assert/strict";
import { Covers, CoverPoint, CoverPointType } from "../packages/glue/lib/index.js";
import { CoverPointRegistry } from "../packages/glue/lib/registry.js";

const registry = new CoverPointRegistry();
const firstPoint = new CoverPoint(
  "src/first.ts",
  1,
  2,
  101,
  CoverPointType.Block
);

assert.equal(registry.size, 0);
assert.deepEqual(registry.diagnostics(), []);
assert.equal(registry.declare(firstPoint), firstPoint);
assert.equal(registry.size, 1);
assert.deepEqual(Array.from(registry.values()), [firstPoint]);
assert.deepEqual(registry.diagnostics(), []);

registry.cover(101);
assert.equal(firstPoint.covered, true);
registry.resetCoverage();
assert.equal(firstPoint.covered, false);
registry.cover(101);
assert.equal(firstPoint.covered, true);

const exactDuplicatePoint = new CoverPoint(
  "src/first.ts",
  1,
  2,
  101,
  CoverPointType.Block
);
assert.equal(registry.declare(exactDuplicatePoint), firstPoint);
assert.equal(registry.size, 1);
assert.deepEqual(registry.diagnostics(), []);

const collisionPoint = new CoverPoint(
  "src/collision.ts",
  9,
  9,
  101,
  CoverPointType.Expression
);
assert.equal(registry.declare(collisionPoint), firstPoint);
assert.equal(registry.declare(collisionPoint), firstPoint);
assert.equal(registry.size, 1);
assert.equal(Array.from(registry.values())[0], firstPoint);
assert.deepEqual(registry.diagnostics(), [
  {
    kind: "id-collision",
    id: 101,
    existing: {
      file: "src/first.ts",
      line: 1,
      col: 2,
      type: CoverPointType.Block,
    },
    incoming: {
      file: "src/collision.ts",
      line: 9,
      col: 9,
      type: CoverPointType.Expression,
    },
    message: "Cover point id 101 was declared for multiple locations.",
  },
]);
const externalDiagnostics = registry.diagnostics();
externalDiagnostics[0].message = "mutated outside registry";
externalDiagnostics[0].existing.file = "src/mutated.ts";
assert.equal(
  registry.diagnostics()[0].message,
  "Cover point id 101 was declared for multiple locations."
);
assert.equal(registry.diagnostics()[0].existing.file, "src/first.ts");

registry.clearDeclarations();
assert.equal(registry.size, 0);
assert.deepEqual(registry.diagnostics(), []);

registry.cover(101);
registry.cover(101);
assert.equal(registry.size, 0);
assert.deepEqual(registry.diagnostics(), [
  {
    kind: "unknown-cover",
    id: 101,
    message: "Unknown cover point id 101 was executed before declaration.",
  },
]);

assert.throws(
  () => registry.cover(202, true),
  /Unknown cover point id 202 was executed before declaration\./
);
assert.equal(registry.diagnostics().at(-1).id, 202);

const coversWithoutLoader = new Covers();
const importsWithoutLoader = coversWithoutLoader.installImports({});
assert.throws(
  () =>
    importsWithoutLoader.__asCovers.coverDeclare(
      0,
      302,
      1,
      1,
      CoverPointType.Block
    ),
  /Covers\.registerLoader\(loader\) must be called before coverage declarations run\./
);

const coversWithBadStringLoader = new Covers();
const badStringImports = coversWithBadStringLoader.installImports({});
coversWithBadStringLoader.registerLoader({
  exports: {
    __getString() {
      return undefined;
    },
  },
});
assert.throws(
  () =>
    badStringImports.__asCovers.coverDeclare(
      0,
      302,
      1,
      1,
      CoverPointType.Block
    ),
  /Covers loader __getString\(filePtr\) must return a source file string\./
);

const covers = new Covers();
const imports = covers.installImports({});
imports.__asCovers.cover(303);
assert.deepEqual(covers.diagnostics(), [
  {
    kind: "unknown-cover",
    id: 303,
    message: "Unknown cover point id 303 was executed before declaration.",
  },
]);

const strictCovers = new Covers({ strict: true });
const strictImports = strictCovers.installImports({});
assert.throws(
  () => strictImports.__asCovers.cover(404),
  /Unknown cover point id 404 was executed before declaration\./
);
assert.equal(strictCovers.diagnostics()[0].id, 404);

const defaultedFilesCovers = new Covers({ files: undefined });
const defaultedFilesImports = defaultedFilesCovers.installImports({});
defaultedFilesCovers.registerLoader({
  exports: {
    __getString() {
      return "src/defaulted-files.ts";
    },
  },
});
assert.doesNotThrow(() =>
  defaultedFilesImports.__asCovers.coverDeclare(
    0,
    406,
    1,
    1,
    CoverPointType.Block
  )
);
assert.equal(
  defaultedFilesCovers.createReport().get("total").coverPoints.length,
  1
);

const filteredCovers = new Covers({ files: ["src/included.ts"], strict: true });
const filteredImports = filteredCovers.installImports({});
filteredCovers.registerLoader({
  exports: {
    __getString() {
      return "src/excluded.ts";
    },
  },
});
filteredImports.__asCovers.coverDeclare(0, 405, 1, 1, CoverPointType.Block);
assert.doesNotThrow(() => filteredImports.__asCovers.cover(405));
assert.equal(filteredCovers.createReport().get("total").coverPoints.length, 0);
assert.deepEqual(filteredCovers.diagnostics(), []);

const resetCovers = new Covers();
const resetImports = resetCovers.installImports({});
resetCovers.registerLoader({
  exports: {
    __getString() {
      return "src/reset.ts";
    },
  },
});
resetImports.__asCovers.coverDeclare(0, 505, 1, 1, CoverPointType.Block);
resetImports.__asCovers.cover(505);
assert.equal(resetCovers.createReport().get("total").coveredPointsNumber, 1);

resetCovers.resetCoverage();
assert.equal(resetCovers.createReport().get("total").coveredPointsNumber, 0);
assert.equal(resetCovers.createReport().get("total").uncoveredPointsNumber, 1);

resetCovers.clearDeclarations();
assert.equal(resetCovers.createReport().get("total").coverPoints.length, 0);

resetImports.__asCovers.coverDeclare(0, 506, 1, 1, CoverPointType.Block);
assert.equal(resetCovers.createReport().get("total").coverPoints.length, 1);
resetCovers.reset();
assert.equal(resetCovers.createReport().get("total").coverPoints.length, 0);

const multiRunCovers = new Covers();
const multiRunImports = multiRunCovers.installImports({});
multiRunCovers.registerLoader({
  exports: {
    __getString() {
      return "src/shared.ts";
    },
  },
});
multiRunImports.__asCovers.coverDeclare(0, 601, 1, 1, CoverPointType.Block);
multiRunImports.__asCovers.cover(601);

multiRunCovers.registerLoader({
  exports: {
    __getString(pointer) {
      return pointer === 1 ? "src/shared.ts" : "src/second.ts";
    },
  },
});
multiRunImports.__asCovers.coverDeclare(1, 601, 1, 1, CoverPointType.Block);
multiRunImports.__asCovers.coverDeclare(2, 602, 2, 1, CoverPointType.Block);
multiRunImports.__asCovers.cover(602);

const multiRunReport = multiRunCovers.createReport();
assert.equal(multiRunReport.get("total").coverPoints.length, 2);
assert.equal(multiRunReport.get("total").coveredPointsNumber, 2);
assert.equal(multiRunCovers.diagnostics().length, 0);

multiRunCovers.resetCoverage();
assert.equal(multiRunCovers.createReport().get("total").coverPoints.length, 2);
assert.equal(multiRunCovers.createReport().get("total").coveredPointsNumber, 0);

console.log("Cover point registry tests passed.");
