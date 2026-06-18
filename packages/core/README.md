# AS-Covers core

Convenience package for AssemblyScript coverage. It installs the helper declarations, transform, and Node.js glue packages, and re-exports the glue API from `@as-covers/glue`.

## Install

```sh
npm install --save-dev @as-covers/core assemblyscript @assemblyscript/loader
```

## Compile with coverage

```sh
npx asc ./assembly/index.ts \
  --lib ./node_modules/@as-covers/assembly/index.ts \
  --transform ./node_modules/@as-covers/transform/lib/index.js \
  --outFile ./build/coverage.wasm \
  --exportStart _start
```

Replace `./assembly/index.ts` with your test entry file. The `--lib` path comes from `@as-covers/assembly`; the transform path comes from `@as-covers/transform`.

`Covers` reads declared source-file strings through the `@assemblyscript/loader` string helpers, so instantiate with `@assemblyscript/loader` or provide equivalent `exports.__getString` support in a custom loader.

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

This repository verifies the packed-package flow with:

```sh
npm run test:package
```

## License

MIT. See [LICENSE](./LICENSE).
