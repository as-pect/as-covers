# AS-Covers assembly

AssemblyScript helper declarations used by the as-covers transform. The transform injects calls to `__coverDeclare` and `__cover`; this package supplies the declarations that make those calls type-check during `asc` compilation.

Most users can install `@as-covers/core` instead; it depends on this package. Install `@as-covers/assembly` directly when you manage the packages separately.

## Install

```sh
npm install --save-dev @as-covers/assembly @as-covers/transform assemblyscript
```

## Compile with coverage

```sh
npx asc ./assembly/index.ts \
  --lib ./node_modules/@as-covers/assembly/index.ts \
  --transform ./node_modules/@as-covers/transform/lib/index.js \
  --outFile ./build/coverage.wasm \
  --exportStart _start
```

Replace `./assembly/index.ts` with your test entry file. The `--lib` path is the important part from this package.

## Run the instrumented wasm

Use `@as-covers/glue` or the `@as-covers/core` re-export with `@assemblyscript/loader` so coverage declarations can read source-file strings through loader string helpers.

## Verified package flow

The repository package smoke test packs this package and compiles `tests/test.ts` against the packed tarball:

```sh
npm run test:package
```

## License

MIT. See [LICENSE](./LICENSE).
