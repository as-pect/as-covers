const loader = require("@assemblyscript/loader");
const fs = require("fs");
const { Covers } = require("./packages/glue/lib/index");
const c = new Covers();

loader
  .instantiate(fs.readFileSync("./output.wasm"), c.installImports({}))
  .then((e) => {
    c.registerLoader(e);
    e.exports._start();
    e.exports.test1();
    e.exports.test2();
    const output = c.stringify();
    process.stdout.write(output);
  });
