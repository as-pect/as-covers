# as-covers Agent TODO

Generated from the architecture review on 2026-06-17.

This file breaks the review findings into epic work slices and smaller agent-grabbable goal/work slices. Each work slice should leave the repo in a verified state, with tests or documentation updated before committing.

## Execution order

1. **Epic 1 — Stabilize the package and release seam**: agents need a reliable install/build/test loop before changing coverage behavior.
2. **Epic 2 — Add a coverage semantics fixture matrix**: create narrow regression seams before reshaping the transform.
3. **Epic 3 — Deepen the coverage instrumentation module**: fix the highest-risk transform bugs and concentrate instrumentation rules.
4. **Epic 4 — Deepen report generation**: remove duplicated report implementations and fix output bugs.
5. **Epic 5 — Make cover point identity a registry module**: add diagnostics and safe multi-run behavior.

---

## Epic 1 — Stabilize the package and release seam

**Goal:** make installation, local development, testing, and npm package contents a single reliable seam.

**Why:** the current package surface is shallow. Users and agents must understand `lerna`, hoisted dependencies, generated `lib` directories, and the difference between `core`, `glue`, `transform`, and `assembly` before they can run coverage.

**Observed bugs/signals:**

- `npm test` fails in a clean checkout because dependencies are absent.
- `npm install` on Node v26.3.0 fails in `postinstall` at `lerna bootstrap --hoist`.
- `@as-covers/core` declares `main: index.js`, but no `index.js` exists in `packages/core`.
- Clean `npm pack --dry-run` for `@as-covers/glue` and `@as-covers/transform` omits `lib`, because build output is ignored and not produced by package scripts.
- The README says install `@as-covers/core`, but the usage example imports `@as-covers/glue` directly and references transform/assembly paths.

### Work slice 1.1 — Replace brittle install bootstrap with package-manager workspaces

- **Goal:** `npm install` succeeds without a Lerna bootstrap postinstall.
- **Work:**
  - Add workspace configuration to the root `package.json` for `packages/*`.
  - Remove or replace the root `postinstall` script that runs `lerna bootstrap --hoist`.
  - Keep package linking simple and standard for local development.
  - Re-evaluate whether `lerna.json` is still needed for publishing only, or remove it if it has no remaining job.
- **Done when:**
  - Fresh install succeeds on current Node.
  - `npm test` can start from a clean checkout after install.
  - No package depends on implicit hoisting to resolve runtime imports.

### Work slice 1.2 — Make build outputs explicit and packageable

- **Goal:** published packages contain the files their `main` fields and docs promise.
- **Work:**
  - Ensure `@as-covers/glue` builds `lib/index.js` before packing.
  - Ensure `@as-covers/transform` builds `lib/index.js` and `lib/util.js` before packing.
  - Add package-level `prepack` or root release scripts as appropriate.
  - Run `npm pack --dry-run` inside each package and inspect contents.
- **Done when:**
  - `packages/glue` tarball includes `lib` and type declarations.
  - `packages/transform` tarball includes `lib` and type declarations.
  - Package `files` fields match the actual release shape.

### Work slice 1.3 — Decide and fix the `@as-covers/core` package surface

- **Goal:** `@as-covers/core` either becomes a real convenience package or stops pretending to have a runtime entry.
- **Work:**
  - Choose one direction:
    - Add a tiny `index.js` / `index.d.ts` that re-exports the user-facing glue surface and documents the transform/assembly package paths, or
    - Remove/fix `main` and document `@as-covers/glue`, `@as-covers/transform`, and `@as-covers/assembly` as separate installs.
  - Keep dependencies aligned with the chosen package story.
- **Done when:**
  - `node -e 'import("@as-covers/core")'` works in a packed-package smoke test, or `@as-covers/core` is clearly dependency-only and has no broken `main`.
  - README usage matches the chosen package surface.

### Work slice 1.4 — Add a package smoke test

- **Goal:** release regressions fail in CI/local tests before publish.
- **Work:**
  - Add a small script that packs packages into a temporary directory.
  - Install the tarballs into a throwaway consumer project.
  - Compile the existing test fixture using the packed transform and assembly package.
  - Instantiate the wasm with packed glue.
- **Done when:**
  - The smoke test proves packed artifacts, imports, and docs paths work together.
  - The smoke test is runnable from `npm test` or a clearly named release-check script.

### Work slice 1.5 — Refresh user-facing install docs

