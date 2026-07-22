#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".json",
  ".sql",
  ".html",
];
const SCRIPT_EXTENSIONS = new Set(SOURCE_EXTENSIONS.slice(0, 8));
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  ".turbo",
  "node_modules",
  "coverage",
  "dist",
  "build",
]);
const NEXT_ROOT_NAMES = new Set([
  "page",
  "layout",
  "route",
  "error",
  "global-error",
  "not-found",
  "loading",
  "default",
  "template",
]);

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage: node dependency-audit.mjs [options]

Options:
  --scan <dir>       Directory to inventory; repeatable (required)
  --entry <file>     Additional runtime entrypoint; repeatable
  --support <file>   Additional test/script/check entrypoint; repeatable
  --tsconfig <file>  TypeScript config providing path aliases; repeatable
  --exclude <path>   Path prefix to exclude; repeatable
  --format <type>    markdown (default), json, or summary
  --help             Show this help

The report is a reachability candidate list, not a deletion verdict.`);
  process.exit(message ? 1 : 0);
}

function parseArgs(argv) {
  const options = {
    scans: [],
    entries: [],
    support: [],
    tsconfigs: [],
    excludes: [],
    format: "markdown",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help") usage();
    if (["--scan", "--entry", "--support", "--tsconfig", "--exclude", "--format"].includes(arg)) {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) usage(`${arg} requires a value`);
      i += 1;
      if (arg === "--scan") options.scans.push(value);
      else if (arg === "--entry") options.entries.push(value);
      else if (arg === "--support") options.support.push(value);
      else if (arg === "--tsconfig") options.tsconfigs.push(value);
      else if (arg === "--exclude") options.excludes.push(value);
      else options.format = value;
      continue;
    }
    usage(`unknown option ${arg}`);
  }
  if (options.scans.length === 0) usage("at least one --scan directory is required");
  if (!new Set(["markdown", "json", "summary"]).has(options.format)) {
    usage("--format must be markdown, json, or summary");
  }
  return options;
}

const cwd = process.cwd();
const options = parseArgs(process.argv.slice(2));

function absolute(input) {
  return path.resolve(cwd, input);
}

function relative(input) {
  return path.relative(cwd, input).split(path.sep).join("/") || ".";
}

const excluded = options.excludes.map(absolute);

function isExcluded(candidate) {
  return excluded.some((prefix) => candidate === prefix || candidate.startsWith(`${prefix}${path.sep}`));
}

function walk(directory, accept) {
  const found = [];
  if (!fs.existsSync(directory)) return found;
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => b.name.localeCompare(a.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (isExcluded(full)) continue;
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) stack.push(full);
      } else if (entry.isFile() && accept(full)) {
        found.push(full);
      }
    }
  }
  return found.sort();
}

const scanRoots = options.scans.map(absolute);
for (const root of scanRoots) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) usage(`scan directory not found: ${relative(root)}`);
}

const files = scanRoots.flatMap((root) =>
  walk(root, (file) => SOURCE_EXTENSIONS.includes(path.extname(file).toLowerCase())),
);
let gitVisible = null;
try {
  gitVisible = new Set(
    execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\0")
      .filter(Boolean)
      .map(absolute),
  );
} catch {
  // Non-Git repositories fall back to the filesystem walk.
}
const uniqueFiles = [...new Set(files)]
  .filter((file) => gitVisible === null || gitVisible.has(file))
  .sort();
const fileSet = new Set(uniqueFiles);

function stripJsonComments(source) {
  let result = "";
  let inString = false;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (lineComment) {
      if (char === "\n") {
        lineComment = false;
        result += char;
      }
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        i += 1;
      } else if (char === "\n") {
        result += char;
      }
      continue;
    }
    if (inString) {
      result += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      result += char;
    } else if (char === "/" && next === "/") {
      lineComment = true;
      i += 1;
    } else if (char === "/" && next === "*") {
      blockComment = true;
      i += 1;
    } else {
      result += char;
    }
  }
  return result;
}

function readAliasRules(configPath) {
  const full = absolute(configPath);
  if (!fs.existsSync(full)) usage(`tsconfig not found: ${relative(full)}`);
  let parsed;
  try {
    parsed = JSON.parse(stripJsonComments(fs.readFileSync(full, "utf8")));
  } catch (error) {
    usage(`cannot parse ${relative(full)}: ${error.message}`);
  }
  const compiler = parsed.compilerOptions ?? {};
  const base = path.resolve(path.dirname(full), compiler.baseUrl ?? ".");
  const rules = [];
  for (const [pattern, targets] of Object.entries(compiler.paths ?? {})) {
    const star = pattern.indexOf("*");
    const prefix = star === -1 ? pattern : pattern.slice(0, star);
    const suffix = star === -1 ? "" : pattern.slice(star + 1);
    for (const target of Array.isArray(targets) ? targets : []) {
      rules.push({ pattern, prefix, suffix, target, base });
    }
  }
  return rules;
}

const aliasRules = options.tsconfigs.flatMap(readAliasRules);

function extractSpecifiers(file, source) {
  const extension = path.extname(file).toLowerCase();
  const specs = new Set();
  const patterns = [];
  if (SCRIPT_EXTENSIONS.has(extension)) {
    patterns.push(
      /(?:import|export)\s+(?:type\s+)?(?:[^"'`;]*?\s+from\s*)?["']([^"']+)["']/g,
      /import\s*\(\s*["']([^"']+)["']\s*\)/g,
      /require\s*\(\s*["']([^"']+)["']\s*\)/g,
      /new\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
    );
  } else if ([".css", ".scss", ".sass", ".less"].includes(extension)) {
    patterns.push(/@import\s+(?:url\()?\s*["']([^"']+)["']/g);
  } else if (extension === ".html") {
    patterns.push(/<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+)["']/gi);
  }
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.add(match[1]);
  }
  return [...specs];
}

