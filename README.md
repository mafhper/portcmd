# PortCmd - Process Manager & Quality Dashboard

> *A process manager for **developers and designers** who demand excellence.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Quality Gate](https://img.shields.io/badge/Quality-Passing-success)](https://github.com/mafhper/port-command)
[![PortCmd](https://img.shields.io/badge/Version-1.0.0-blue)](https://github.com/mafhper/port-command)

**Read in other languages: [Português (Brasil)](README.pt-BR.md) | [Español](README.es.md)**

---

**PortCmd** is more than just a process manager. It is a comprehensive development environment tool designed to orchestrate your local workflow, monitor application health, and enforce code quality standards through its integrated **Quality Core**.

---

## Key Features

### Process Orchestration

- **Kill & Restart**: Terminate or restart processes stuck on specific ports (3000, 5173, 8080...) with a single click.
- **Smart Detection**: Automatic identification of "Zombie", "Suspended", or high-memory consumption processes.
- **Project Context**: Groups processes by project (e.g., API + Client + Database) for easier management.

### Premium UI/UX (For Designers)

- **Glassmorphism Design**: Modern interface with configurable blur effects, gradients, and transparency.
- **Theme Engine**:
  - **Modes**: Light, Dark, Auto.
  - **Presets**: Boreal (Aurora), Chroma (Cyberpunk), Obsidian (Minimal), Quartz (Clean).
- **Accessibility**: Dedicated modes for Deuteranopia, Protanopia, and Tritanopia.
- **Pixel Perfection**: Built for high-DPI displays with a focus on visual fidelity.

### Internationalization (i18n)

- Native support for **English (US)**, **Portuguese (BR)**, and **Spanish**.
- Automatic system-based detection.

### Quality Core

A centralized engine for technical excellence. See dedicated section below.

---

## Quality Core: In Pursuit of Excellence

The **Quality Core** (`@port/quality-core`) is a modular subsystem integrated into PortCmd designed to act as the "Guardian of Quality" for your projects. It is not just a runner; it is a philosophy of **Continuous Improvement**.

### How it Works

1.  **Validators**: Modular scripts that check specific quality attributes:
    -   `lint`: Static code analysis (ESLint/TSC).
    -   `test:structure`: Verifies architectural integrity (folder structure, naming conventions).
    -   `test:i18n`: Ensures all text strings are wrapped in translation functions.
    -   `perf:lighthouse`: Automated Lighthouse audits (Mobile/Desktop) for Performance, SEO, and Accessibility.
2.  **Aggregation**: All results are compiled into a canonical JSON Report (`quality-report.json`).
3.  **Visualization**: The **Quality Dashboard** consumes these reports to render Trend Charts, Pass Rates, and detailed insights.

### Usage

- **Run Full Gate**: `npm run quality:gate` (Runs all validators + Logic Engine)
- **Performance Only**: `npm run perf:lighthouse` (Trigger Lighthouse Audits)
- **View Dashboard**: Open the "Quality Scans" or "Dashboard" tab in PortCmd.

> *"Quality is not an act, it is a habit."* — Aristotle. The Quality Core automates this habit.

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- NPM 9+ (Workspaces support)

### Setup

```bash
# 1. Clone
git clone https://github.com/mafhper/port-command.git
cd port-command

# 2. Install (Installs root + workspaces)
npm install

# 3. Dev Mode (Runs API, App, and Website)
npm run dev
```

### Build & Deploy

```bash
# Build all components (App + Website)
npm run build

# Deploy (if configured)
npm run deploy
```

---

## Project Structure

| Directory | Description |
|-----------|-------------|
| `/app` | The main React Application (Dashboard UI). |
| `/server` | Express/Node.js backend API (Process handling, File System). |
| `/packages/quality-core` | **The Brain**. Contains CLI, Validators, and Logic Engines. |
| `/website` | Public Landing Page & Documentation site. |
| `/scripts` | Automation scripts for Health, Audit, and Ops. |

---

## Contributing

We welcome contributions! Please see `docs/CONTRIBUTING.md` (if available) or follow the standard PR process.

1. Create a feature branch (`feat/new-thing`)
2. Commit changes
3. Run `npm run quality:gate` to ensure no regressions
4. Push and Open PR

---

## Deployment (GitHub Pages)

The project is configured to deploy a Promo Site to the root and the App to `/app/`.

1.  **Build**:
    ```bash
    npm run deploy
    ```
    This generates a `dist/` folder containing:
    *   `index.html` (Promo Site)
    *   `app/index.html` (Application)

2.  **Push**:
    Push the `dist` folder to your `gh-pages` branch or configure GitHub Actions to build from main.

**Note:** The web version of the App on GitHub Pages is a **demo only**. It cannot interact with your local system processes (Node backend is required). To use the full features, run it locally.

---

## License

MIT © mafhper