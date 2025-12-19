# Scripts - Technical Documentation
> **Context**: `/scripts`
> **Purpose**: Automation, Maintenance, and CI/CD utilities.

## 🤖 Overview
This directory houses standalone Node.js scripts used for maintaining the project's health, running audits, and performing automated operations.

## 📂 Categories

### 🛡️ Health & Audit (`/audit`, `/health.js`)
- `health.js`: A quick diagnostic tool. Checks dependencies, ports, and environment.
- `audit-runner.js`: Legacy runner for audits (being superseded by Quality Core).

### 🧪 Test (`/test`)
- `test/i18n.js`: Scans the `src` folder for hardcoded strings that should use `t()`.
- `test/perf.js`: Simple response time checks.
- `test/structure.js`: Enforces folder structure rules.

### ⚙️ Ops (`/ops`)
- `fetch-changelog.js`: Fetches latest GitHub releases.
- `optimize-images.js`: Compress assets in `public`.

## 🚀 Usage
Most scripts are aliased in `package.json`.
```bash
npm run health
npm run test:i18n
```
