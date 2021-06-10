const asc = require("assemblyscript/cli/asc");
const glue = require("./packages/glue/lib");
const path = require("path");

// "asbuild:untouched":
// "node bin/asc --config src/asconfig.json --target untouched",
let binary;

asc.main([
  "--config", "./submodules/assemblyscript/src/asconfig.json",
  "--target", "untouched",
], {
  stdout: process.stdout,
  stderr: process.stderr,
}, (err) => {
  if (err) console.log(err);
});
