// This is the standard test for AS-Covers.
// If it fails, something was changed that broke it.
// To add new checks, just copy-and-paste coverReport.json to coverReportSnapshot.json.
import loader from "@assemblyscript/loader";
import fs from "fs";
import { Covers } from "../packages/glue/lib/index.js";
const covers = new Covers();
import Linecol from "line-column";

const coverReportSnapshotLocation = "./tests/output/coverReportSnapshot.json";

console.log("-- Instantiating module. --");
const wasmModule = loader.instantiateSync(
  fs.readFileSync("./tests/output/output.wasm"),
  covers.installImports({})
);
console.log("-- Registering loader. --");
covers.registerLoader(wasmModule);

console.log("-- Starting module execution --");
wasmModule.exports._start();

const JSONreport = JSON.stringify(covers.toJSON(), null, 2)

if (process.argv.includes("--create")) {

  console.log("-- Creating Snapshot. --");
  fs.writeFileSync(coverReportSnapshotLocation, JSONreport);
  process.exit(0);
}

const resultSnapShot = fs.readFileSync(coverReportSnapshotLocation).toString()

const linecol = Linecol(resultSnapShot)

for (let i = 0; i < resultSnapShot.length; i++) {

  if (JSONreport[i] !== resultSnapShot[i]) {
    const lc = linecol.fromIndex(i+1)
    throw new Error(`Result Failed at ${coverReportSnapshotLocation}:${lc.line}:${lc.col}`)
  }

}

if (resultSnapShot === JSONreport) {
    console.log('Test Result: Passed.')
} else {
  console.log('Test Result: Failed.')
}

fs.writeFileSync(
  coverReportSnapshotLocation,
  JSONreport
);

const output = covers.stringify();
process.stdout.write(output);
