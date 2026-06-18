import assert from "node:assert/strict";
import { CoverPoint, CoverPointType } from "../packages/glue/lib/index.js";
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
assert.equal(registry.declare(firstPoint), firstPoint);
assert.equal(registry.size, 1);
assert.deepEqual(Array.from(registry.values()), [firstPoint]);

registry.cover(101);
assert.equal(firstPoint.covered, true);

registry.cover(999);
assert.equal(registry.size, 1);

const duplicatePoint = new CoverPoint(
  "src/duplicate.ts",
  9,
  9,
  101,
  CoverPointType.Expression
);
assert.equal(registry.declare(duplicatePoint), firstPoint);
assert.equal(registry.size, 1);
assert.equal(Array.from(registry.values())[0], firstPoint);

registry.reset();
assert.equal(registry.size, 0);
registry.cover(101);
assert.equal(registry.size, 0);

console.log("Cover point registry tests passed.");
