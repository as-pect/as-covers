# AS-Covers (glue)
**AssemblyScript code coverage glue**

## Installation

```bash
~ npm install @as-covers/glue
```

### AS-Covers

Code coverage for AssemblyScript projects that uses a few simple packages to make visualizing how well your code branches are covered.

# Usage

First install from npm.

```sh
npm install @as-covers/core
```

Next, add the following transform and entry point to your AssemblyScript compilation.

```sh
# uses multiple lines for clarity
asc node_modules/@as-covers/assembly/index.ts
  --transform @as-covers/transform/lib/index.js
  --explicitStart
```

These will inject some immutable cover points into your web assembly binary.

The next step is to instantiate the module:

```ts
import { Covers } from "@as-covers/glue";
import * as fs from "fs";
import { instantiate } from "@assemblyscript/loader";

// import your web assembly binary
const binary = fs.readFileSync("build/untouched.wasm");
const covers = new Covers();
// Install your imports here
const imports = covers.installImports({});

(async function() {
  const loader = await instantiate(binary, imports);
  covers.registerLoader(loader);
  loader.exports._start();
  process.stdout.write(covers.stringify());
}());

```

Covers is designed to work over multiple binary compilations with the transform applied. Each cover point is immutably hashed so that you can test code coverage with different test files.

Just remember to register the loader each time before calling the `_start()` method.

# License

```
MIT License

Copyright (c) 2021 Joshua Tenner <tenner.joshua@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
