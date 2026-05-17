# git-safe-push

![npm](https://img.shields.io/npm/dt/git-safe-push)
![npm version](https://img.shields.io/npm/v/git-safe-push)
![license](https://img.shields.io/npm/l/git-safe-push)

> A lightweight CLI tool that scans staged Git files before push or commit and prevents dangerous code from being pushed accidentally.

## Installation

```bash
npm install -g git-safe-push
```

## Quick Start

```bash
# Scan staged files
npx git-safe-push

# Install git hooks (auto-scan on push & commit)
npx git-safe-push install
```

## CLI Usage

### Scan before push

```
$ npx git-safe-push

  🔍 Scanning before push...

  ❌ Found console.log in:
    src/auth.js
    → console.log("login failed")

  ❌ Found debugger statement in:
    app.js
    → debugger;

  ⚠ Found TODO comment in:
    src/routes.js
    → // TODO: add validation

  ❌ Push blocked for safety.
```

### Install hooks

```bash
npx git-safe-push install
# ✅ pre-push hook installed
# ✅ pre-commit hook installed
```

Now every `git push` and `git commit` will automatically scan staged files. If dangerous content is found, the push/commit is blocked.

## Configuration

Create `git-safe-push.config.json` in your project root:

```json
{
  "block": [
    "console.log",
    "debugger",
    "API_KEY",
    "fdescribe(",
    "fit(",
    "only("
  ]
}
```

## What It Detects

| Severity | Pattern                   | Example                          |
| -------- | ------------------------- | -------------------------------- |
| ❌ Error | `console.log/warn/error`  | `console.log("debug")`           |
| ❌ Error | `debugger` statement      | `debugger;`                      |
| ❌ Error | Possible API keys         | `sk-abc...` or long string       |
| ❌ Error | Hardcoded password        | `password: "secret"`             |
| ❌ Error | Hardcoded secret/token    | `secret: "123"`                  |
| ⚠ Warn  | `TODO` comments           | `// TODO: fix me`                |
| ⚠ Warn  | `.env` references         | `.env` in code                   |
| ⚠ Warn  | `process.env` usage       | `process.env.PORT`               |

## Test

```bash
node test.js
```

## License

MIT
