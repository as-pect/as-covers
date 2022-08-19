import * as __import0 from "./__asCovers.js";
async function instantiate(module, imports = {}) {
  const __module0 = imports["./__asCovers.js"];
  const adaptedImports = {
    "./__asCovers.js": Object.assign(Object.create(__module0), {
      coverDeclare(file, id, line, col, coverType) {
        // ~lib/index/__coverDeclare(~lib/string/String, u32, i32, i32, i32) => void
        file = __liftString(file >>> 0);
        id = id >>> 0;
        __module0.coverDeclare(file, id, line, col, coverType);
      },
      cover(id) {
        // ~lib/index/__cover(u32) => void
        id = id >>> 0;
        __module0.cover(id);
      },
    }),
    env: Object.assign(Object.create(globalThis), imports.env || {}, {
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  return exports;
}
export const {
  memory,
  run_tests
} = await (async url => instantiate(
  await (async () => {
    try { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
    catch { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
  })(), {
    "./__asCovers.js": __maybeDefault(__import0),
  }
))(new URL("output.wasm", import.meta.url));
function __maybeDefault(module) {
  return typeof module.default === "object" && Object.keys(module).length == 1
    ? module.default
    : module;
}
