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

registry.reset();
assert.equal(registry.size, 0);
assert.deepEqual(registry.diagnostics(), []);

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

console.log("Cover point registry tests passed.");
