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
assert.deepEqual(registry.diagnostics(), []);
assert.equal(registry.declare(firstPoint), firstPoint);
assert.equal(registry.size, 1);
assert.deepEqual(Array.from(registry.values()), [firstPoint]);
assert.deepEqual(registry.diagnostics(), []);

registry.cover(101);
assert.equal(firstPoint.covered, true);

registry.cover(999);
assert.equal(registry.size, 1);

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

console.log("Cover point registry tests passed.");
