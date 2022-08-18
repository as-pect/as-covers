// This is the standard test for AS-Covers.
// If it fails, something was changed that broke it.
// To add new checks, just copy-and-paste coverReport.json to coverReportSnapshot.json.
import loader from "@assemblyscript/loader";
import fs from "fs";
import { Covers } from "../packages/glue/lib/index.js";
const covers = new Covers();
import Linecol from "line-column";
console.log("-- Instantiating module. --");
const wasmModule = loader.instantiateSync(
  fs.readFileSync("./tests/output/output.wasm"),
  covers.installImports({})
);
console.log("-- Registering loader. --");
covers.registerLoader(wasmModule);

//wasmModule.exports.run_tests();

const JSONreport = JSON.stringify(covers.toJSON(), null, 2)

if (process.argv.includes("--create")) {
  fs.writeFileSync("./tests/output/coverReportSnapshot.json", JSONreport);
  process.exit(0);
}

const resultSnapShot = fs.readFileSync('./tests/output/coverReportSnapshot.json').toString()

const linecol = Linecol(resultSnapShot)

for (let i = 0; i < resultSnapShot.length; i++) {

  if (JSONreport[i] !== resultSnapShot[i]) {
    const lc = linecol.fromIndex(i+1)
    throw new Error(`Result Failed at ./output/coverReport.json:${lc.line}:${lc.col}`)
  }

}

if (resultSnapShot === JSONreport) {
    console.log('Test Result: Passed.')
} else {
  console.log('Test Result: Failed.')
}

fs.writeFileSync(
  "./tests/output/coverReport.json",
  JSONreport
);

const output = covers.stringify();
process.stdout.write(output);
