# ProjectHub

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Local-first project & task management for Windows — built by [IT-Veljekset Group](https://github.com/Pastorilaine)

ProjectHub is a lightweight desktop application for managing projects and tasks. All data is stored **locally on your device** using SQLite — no accounts, no cloud, no subscriptions required.

---

## Features

- **Projects** — Create, edit, archive and delete projects with custom colors and descriptions
- **Kanban board** — Drag-and-drop tasks between *Todo*, *In Progress* and *Done* columns
- **Task management** — Priorities (high / normal / low), due dates, tags and free-text notes
- **Dashboard** — Overview of active projects, open tasks, overdue items and upcoming deadlines
- **Quick search** — Global `Ctrl+K` search across all projects and tasks
- **Deadline notifications** — Windows notifications for approaching and overdue task deadlines
- **System tray** — Minimize to tray; the app stays running in the background
- **Auto-updates** — Automatic update checks on startup via GitHub Releases
- **Launch at startup** — Optional Windows startup entry

---

## Download & Install

Head to the [**Releases**](https://github.com/Pastorilaine/ProjectHub/releases/latest) page and download the latest Windows installer (`ProjectHub-Setup-x.x.x.exe`).

The installer is per-user (no admin rights required) and lets you choose the installation directory.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | [Electron](https://electronjs.org) v31 |
| Build | [electron-vite](https://electron-vite.org) + Vite 5 |
| UI | React 18 + TailwindCSS |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (local SQLite) |
| Drag & drop | [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) |
| Auto-update | [electron-updater](https://www.electron.build/auto-update) |
| Packaging | [electron-builder](https://www.electron.build) — NSIS installer |

---

## Development

### Prerequisites

- Node.js 20+
- Windows (native `better-sqlite3` build requires matching Electron headers)

### Setup

```bash
git clone https://github.com/Pastorilaine/ProjectHub.git
cd ProjectHub
npm install
```

### Run in development

```bash
npm run dev
```

### Build Windows installer

```bash
npm run build:win
```

### Build and publish a release

Requires a `GH_TOKEN` environment variable with `repo` scope.

```bash
npm run release:win
```

---

## Project Structure

```
src/
├── main/           # Electron main process (IPC handlers, SQLite, tray, updater)
├── preload/        # Context bridge — exposes safe API to the renderer
└── renderer/
    └── src/
        ├── components/   # Reusable UI components
        └── pages/        # Page-level views (Dashboard, Projects, Settings…)
shared/
└── ipcChannels.js  # IPC channel name constants shared between main and renderer
```

---

## License

[MIT](LICENSE) © 2026 Pastorilaine / IT-Veljekset Group
