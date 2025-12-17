# PortCmd

**PortCmd** is a port and process manager for developers. It allows you to easily identify, kill, and manage processes running on specific ports, directly from a beautiful, dashboard-style interface.

## Features

-   **Dashboard Overview**: Visualize active ports, CPU usage, and memory consumption.
-   **Process Management**: Kill or restart processes with a single click.
-   **Project Grouping**: Automatically groups Node.js/Vite/Bun processes by their project context.
-   **System Tray Ready**: Designed to work as a desktop widget or standalone app.
-   **Logs & Console**: View live output from your running scripts.

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/mafhper/portcmd.git
cd portcmd
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
This will start both the backend API (port 3001) and the frontend Application (port 5173).

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

## License

MIT