- **Goal:** the shortest path from install to useful coverage is accurate.
- **Work:**
  - Update root and package READMEs to match the package surface.
  - Document required AssemblyScript compiler flags, especially runtime/string support if needed by `__getString`.
  - Include a minimal command and a minimal Node loader example that are actually covered by tests.
- **Done when:**
  - A new user can copy/paste the documented flow against the package smoke test.

---

## Epic 2 — Add a coverage semantics fixture matrix

**Goal:** replace the single broad snapshot with a fixture harness that names coverage behavior directly.

**Why:** the current test seam is shallow. One `tests/test.ts` snapshot can pass while important semantics are not actually exercised, such as default parameter instrumentation.

### Work slice 2.1 — Build a reusable fixture harness

- **Goal:** compile and run many tiny AssemblyScript fixtures through the real transform.
- **Work:**
  - Add a fixture directory such as `tests/fixtures/<case-name>/`.
  - Create a JS/TS harness that compiles a selected fixture with `asc`, runs it with `@as-covers/glue`, and compares structured output.
  - Make fixture expected output narrow: point count, covered/uncovered coordinates, and type breakdown.
- **Done when:**
  - Existing broad fixture behavior is represented by at least one fixture case.
  - The harness has one command agents can run locally.

### Work slice 2.2 — Split existing broad coverage test into named fixtures

- **Goal:** each existing coverage concept has a small, named regression seam.
- **Work:**
  - Create fixtures for blocks, if-with-block, if-without-block, arrow functions, normal functions, single-line functions, `&&`, `||`, switch/case, and default properties.
  - Preserve current expected behavior where it is intentional.
  - Mark known broken behavior explicitly in pending/skipped fixtures only if needed to land the harness first.
- **Done when:**
  - A failure points to one coverage concept instead of a character offset in a giant JSON snapshot.

### Work slice 2.3 — Add fixtures for currently weak semantics

- **Goal:** expose transform gaps before refactoring.
- **Work:**
  - Add default-parameter coverage that proves `visitParameter` is reached.
  - Add class method and constructor fixtures.
  - Add ternary fixtures.
  - Add loop body fixtures (`for`, `while`, `do`).
  - Add multi-source fixtures to catch source-local ignore bugs.
  - Add import/export fixtures so package paths are exercised.
- **Done when:**
  - Each fixture either passes or documents a known bug with a link to the work slice that will fix it.

### Work slice 2.4 — Replace brittle snapshot diffing

- **Goal:** assertion failures identify semantic differences directly.
- **Work:**
  - Replace character-by-character JSON comparison in `tests/test.js`.
  - Compare parsed report objects and emit useful diffs.
  - Avoid rewriting snapshots during normal test runs.
- **Done when:**
  - Test failures show fixture name, expected points, actual points, and changed coverage stats.

---

## Epic 3 — Deepen the coverage instrumentation module

**Goal:** concentrate coverage point discovery, ignore handling, point identity, AST mutation, and declaration placement behind one deeper instrumentation implementation.

**Why:** `CoverTransform` is shallow. Every visitor method knows too much: how to calculate line/column, check ignores, create ids, parse declarations, mutate nodes, and push global declarations. Bugs spread across visitor methods.

### Work slice 3.1 — Fix the default parameter visitor bug

- **Goal:** default parameter initializers are instrumented.
- **Observed bug:** `visitParemeter` is misspelled and does not override `visitParameter`.
- **Work:**
  - Rename the method to `visitParameter`.
  - Add/enable a fixture that fails before the fix.
  - Ensure instrumentation preserves the original initializer expression.
- **Done when:**
  - The default-parameter fixture fails before and passes after.
  - TypeScript still compiles under strict settings.

### Work slice 3.2 — Make ignore rules source-local

- **Goal:** `// @as-covers: ignore` affects only the intended line in the intended source.
- **Observed bug:** `ignoredLines` lives on the transform instance and is not cleared per source.
- **Work:**
  - Reset ignore state per source, or model it as a source-local object.
  - Add a multi-source fixture where an ignore line number in one file must not ignore the same line in another file.
  - Clarify whether the ignore applies to the next line, current line, or both; encode that in tests.
- **Done when:**
  - Multi-source ignore fixture passes.
  - Ignore semantics are documented in README or fixture notes.

### Work slice 3.3 — Create a source instrumentation helper

- **Goal:** remove repeated line/col/id/declaration/insertion steps from visitor methods.
- **Work:**
  - Introduce an internal module or class that owns:
    - source path,
    - line/column lookup,
    - ignore checks,
    - point id creation,
    - cover declaration creation,
    - cover expression/statement creation,
    - declaration collection.
  - Keep it internal to the transform implementation until more than one adapter needs it.
