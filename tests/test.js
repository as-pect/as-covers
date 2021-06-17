const loader = require("@assemblyscript/loader");
const fs = require("fs");
const { Covers } = require("../packages/glue/lib/index");
const covers = new Covers();

const wasmModule = loader.instantiateSync(
  fs.readFileSync("./output/output.wasm"),
  covers.installImports({})
);
covers.registerLoader(wasmModule);

wasmModule.exports._start();

const JSONreport = JSON.stringify(covers.toJSON(), null, 2)

const resultSnapShot = fs.readFileSync('./output/coverReportSnapshot.json').toString()

if (resultSnapShot === JSONreport) {
    console.log('All Tests Passed!')
}

fs.writeFileSync(
  "./output/coverReport.json",
  JSONreport
);

const output = covers.stringify();
process.stdout.write(output);
