#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { scan, hasBlockers } from "./index.js";

const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const cyan = "\x1b[36m";
const dim = "\x1b[2m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

function hookContent(type) {
  return `#!/bin/sh
# git-safe-push ${type} hook
npx git-safe-push
if [ $? -ne 0 ]; then
  echo "${red}[git-safe-push] ${type} blocked for safety${reset}"
  exit 1
fi
exit 0
`;
}

const args = process.argv.slice(2);
const allow = args.includes("--allow");

if (args[0] === "install") {
  const gitDir = execSync("git rev-parse --git-dir", { encoding: "utf-8" }).trim();
  const hooksDir = path.join(gitDir, "hooks");

  for (const type of ["pre-push", "pre-commit"]) {
    const hookPath = path.join(hooksDir, type);
    fs.writeFileSync(hookPath, hookContent(type));
    fs.chmodSync(hookPath, 0o755);
    console.log(`  ${green}✅ ${type} hook installed${reset}`);
  }
  console.log();
  process.exit(0);
}

if (allow) {
  console.log(`  ${yellow}⚠ --allow flag set, bypassing scan${reset}\n`);
  process.exit(0);
}

console.log(`\n  ${bold}🔍 Scanning before push...${reset}\n`);

const findings = scan();

if (findings.length === 0) {
  console.log(`  ${green}✅ No issues found. Safe to push.${reset}\n`);
  process.exit(0);
}

const errors = findings.filter((f) => f.severity === "error");
const warns = findings.filter((f) => f.severity === "warn");

const grouped = {};
for (const f of findings) {
  if (!grouped[f.label]) grouped[f.label] = [];
  grouped[f.label].push(f);
}

for (const [label, items] of Object.entries(grouped)) {
  const severity = items[0].severity;
  const icon = severity === "error" ? `${red}❌` : `${yellow}⚠`;
  console.log(`  ${icon} Found ${bold}${label}${reset} in:\n`);
  for (const item of items) {
    console.log(`    ${dim}${item.file}:${item.line}${reset}`);
    console.log(`    ${dim}→${reset} ${item.content}\n`);
  }
}

if (errors.length > 0) {
  console.log(`  ${red}${bold}❌ Push blocked for safety.${reset}\n`);
  process.exit(1);
}

console.log(`  ${yellow}${bold}⚠ Warnings found but push allowed.${reset}\n`);
process.exit(0);