- **Done when:**
  - Visitor methods read as coverage semantics, not plumbing.
  - The deletion test shows the helper is deep: deleting it would duplicate complexity across visitors again.

### Work slice 3.4 — Fix arrow/function body instrumentation

- **Goal:** arrow expression bodies, block bodies, methods, and function declarations compile and preserve behavior.
- **Observed bug:** direct `asc` after rebuild failed at `packages/transform/src/index.ts:252` with `Expected function declaration body to be a block or expression`.
- **Work:**
  - Add focused fixtures for arrow expression bodies and block bodies.
  - Inspect AssemblyScript AST node kinds for current compiler version.
  - Convert expression bodies to block bodies in one helper path.
  - Remove dead or incorrect `NodeKind.Export` handling if it is not the right AST signal.
- **Done when:**
  - Arrow expression fixture compiles and reports function coverage.
  - Existing block-body behavior remains covered.

### Work slice 3.5 — Normalize block, branch, and expression insertion

- **Goal:** all constructs use the same cover insertion rules where possible.
- **Work:**
  - Route `BinaryExpression`, `IfStatement`, `TernaryExpression`, `SwitchCase`, and `BlockStatement` through the source instrumentation helper.
  - Preserve short-circuit semantics for `&&` and `||`.
  - Preserve ternary evaluation semantics.
  - Avoid double-instrumenting nodes that were just wrapped.
- **Done when:**
  - Fixture matrix passes for branches and expressions.
  - Instrumented WAT/wasm behavior matches original fixture behavior plus cover calls.

### Work slice 3.6 — Add coverage support for missing constructs

- **Goal:** increase AssemblyScript coverage usefulness with common control-flow constructs.
- **Work:**
  - Add loop body coverage for `for`, `while`, and `do` statements.
  - Add class constructor coverage if not covered by method handling.
  - Consider `try`/`catch` only if supported/needed by the AssemblyScript version.
  - Add fixtures first for every construct.
- **Done when:**
  - Each new construct has a fixture and report expectation.
  - No fixture relies on broad snapshot inference.

---

## Epic 4 — Deepen report generation

**Goal:** make one report model the test surface, with table/JSON/YAML/CSV/future formats as adapters.

**Why:** output modules currently duplicate report shape and statistics. Bugs in one output can silently diverge from the others.

**Observed bugs/signals:**

- `toJSON()` and `toYAML()` emit `types.expression: reportEntry.expressionCoveredFinite` instead of `coveredExpressionPercent`.
- `toCSV()` iterates the `total` report and duplicates every point already emitted for each file.
- Report object typing relies on many `@ts-ignore` comments.

### Work slice 4.1 — Extract and type the coverage report model

- **Goal:** one typed model owns grouping, totals, percentages, and point rows.
- **Work:**
  - Define explicit types for report overview, type percentages, and point entries.
  - Remove duplicated object-building from JSON and YAML paths.
  - Keep `CoverPointReport` internals private or replace it with a clearer model.
- **Done when:**
  - `toJSON()` is a direct adapter over the report model.
  - No `@ts-ignore` is needed for report object construction.

### Work slice 4.2 — Fix JSON/YAML percentage bugs

- **Goal:** report formats agree on block/function/expression percentages.
- **Work:**
  - Change JSON and YAML `types.expression` to emit the expression coverage percent.
  - Confirm zero-expression cases intentionally emit `N/A` or another documented value.
  - Add report-model tests for all-zero and mixed coverage cases.
- **Done when:**
  - JSON/YAML/table all agree on percentages.
  - Snapshot/fixture expectations encode the intended values.

### Work slice 4.3 — Fix CSV duplication and escaping

- **Goal:** CSV is one row per real cover point and is valid for common file names.
- **Work:**
  - Exclude the `total` report from point-row CSV output.
  - Escape commas, quotes, and newlines in file names using a minimal local implementation or the existing CSV dependency if retained.
  - Decide whether CSV should include cover point type.
- **Done when:**
  - CSV output has no duplicated rows.
  - CSV test covers a file path requiring escaping.

### Work slice 4.4 — Reduce report dependencies where practical

- **Goal:** keep reporting simple, lean, and fast.
- **Work:**
  - Re-evaluate `csv-stringify`, `table`, and `yaml` dependencies against project philosophy.
  - Keep dependencies that clearly pay for themselves; replace shallow usage with small local code only when it reduces complexity.
  - Do not add new report dependencies without a strong payoff.
