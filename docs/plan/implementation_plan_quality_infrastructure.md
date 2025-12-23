# Implementation Plan - Quality Gate & Reporting Infrastructure Fixes

The user reported several critical issues with the Quality Gate and the dashboard's reporting capabilities. This plan outlines the steps to fix these issues and improve the overall auditing experience.

## 1. Fix Quality Gate Violation Logging

The Quality Gate currently shows `[object Object]` for technical violations. This is likely due to improper serialization of Lighthouse audit objects.

- **Objective**: Ensure all violations are human-readable in the Quality Gate JSON report.
- **Sub-tasks**:
  - [ ] Locate violation gathering logic in `packages/quality-core/cli/run.cjs` (or equivalent).
  - [ ] Implement a helper to flatten/serialize audit objects into strings.
  - [ ] Verify fix by running `npm run quality:gate` and inspecting the JSON output.

## 2. Refine Local Reports Viewer

The current manual report viewer is too basic and lacks detail for Lighthouse audits.

- **Objective**: Create a comprehensive, "useful" view for manual Lighthouse reports.
- **Sub-tasks**:
  - [ ] Update `viewManualReport` in `index.html` to fetch and prepare detailed data.
  - [ ] Redesign the modal content to include:
    - Big score circles for all 4 Lighthouse categories.
    - Detailed list of "Opportunity" and "Diagnostic" audits.
    - "How to fix" links for each issue.
  - [ ] Add a "Raw JSON" accordion for advanced debugging.

## 3. Fix PageSpeed Zeroed Data

PageSpeed reports are showing 0 for all metrics.

- **Objective**: Debug and fix PageSpeed data retrieval and storage.
- **Sub-tasks**:
  - [ ] Audit `packages/quality-core/cli/run-pagespeed.cjs` and API response handling.
  - [ ] Ensure the mapping to scores correctly handles the PageSpeed Insights API v5 structure.
  - [ ] Execute fresh PageSpeed tests using `npm run perf:pagespeed`.
  - [ ] Clean up existing zeroed reports.

## 4. Technical Audit Remediation

Address the P0/P1 issues identified in the executive summary.

- **Sub-tasks**:
  - [ ] Optimize main thread tasks (long tasks > 50ms) to improve UX score to 100.
  - [ ] Profile and optimize Build pipeline to achieve `build: 100`.
