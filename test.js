const asc = require("assemblyscript/cli/asc");
const glue = require("./packages/glue/lib");
const path = require("path");

// "asbuild:untouched":
// "node bin/asc --config src/asconfig.json --target untouched",
let binary;

asc.main([
  "--lib", "./packages/assembly/index.ts",
  "--config", "./submodules/assemblyscript/src/asconfig.json",
  "--target", "untouched",
  "--transform", require.resolve("./packages/transform/lib/index.js")
], {
  stdout: process.stdout,
  stderr: process.stderr,
  writeFile(filename, contents) {
    if (path.extname(filename) === ".wasm") {
      binary = contents;
    }
  }
}, (...args) => {
  console.log(...args);
});