- **Done when:**
  - Dependency choices are intentional and documented in the PR/commit message.

### Work slice 4.5 — Add LCOV output as a feature adapter

- **Goal:** produce a coverage format accepted by common CI/codecov tooling.
- **Work:**
  - Add `toLCOV()` only after the report model is deep enough.
  - Map cover point types to LCOV records in a documented way.
  - Add tests from the report model, not from transform internals.
- **Done when:**
  - LCOV output is generated from the same model as JSON/YAML/table.
  - Docs show how to write LCOV to a file.

### Work slice 4.6 — Add Cobertura or HTML summary as a later feature adapter

- **Goal:** expand output options without changing report core.
- **Work:**
  - Choose Cobertura XML or a small static HTML summary based on user value.
  - Implement it as another adapter over the report model.
  - Avoid coupling it to transform details.
- **Done when:**
  - The new output requires no changes to instrumentation logic.

---

## Epic 5 — Make cover point identity a registry module

**Goal:** concentrate declaration events, execution events, identity collisions, loader registration, reset behavior, and multi-run merge behavior in one registry module.

**Why:** current identity behavior is a shallow `djb2` hash plus `Map<number, CoverPoint>`. It silently ignores declarations with duplicate ids and silently ignores cover events for unknown ids.

### Work slice 5.1 — Extract a cover point registry inside glue

- **Goal:** `Covers` delegates point declaration and execution to a focused registry implementation.
- **Work:**
  - Move `Map<number, CoverPoint>` logic behind an internal registry module.
  - Preserve the current public `Covers` interface.
  - Add direct tests for declaration, execution, duplicate declarations, unknown execution, and reset.
- **Done when:**
  - Registry tests run without compiling wasm.
  - `Covers` remains the public seam for users.

### Work slice 5.2 — Detect and report id collisions

- **Goal:** different cover points with the same id are not silently collapsed.
- **Work:**
  - On duplicate id, compare file/line/column/type.
  - Treat exact duplicate declarations as idempotent.
  - Treat mismatched duplicate declarations as a collision diagnostic.
  - Decide whether collision should throw by default or be recorded in diagnostics.
- **Done when:**
  - Collision behavior is tested and documented.
  - No real duplicate in current fixture suite is misclassified.

### Work slice 5.3 — Improve unknown cover event diagnostics

- **Goal:** executing an undeclared cover point gives useful feedback when desired.
- **Work:**
  - Record unknown `cover(id)` calls instead of always ignoring them.
  - Add an option for strict mode if throwing is too breaking for default behavior.
  - Surface diagnostics in a method or report metadata.
- **Done when:**
  - Tests cover ignored and strict modes.
  - Diagnostics do not break existing default usage unless intentionally chosen.

### Work slice 5.4 — Clarify reset semantics

- **Goal:** users can intentionally clear execution state without corrupting declarations accidentally.
- **Work:**
  - Decide whether `reset()` should clear declarations, execution flags, or both.
  - Consider separate methods such as `resetCoverage()` and `clearDeclarations()` if needed.
  - Preserve backward compatibility or document a breaking change.
- **Done when:**
  - Reset behavior is tested through the registry and through `Covers`.
  - Comments no longer call reset “very very unsafe” without a safer alternative.

### Work slice 5.5 — Support intentional multi-binary/multi-run merging

- **Goal:** coverage across multiple instrumented binaries is predictable.
- **Work:**
  - Define how declarations from multiple loaders merge.
  - Define how execution flags accumulate.
  - Add tests with two fake declaration sets and overlapping ids.
  - Update docs around `registerLoader()` and repeated `_start()` calls.
- **Done when:**
  - Multi-run behavior is explicit in code, tests, and docs.

### Work slice 5.6 — Revisit point id strategy only after registry diagnostics exist

- **Goal:** improve identity quality without premature churn.
- **Work:**
  - Measure whether 32-bit `djb2` is sufficient for expected project sizes.
  - Consider a wider id or a two-part id if AssemblyScript imports can support it cleanly.
  - Keep transform/glue/assembly compatibility in mind.
- **Done when:**
  - Any id format change is justified by diagnostics or concrete collision risk.
  - Migration/backward compatibility is documented.

---

## Cross-epic guardrails for agents

- Keep public interfaces small and documented.
- Prefer a deep module over repeated shallow helpers.
- Add or update tests at the seam users/agents can exercise.
- Keep dependencies low; avoid new packages unless they clearly reduce complexity.
- Commit each completed work slice atomically with a descriptive message.
- Keep README examples executable through a test or smoke check.
