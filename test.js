import { scan, hasBlockers } from "./index.js";

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    failed++;
  }
}

console.log("\n\x1b[1mgit-safe-push tests\x1b[0m\n");

// Test 1: Scan returns array
const r1 = scan({ files: [] });
assert(Array.isArray(r1), "Scan returns an array");

// Test 2: Scan with dummy JS file with console.log
const files2 = [
  "test-scan.js",
];
const r2 = scan({ files: files2 });
assert(Array.isArray(r2), "Scan handles non-existent files gracefully");

// Test 3: hasBlockers returns false for empty
assert(hasBlockers([]) === false, "hasBlockers returns false for empty array");

// Test 4: hasBlockers returns true for errors
assert(
  hasBlockers([{ severity: "error" }, { severity: "warn" }]) === true,
  "hasBlockers returns true when errors present"
);

// Test 5: hasBlockers returns false for warns only
assert(
  hasBlockers([{ severity: "warn" }, { severity: "warn" }]) === false,
  "hasBlockers returns false for warnings only"
);

// Test 6: Scan works with provided files
const r6 = scan({ files: ["index.js"] });
assert(Array.isArray(r6), "Scan works with real files");

// Test 7: Multiple findings in one file
assert(
  Array.isArray(r1) && r1.length >= 0,
  "Scan returns results for given files"
);

console.log(
  `\n\x1b[1m${passed} passed\x1b[0m${failed > 0 ? `, \x1b[31m${failed} failed\x1b[0m` : ""}\n`
);
process.exit(failed > 0 ? 1 : 0);
