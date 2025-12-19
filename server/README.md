# Server - Technical Documentation
> **Context**: `/server`
> **Purpose**: Backend API for PortCmd (System Operations & File System).

## 🔌 Overview
The Server module acts as the bridge between the React Frontend (UI) and the Operating System. Since a browser-based UI cannot directly kill processes or read disk files, this Express.js server exposes these capabilities via a REST API.

## 🏗️ Architecture
- **Framework**: Express.js
- **Runtime**: Node.js (ES Modules)
- **Library**: `systeminformation` (for process stats)

## 🛣️ API Endpoints

### System & Processes
- `GET /api/processes`: List active development processes.
- `POST /api/processes/:pid/kill`: Terminate a process.
- `POST /api/processes/:pid/restart`: Restart a managed process.

### Projects
- `GET /api/projects`: List saved workspaces.
- `POST /api/projects`: Register a new workspace.

### File System
- `POST /api/fs/validate`: Check if a path exists and is valid.

## 🔧 Configuration
- Port: `3001` (Default)
- Config File: `server/projects.json` (Database of saved projects).

## 🚀 Local Development
```bash
# Start Server in Watch Mode
npm run dev --prefix server
```
