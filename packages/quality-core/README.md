# Quality Core - Technical Documentation
> **Context**: `packages/quality-core`
> **Purpose**: Centralized Quality Assurance Engine and Dashboard 2.0 system.

## Overview
The **Quality Core** is a standalone workspace responsible for maintaining the health, stability, and quality of the PortCmd ecosystem. It provides CLI tools to run validators, aggregate results, and a dashboard to visualize metrics.

## Architecture
The core is divided into three layers:

### 1. CLI & Validators (`/cli`)
Entry points for execution.
- `run.cjs`: Main orchestrator. Runs a suite of validators (Lint, Unit, E2E, Structure).
- `run-lighthouse.cjs`: Specialized runner for Google Lighthouse performance audits.
- Output: Generates standardized JSON reports in `performance-reports/`.

### 2. Logic Engines (`/src/logic`)
Business logic for quality assessment.
- `alertEngine.mjs`: Analyzes trends and thresholds to generate "Alerts" (e.g., "Score dropped below 80").
- `diffQuality.mjs`: Compares current run vs. previous run to calculate deltas.

### 3. Dashboard 2.0 (`/dashboard`)
A dedicated visualization frontend.
- **Server**: `dashboard/server.cjs` (Lightweight Express server to serve reports).
- **Client**: `dashboard/public/index.html` (Single-file vanilla JS/Tailwind app for maximum portability).

## Usage

### As a Library
Can be imported by other projects to run standard gates.
```javascript
// Example usage (theoretical)
const { runQualityGate } = require('@port/quality-core');
await runQualityGate({ strict: true });
```

### CLI Commands
Run from the project root:
```bash
# Run Full Gate
npm run quality:gate

# Run Performance Tests
npm run perf:lighthouse
```

## Reports
Reports are stored in `root/performance-reports/` and follow a canonical schema:
```json
{
  "timestamp": "ISO-Date",
  "metrics": {
    "lint": { "score": 100, "errors": 0 },
    "performance": { "score": 95, "data": {...} }
  },
  "status": "PASS"
}
```
