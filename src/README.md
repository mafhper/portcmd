# App Source - Technical Documentation
> **Context**: `/src`
> **Purpose**: Frontend Logic and UI Components for the PortCmd Application.

## Overview
This directory contains the source code for the main React Application (The Dashboard). It is built with **Vite**, **TypeScript**, and **TailwindCSS**.

## Structure

| Folder | Content |
|--------|---------|
| `components/` | Reusable UI components (Sidebar, Modals, Tables). |
| `contexts/` | Global State (Preferences, React Context). |
| `services/` | Frontend API Clients (interacting with `/server`). |
| `theme/` | Theme tokens and definitions (Boreal, Chroma, etc.). |
| `locales/` | i18n JSON translation files. |
| `types/` | TypeScript interfaces and shared types. |

## Key Components

### `App.tsx`
The main entry point. Handles the Layout shell, Routing (via View State), and global refresh intervals.

### `Sidebar.tsx`
The main navigation component.
- Handles `i18n` label rendering.
- Manages routing view state (`dashboard`, `projects`, etc.).
- Contains quick actions for Quality Core.

### `SystemService.ts`
The bridge to the Backend API. All `fetch` calls reside here.

## Theming System
The app uses a dynamic CSS variable system injected by `PreferencesContext`.
- **Modes**: toggled via `html.class="dark"` or light.
- **Palettes**: injected as style tags or CSS variables on the `:root`.

## Development
```bash
# Run Client (HMR)
npm run dev:client
```
