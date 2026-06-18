import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smokeRoot = path.join(repoRoot, "tests", "output", "package-smoke");
const tarballDir = path.join(smokeRoot, "tarballs");
const consumerDir = path.join(smokeRoot, "consumer");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const node = process.execPath;
const asc = path.join(
  consumerDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "asc.cmd" : "asc"
);

function run(command, args, cwd) {
  console.log(`-- ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function capture(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

function packWorkspace(workspace) {
  const output = capture(
    npm,
    ["pack", "--silent", "--pack-destination", tarballDir, "--workspace", workspace],
    repoRoot
  );
  const lines = output.trim().split(/\r?\n/).filter(Boolean);
  const filename = lines[lines.length - 1];
  if (!filename) throw new Error(`npm pack did not produce a tarball for ${workspace}`);
  return path.join(tarballDir, filename);
}

fs.rmSync(smokeRoot, { recursive: true, force: true });
fs.mkdirSync(tarballDir, { recursive: true });
fs.mkdirSync(consumerDir, { recursive: true });

const tarballs = [
  "@as-covers/assembly",
  "@as-covers/glue",
  "@as-covers/transform",
  "@as-covers/core",
].map(packWorkspace);

fs.writeFileSync(
  path.join(consumerDir, "package.json"),
  `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`
);
fs.copyFileSync(path.join(repoRoot, "tests", "test.ts"), path.join(consumerDir, "test.ts"));

run(
  npm,
  [
    "install",
    "--silent",
    "--no-audit",
    "--no-fund",
    "--no-package-lock",
    ...tarballs,
    "assemblyscript@^0.25.0",
    "@assemblyscript/loader@^0.25.0",
  ],
  consumerDir
);

run(
  asc,
  [
    "./test.ts",
    "--lib",
    "./node_modules/@as-covers/assembly/index.ts",
    "--transform",
    "./node_modules/@as-covers/transform/lib/index.js",
    "--textFile",
    "./output.wat",
    "--outFile",
    "./output.wasm",
    "--exportStart",
    "_start",
  ],
  consumerDir
);

fs.writeFileSync(
  path.join(consumerDir, "run-smoke.mjs"),
  `import loader from "@assemblyscript/loader";\n` +
    `import fs from "node:fs";\n` +
    `import { Covers as CoreCovers } from "@as-covers/core";\n` +
    `import { Covers as GlueCovers } from "@as-covers/glue";\n\n` +
    `if (CoreCovers !== GlueCovers) {\n` +
    `  throw new Error("@as-covers/core does not re-export @as-covers/glue Covers");\n` +
    `}\n\n` +
    `const covers = new CoreCovers();\n` +
    `const wasmModule = loader.instantiateSync(\n` +
    `  fs.readFileSync("./output.wasm"),\n` +
    `  covers.installImports({})\n` +
    `);\n` +
    `covers.registerLoader(wasmModule);\n` +
    `wasmModule.exports._start();\n\n` +
    `const report = covers.toJSON();\n` +
    `const entries = Object.values(report);\n` +
    `if (entries.length !== 1) {\n` +
    `  throw new Error(\`Expected one source file in report, got \${entries.length}: \${JSON.stringify(report)}\`);\n` +
    `}\n` +
    `const [entry] = entries;\n` +
    `if (!entry.overview || entry.overview.covered <= 0 || entry.overview.uncovered <= 0) {\n` +
    `  throw new Error(\`Expected covered and uncovered points in report: \${JSON.stringify(report)}\`);\n` +
    `}\n` +
    `console.log("Package smoke test passed.");\n`
);

run(node, ["run-smoke.mjs"], consumerDir);
