# AS-Covers

Code coverage for AssemblyScript projects using a compiler transform, a tiny AssemblyScript helper module, and Node.js report glue.

## Install

For the standard setup, install the convenience package plus the AssemblyScript tools used by your test runner:

```sh
npm install --save-dev @as-covers/core assemblyscript @assemblyscript/loader
```

`@as-covers/core` depends on `@as-covers/assembly`, `@as-covers/transform`, and `@as-covers/glue`, and re-exports the glue API.

## Compile with coverage

Add your normal AssemblyScript entry file, the as-covers helper declarations, and the transform to the `asc` command:

```sh
npx asc ./assembly/index.ts \
  --lib ./node_modules/@as-covers/assembly/index.ts \
  --transform ./node_modules/@as-covers/transform/lib/index.js \
  --outFile ./build/coverage.wasm \
  --exportStart _start
```

Replace `./assembly/index.ts` with your test entry file. The `--lib` path makes the injected `__cover` imports type-check, and the `--transform` path points at the packaged transform output.

`Covers` reads declared source-file strings through the `@assemblyscript/loader` string helpers, so instantiate the instrumented wasm with `@assemblyscript/loader` or provide equivalent `exports.__getString` support in a custom loader.

To skip instrumentation for an intentional line, place `// @as-covers: ignore` on the line immediately before it.
The ignore applies only to the next line in that same source file.

## Run and report

```ts
import fs from "node:fs";
import loader from "@assemblyscript/loader";
import { Covers } from "@as-covers/core";

const covers = new Covers();
const wasmModule = loader.instantiateSync(
  fs.readFileSync("./build/coverage.wasm"),
  covers.installImports({})
);

covers.registerLoader(wasmModule);
wasmModule.exports._start();

process.stdout.write(covers.stringify());
```

The repository package smoke test packs the packages, installs them into a throwaway consumer, compiles `tests/test.ts` with these package paths, and runs this loader flow:

```sh
npm run test:package
```

## License

MIT. See [LICENSE](./LICENSE).
