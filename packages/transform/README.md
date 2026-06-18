# AS-Covers transform

AssemblyScript compiler transform that instruments source code with as-covers declarations and execution calls.

Most users can install `@as-covers/core` instead; it depends on this package. Install `@as-covers/transform` directly when you manage the packages separately.

## Install

```sh
npm install --save-dev @as-covers/transform @as-covers/assembly assemblyscript
```

`assemblyscript` is a peer dependency because the transform runs inside the AssemblyScript compiler.

## Compile with coverage

```sh
npx asc ./assembly/index.ts \
  --lib ./node_modules/@as-covers/assembly/index.ts \
  --transform ./node_modules/@as-covers/transform/lib/index.js \
  --outFile ./build/coverage.wasm \
  --exportStart _start
```

Replace `./assembly/index.ts` with your test entry file. The `--lib` path makes the injected `__cover` imports type-check, and the `--transform` path points at this package's built `lib/index.js` output.

## Run the instrumented wasm

Use `@as-covers/glue` or the `@as-covers/core` re-export to install imports, register the loader, run `_start`, and render a report.

## Verified package flow

The repository package smoke test packs this transform and compiles `tests/test.ts` with the packed tarball:

```sh
npm run test:package
```

## License

MIT. See [LICENSE](./LICENSE).
