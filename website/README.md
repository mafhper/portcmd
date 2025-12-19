# Website - Technical Documentation
> **Context**: `/website`
> **Purpose**: Public Landing Page and Marketing Site.

## 🌍 Overview
This directory contains the source code for the "Promo Site" or Landing Page of PortCmd. It is a separate Vite project nested within the monorepo, designed to be deployed to the root of the domain (e.g., `github.io/portcmd/`).

## 🛠️ Stack
- **Vite** (Separate config: `vite.website.config.ts`)
- **React** (+ TypeScript)
- **Framer Motion** (Heavy use for animations)

## 📄 Pages
- **Home**: Hero section, Features, Download links.
- **Changelog**: Fetched dynamically from GitHub Releases.
- **Documentation**: Static docs (in progress).

## 🚀 Build & Deploy
The website build output is directed to the root `dist/` folder, while the App is built to `dist/app/`.
```bash
# Build Site Only
npm run build:website
```
