const asc = require("assemblyscript/cli/asc");

asc.main([], {
  stdout: output.stdout,
  stderr: output.stderr,
  readFile: name => Object.prototype.hasOwnProperty.call(sources, name) ? sources[name] : null,
  writeFile: (name, contents) => { output[name] = contents; },
  listFiles: () => []
}, (...args) => {
  console.log(...args);
});