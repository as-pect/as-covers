const fs = require('fs')

const loader = require('@assemblyscript/loader')

const { Covers } = require('./packages/glue')

const cover = new Covers({
    files: ['myTest.ts']
})

const imports = {}

const wasmModule = loader.instantiateSync(fs.readFileSync('./output.wasm'), cover.installImports(imports))

cover.registerLoader(wasmModule)

wasmModule.exports._start()

const JSONreport = cover.toJSON()

const CSVreport = cover.toCSV()

const YAMLreport = cover.toYAML()

const TextReport = cover.stringify()

console.log(TextReport)

fs.writeFileSync('./CSVreport.csv', CSVreport)
fs.writeFileSync('./YAMLreport.yaml', YAMLreport)
fs.writeFileSync('./JSONreport.json', JSON.stringify(JSONreport, null, 2))