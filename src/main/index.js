import { app, BrowserWindow, ipcMain, shell, Tray, Menu } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as db from './database'
import IPC from '../../shared/ipcChannels'
import { initAutoUpdater, installUpdate } from './updater'
import { startDeadlineChecker } from './notifications'

// ── Single-instance lock ───────────────────────────────────────────────────────
// Prevent multiple instances of the app running at the same time.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// ── Window state helpers ───────────────────────────────────────────────────────
const WINDOW_STATE_FILE = () => join(app.getPath('userData'), 'window-state.json')

function loadWindowState() {
  try {
    return JSON.parse(readFileSync(WINDOW_STATE_FILE(), 'utf-8'))
  } catch {
    return { width: 1280, height: 820, maximized: false }
  }
}

let savedBounds = null
let isQuitting = false
let win = null
let tray = null

function saveWindowState() {
  if (!win) return
  try {
    const state = savedBounds
      ? { ...savedBounds, maximized: win.isMaximized() }
      : { width: 1280, height: 820, maximized: false }
    writeFileSync(WINDOW_STATE_FILE(), JSON.stringify(state), 'utf-8')
  } catch {
    /* ignore write errors */
  }
}

// ── Tray ───────────────────────────────────────────────────────────────────────
function createTray() {
  const iconPath = join(app.getAppPath(), 'projecthub.png')
  tray = new Tray(iconPath)
  tray.setToolTip('ProjectHub')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Avaa ProjectHub',
      click: () => {
        win?.show()
        win?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Sulje',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (win?.isVisible()) {
      win.focus()
    } else {
      win?.show()
      win?.focus()
    }
  })
}

// ── Main window ────────────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = join(app.getAppPath(), 'projecthub.png')
  const state = loadWindowState()

  win = new BrowserWindow({
    width: state.width || 1280,
    height: state.height || 820,
    x: state.x,
    y: state.y,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (state.maximized) win.maximize()

  win.on('ready-to-show', () => win.show())

  // Track normal (non-maximized) bounds for state saving
  win.on('resize', () => {
    if (!win.isMaximized() && !win.isMinimized()) savedBounds = win.getBounds()
  })
  win.on('move', () => {
    if (!win.isMaximized() && !win.isMinimized()) savedBounds = win.getBounds()
  })

  // Minimize to tray on close instead of quitting
  win.on('close', (e) => {
    saveWindowState()
    if (!isQuitting) {
      e.preventDefault()
      win.hide()
    }
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Bring existing window to front when a second instance is launched
app.on('second-instance', () => {
  if (win) {
    if (!win.isVisible()) win.show()
    win.focus()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

// ── App lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('fi.it-veljekset.projecthub')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── Projects ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.PROJECTS_GET_ALL, () => db.getAllProjects())
  ipcMain.handle(IPC.PROJECTS_CREATE, (_, data) => db.createProject(data))
  ipcMain.handle(IPC.PROJECTS_UPDATE, (_, data) => db.updateProject(data))
  ipcMain.handle(IPC.PROJECTS_DELETE, (_, id) => db.deleteProject(id))

  // ── Tasks ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TASKS_GET_BY_PROJECT, (_, projectId) => db.getTasksByProject(projectId))
  ipcMain.handle(IPC.TASKS_CREATE, (_, data) => db.createTask(data))
  ipcMain.handle(IPC.TASKS_UPDATE, (_, data) => db.updateTask(data))
  ipcMain.handle(IPC.TASKS_DELETE, (_, id) => db.deleteTask(id))
  ipcMain.handle(IPC.TASKS_UPDATE_STATUS, (_, { id, status }) => db.updateTaskStatus(id, status))

  // ── Tags ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TAGS_GET_ALL, () => db.getAllTags())
  ipcMain.handle(IPC.TAGS_CREATE, (_, data) => db.createTag(data))
  ipcMain.handle(IPC.TAGS_DELETE, (_, id) => db.deleteTag(id))

  // ── Search ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SEARCH, (_, query) => db.search(query))

  // ── Auto-updater ──────────────────────────────────────────────────────────
  ipcMain.handle(IPC.UPDATE_INSTALL, () => installUpdate())

  createWindow()
  createTray()

  // Start deadline notifications after DB is available
  startDeadlineChecker()

  // Initialise auto-updater (no-op in dev mode)
  initAutoUpdater(win)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // On macOS it's common to leave the app running even with no windows open
  if (process.platform === 'darwin') app.quit()
  // On Windows/Linux: minimize to tray — handled by win.on('close')
})