function aliasBases(specifier) {
  const bases = [];
  for (const rule of aliasRules) {
    if (!specifier.startsWith(rule.prefix) || !specifier.endsWith(rule.suffix)) continue;
    const matched = specifier.slice(rule.prefix.length, specifier.length - rule.suffix.length || undefined);
    const target = rule.target.includes("*") ? rule.target.replace("*", matched) : rule.target;
    bases.push(path.resolve(rule.base, target));
  }
  return bases;
}

function resolveBase(base) {
  const clean = base.split(/[?#]/, 1)[0];
  const parsedExtension = path.extname(clean).toLowerCase();
  const extension = SOURCE_EXTENSIONS.includes(parsedExtension) ? parsedExtension : "";
  const candidates = [clean];
  if (extension) {
    const stem = clean.slice(0, -extension.length);
    for (const ext of SOURCE_EXTENSIONS) candidates.push(`${stem}${ext}`);
  } else {
    for (const ext of SOURCE_EXTENSIONS) candidates.push(`${clean}${ext}`);
  }
  for (const ext of SOURCE_EXTENSIONS) candidates.push(path.join(clean, `index${ext}`));
  return candidates.find((candidate) => fileSet.has(path.normalize(candidate)));
}

function resolveSpecifier(importer, specifier) {
  if (/^(?:https?:|data:|node:)/.test(specifier)) return { external: true };
  let bases = [];
  const importerExtension = path.extname(importer).toLowerCase();
  const htmlRelative = importerExtension === ".html";
  const styleRelative = [".css", ".scss", ".sass", ".less"].includes(importerExtension)
    && Boolean(resolveBase(path.resolve(path.dirname(importer), specifier)));
  const documentRelative = htmlRelative || styleRelative;
  if (specifier.startsWith(".") || (documentRelative && !specifier.startsWith("/") && !specifier.startsWith("#"))) {
    bases = [path.resolve(path.dirname(importer), specifier)];
  }
  else bases = aliasBases(specifier);
  for (const base of bases) {
    const resolved = resolveBase(base);
    if (resolved) return { resolved };
  }
  return { internalUnresolved: specifier.startsWith(".") || documentRelative || bases.length > 0 };
}

const graph = new Map(uniqueFiles.map((file) => [file, new Set()]));
const inbound = new Map(uniqueFiles.map((file) => [file, new Set()]));
const unresolved = new Map(uniqueFiles.map((file) => [file, []]));
const lineCounts = new Map();

for (const file of uniqueFiles) {
  const source = fs.readFileSync(file, "utf8");
  lineCounts.set(file, source === "" ? 0 : source.split(/\r?\n/).length);
  for (const specifier of extractSpecifiers(file, source)) {
    const result = resolveSpecifier(file, specifier);
    if (result.resolved) {
      graph.get(file).add(result.resolved);
      inbound.get(result.resolved).add(file);
    } else if (result.internalUnresolved) {
      unresolved.get(file).push(specifier);
    }
  }
}

const rootReasons = new Map(uniqueFiles.map((file) => [file, []]));
const runtimeRoots = new Set();
const supportRoots = new Set();
const artifactRoots = new Set();

function addRoot(file, kind, reason) {
  const full = absolute(file);
  if (!fileSet.has(full)) return;
  const roots = kind === "runtime" ? runtimeRoots : kind === "support" ? supportRoots : artifactRoots;
  roots.add(full);
  rootReasons.get(full).push(reason);
}

for (const entry of options.entries) addRoot(entry, "runtime", "explicit entry");
for (const entry of options.support) addRoot(entry, "support", "explicit support entry");

for (const file of uniqueFiles) {
  const rel = relative(file);
  const parsed = path.parse(file);
  const segments = rel.split("/");
  const inNextApp = segments.includes("app") && NEXT_ROOT_NAMES.has(parsed.name);
  if (inNextApp || ["middleware", "instrumentation"].includes(parsed.name)) {
    addRoot(file, "runtime", "framework convention");
  }
  if (parsed.ext === ".html") addRoot(file, "runtime", "HTML entrypoint");
  if (parsed.ext === ".sql") addRoot(file, "artifact", "standalone SQL artifact");
  if (
    segments.includes("tests") ||
    segments.includes("scripts") ||
    segments.includes("__checks__") ||
    /(?:^|[-_.])(test|spec|check)(?:[-_.]|$)/i.test(parsed.name)
  ) {
    addRoot(file, "support", "test/script/check convention");
  }
}

const packageFiles = walk(cwd, (file) => path.basename(file) === "package.json");
for (const packageFile of packageFiles) {
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  } catch {
    continue;
  }
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    if (typeof command !== "string") continue;
    const support = /(?:test|check|verify|lint)/i.test(name);
    const matches = command.matchAll(/(?:^|\s)([^\s"']+\.(?:[cm]?[jt]sx?|html))(?:\s|$)/g);
    for (const match of matches) {
      addRoot(path.resolve(path.dirname(packageFile), match[1]), support ? "support" : "runtime", `package script: ${name}`);
    }
  }
}

function traverse(roots) {
  const visited = new Set();
  const postOrder = [];
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    for (const dependency of [...(graph.get(file) ?? [])].sort()) visit(dependency);
    postOrder.push(file);
  }
  for (const root of [...roots].sort()) visit(root);
  return { visited, postOrder };
}

const runtimeTraversal = traverse(runtimeRoots);
const supportTraversal = traverse(supportRoots);
const runtimeReachable = runtimeTraversal.visited;
const supportReachable = supportTraversal.visited;
const runtimeOrder = new Map(runtimeTraversal.postOrder.map((file, index) => [file, index + 1]));
const supportOrder = new Map(supportTraversal.postOrder.map((file, index) => [file, index + 1]));

function disposition(file) {
  if (runtimeReachable.has(file)) return "runtime-reachable";
  if (supportReachable.has(file)) return "support-only";
  if (artifactRoots.has(file)) return "standalone-artifact";
  return "unreachable-candidate";
}

const records = uniqueFiles.map((file) => ({
  file: relative(file),
  disposition: disposition(file),
  lines: lineCounts.get(file),
  inbound: inbound.get(file).size,
  outbound: graph.get(file).size,
  depthFirstPostOrder: runtimeOrder.get(file) ?? supportOrder.get(file) ?? null,
  roots: rootReasons.get(file),
  unresolvedInternal: unresolved.get(file),
}));

const counts = Object.fromEntries(
  ["runtime-reachable", "support-only", "standalone-artifact", "unreachable-candidate"].map((status) => [
    status,
    records.filter((record) => record.disposition === status).length,
  ]),
);
const report = {
  generatedAt: new Date().toISOString(),
  cwd,
  scans: scanRoots.map(relative),
  gitFiltered: gitVisible !== null,
  counts,
  unresolvedEdgeCount: records.reduce((sum, record) => sum + record.unresolvedInternal.length, 0),
  files: records,
};

if (options.format === "json") {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

if (options.format === "summary") {
  console.log(JSON.stringify({
    generatedAt: report.generatedAt,
    scans: report.scans,
    gitFiltered: report.gitFiltered,
    counts: report.counts,
    unresolvedEdgeCount: report.unresolvedEdgeCount,
    unreachableCandidates: report.files
      .filter((record) => record.disposition === "unreachable-candidate")
      .map((record) => record.file),
    unresolvedInternalImports: report.files
      .filter((record) => record.unresolvedInternal.length > 0)
      .map((record) => ({ file: record.file, specifiers: record.unresolvedInternal })),
  }, null, 2));
  process.exit(0);
}

console.log("# Dependency reachability audit\n");
console.log(`Scanned ${records.length} files from ${report.scans.map((scan) => `\`${scan}\``).join(", ")}.`);
console.log("Reachability is candidate evidence, not a deletion verdict.\n");
console.log("| Disposition | Files |");
console.log("| --- | ---: |");
for (const [status, count] of Object.entries(counts)) console.log(`| ${status} | ${count} |`);
console.log(`\nUnresolved internal import edges: ${report.unresolvedEdgeCount}.\n`);
console.log("## File inventory\n");
console.log("| File | Initial disposition | DFS post-order | Lines | In | Out | Root reason | Unresolved internal imports |");
console.log("| --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
for (const record of records) {
  console.log(
    `| \`${record.file}\` | ${record.disposition} | ${record.depthFirstPostOrder ?? ""} | ${record.lines} | ${record.inbound} | ${record.outbound} | ${record.roots.join("; ")} | ${record.unresolvedInternal.map((item) => `\`${item}\``).join(", ")} |`,
  );
}
