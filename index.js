import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PATTERNS = [
  { pattern: /console\.\w+\s*\(/, label: "console.log", severity: "error" },
  { pattern: /\bdebugger\b/, label: "debugger statement", severity: "error" },
  { pattern: /TODO/i, label: "TODO comment", severity: "warn" },
  { pattern: /(['"])[A-Za-z0-9_\-]{20,}\1/, label: "possible API key / secret", severity: "error" },
  { pattern: /(?:sk-[a-zA-Z0-9]{20,}|pk-[a-zA-Z0-9]{20,})/, label: "possible API key (sk/pk)", severity: "error" },
  { pattern: /\.env\b/, label: ".env file reference", severity: "warn" },
  { pattern: /process\.env\./, label: "process.env usage", severity: "warn" },
  { pattern: /password\s*[:=]\s*['"]/, label: "hardcoded password", severity: "error" },
  { pattern: /secret\s*[:=]\s*['"]/, label: "hardcoded secret", severity: "error" },
  { pattern: /token\s*[:=]\s*['"]/, label: "hardcoded token", severity: "error" },
];

const IGNORE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
  ".woff", ".woff2", ".ttf", ".eot", ".pdf",
  ".lock", ".sum",
]);

function getConfig(projectDir) {
  const configPath = path.join(projectDir, "git-safe-push.config.json");
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return null;
  }
}

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      timeout: 5000,
    });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function getStagedDiff(file) {
  try {
    return execSync(`git diff --cached "${file}"`, {
      encoding: "utf-8",
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    return "";
  }
}

function scanFile(file, patterns) {
  const ext = path.extname(file);
  if (IGNORE_EXTENSIONS.has(ext)) return [];

  const content = getStagedDiff(file);
  if (!content) return [];

  const findings = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only check added lines (starting with +)
    if (!line.startsWith("+")) continue;
    const stripped = line.slice(1);

    for (const { pattern, label, severity } of patterns) {
      if (pattern.test(stripped)) {
        findings.push({ file, line: i, content: stripped.trim(), label, severity });
      }
    }
  }

  return findings;
}

export function scan(options = {}) {
  const projectDir = process.cwd();
  const config = getConfig(projectDir);
  let patterns = DEFAULT_PATTERNS;

  if (config?.block) {
    const custom = config.block.map((b) => ({
      pattern: new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      label: b,
      severity: "error",
    }));
    patterns = [...custom, ...DEFAULT_PATTERNS];
  }

  const files = options.files || getStagedFiles();
  const allFindings = [];

  for (const file of files) {
    const findings = scanFile(file, patterns);
    allFindings.push(...findings);
  }

  return allFindings;
}

export function hasBlockers(findings) {
  return findings.some((f) => f.severity === "error");
}
