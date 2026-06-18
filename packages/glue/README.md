# AS-Covers glue

Node.js runtime glue for collecting coverage points from an instrumented AssemblyScript wasm module and rendering reports.

Most users can install `@as-covers/core` instead; it depends on this package and re-exports `Covers`. Install `@as-covers/glue` directly when you manage the assembly helper and transform packages yourself.

## Install

```sh
npm install --save-dev @as-covers/glue @assemblyscript/loader
```

If you install this package directly, also compile with `@as-covers/assembly` and `@as-covers/transform`:

```sh
npm install --save-dev @as-covers/assembly @as-covers/transform assemblyscript
```

## Run and report

```ts
import fs from "node:fs";
import loader from "@assemblyscript/loader";
import { Covers } from "@as-covers/glue";

const covers = new Covers();
const wasmModule = loader.instantiateSync(
  fs.readFileSync("./build/coverage.wasm"),
  covers.installImports({})
);

covers.registerLoader(wasmModule);
wasmModule.exports._start();

process.stdout.write(covers.stringify());
```

`Covers` reads declared source-file strings through the `@assemblyscript/loader` string helpers, so instantiate with `@assemblyscript/loader` or provide equivalent `exports.__getString` support in a custom loader.

## Verified package flow

The repository package smoke test packs this package, installs it into a throwaway consumer, compiles `tests/test.ts`, and loads the resulting wasm:

```sh
npm run test:package
```

## License

MIT. See [LICENSE](./LICENSE).
