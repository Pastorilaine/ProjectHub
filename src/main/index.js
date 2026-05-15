import { app, BrowserWindow, ipcMain, shell, Tray, Menu, screen } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as db from './database'
import IPC from '../../shared/ipcChannels'
import { initAutoUpdater, installUpdate, checkForUpdates } from './updater'
import { startDeadlineChecker } from './notifications'
import {
  completeOnboarding,
  createWorkspace,
  deleteWorkspace,
  getSettings,
  saveSettings,
  setActiveWorkspace,
  updateWorkspace
} from './settings'

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
    const state = JSON.parse(readFileSync(WINDOW_STATE_FILE(), 'utf-8'))
    // Validate that the saved position is within a visible display area.
    // If not (e.g. a monitor was removed), drop x/y so Electron centres the window.
    if (state.x !== undefined && state.y !== undefined) {
      const visible = screen.getAllDisplays().some((d) => {
        const b = d.workArea
        return (
          state.x >= b.x &&
          state.y >= b.y &&
          state.x < b.x + b.width &&
          state.y < b.y + b.height
        )
      })
      if (!visible) {
        delete state.x
        delete state.y
      }
    }
    return state
  } catch {
    return { width: 1440, height: 900, maximized: false }
  }
}

let savedBounds = null
let isQuitting = false
let win = null
let tray = null

function emitWindowState() {
  if (!win || win.isDestroyed()) return
  win.webContents.send('window:stateChanged', { maximized: win.isMaximized() })
}

function saveWindowState() {
  if (!win) return
  try {
    const state = savedBounds
      ? { ...savedBounds, maximized: win.isMaximized() }
      : { width: 1440, height: 900, maximized: false }
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
    if (win?.isMinimized()) win.restore()
    if (!win?.isVisible()) win?.show()
    win?.moveTop()
    win?.focus()
  })
}

// ── Main window ────────────────────────────────────────────────────────────────
function createWindow() {
  const iconPath = join(app.getAppPath(), 'projecthub.png')
  const state = loadWindowState()

  win = new BrowserWindow({
    width: state.width || 1440,
    height: state.height || 900,
    x: state.x,
    y: state.y,
    center: state.x === undefined || state.y === undefined,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#07111F',
    icon: iconPath,
    ...(process.platform === 'win32' ? { backgroundMaterial: 'mica' } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.on('ready-to-show', () => {
    // Always call show() first — maximize() alone does not guarantee the window
    // receives focus on Windows (focus-stealing prevention can block it).
    win.show()
    if (state.maximized) {
      win.maximize()
    }
    emitWindowState()
    win.focus()
  })

  // Track normal (non-maximized) bounds for state saving
  win.on('resize', () => {
    if (!win.isMaximized() && !win.isMinimized()) savedBounds = win.getBounds()
  })
  win.on('move', () => {
    if (!win.isMaximized() && !win.isMinimized()) savedBounds = win.getBounds()
  })
  win.on('maximize', emitWindowState)
  win.on('unmaximize', emitWindowState)

  // Minimize to tray on close (if setting enabled) instead of quitting
  win.on('close', (e) => {
    saveWindowState()
    if (!isQuitting && getSettings().minimizeToTray) {
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
    if (win.isMinimized()) win.restore()
    if (!win.isVisible()) win.show()
    // moveTop() is needed on Windows to overcome focus-stealing prevention
    win.moveTop()
    win.focus()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

// ── IPC validation helpers ─────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const VALID_STATUSES = new Set(['todo', 'in_progress', 'done'])

function assertUuid(value, name = 'id') {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new Error(`Invalid ${name}: expected UUID`)
  }
}

function assertTitle(value, name = 'title') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${name}: must be a non-empty string`)
  }
}

// ── App lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('fi.it-veljekset.projecthub')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── Projects ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.PROJECTS_GET_ALL, () => db.getAllProjects())
  ipcMain.handle(IPC.PROJECTS_CREATE, (_, data) => {
    assertTitle(data?.name, 'name')
    return db.createProject(data)
  })
  ipcMain.handle(IPC.PROJECTS_UPDATE, (_, data) => {
    assertUuid(data?.id)
    assertTitle(data?.name, 'name')
    return db.updateProject(data)
  })
  ipcMain.handle(IPC.PROJECTS_DELETE, (_, id) => {
    assertUuid(id)
    return db.deleteProject(id)
  })

  // ── Tasks ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TASKS_GET_BY_PROJECT, (_, projectId) => {
    assertUuid(projectId, 'projectId')
    return db.getTasksByProject(projectId)
  })
  ipcMain.handle(IPC.TASKS_CREATE, (_, data) => {
    assertUuid(data?.projectId, 'projectId')
    assertTitle(data?.title)
    return db.createTask(data)
  })
  ipcMain.handle(IPC.TASKS_UPDATE, (_, data) => {
    assertUuid(data?.id)
    assertTitle(data?.title)
    return db.updateTask(data)
  })
  ipcMain.handle(IPC.TASKS_DELETE, (_, id) => {
    assertUuid(id)
    return db.deleteTask(id)
  })
  ipcMain.handle(IPC.TASKS_UPDATE_STATUS, (_, { id, status }) => {
    assertUuid(id)
    if (!VALID_STATUSES.has(status)) throw new Error(`Invalid status: ${status}`)
    return db.updateTaskStatus(id, status)
  })

  // ── Tags ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.TAGS_GET_ALL, () => db.getAllTags())
  ipcMain.handle(IPC.TAGS_CREATE, (_, data) => db.createTag(data))
  ipcMain.handle(IPC.TAGS_DELETE, (_, id) => db.deleteTag(id))

  // ── Search ────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SEARCH, (_, query) => db.search(query))
  // ── Dashboard ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.DASHBOARD_STATS, () => db.getDashboardStats())

  // ── Ideas ─────────────────────────────────────────────────────────────────
  const VALID_IDEA_STATUSES = new Set(['raw', 'refined', 'implemented'])
  ipcMain.handle(IPC.IDEAS_GET_ALL, () => db.getAllIdeas())
  ipcMain.handle(IPC.IDEAS_CREATE, (_, data) => {
    assertTitle(data?.title)
    return db.createIdea(data)
  })
  ipcMain.handle(IPC.IDEAS_UPDATE, (_, data) => {
    assertUuid(data?.id)
    assertTitle(data?.title)
    return db.updateIdea(data)
  })
  ipcMain.handle(IPC.IDEAS_DELETE, (_, id) => {
    assertUuid(id)
    return db.deleteIdea(id)
  })
  ipcMain.handle(IPC.IDEAS_UPDATE_STATUS, (_, { id, status }) => {
    assertUuid(id)
    if (!VALID_IDEA_STATUSES.has(status)) throw new Error(`Invalid idea status: ${status}`)
    return db.updateIdeaStatus(id, status)
  })
  // ── Auto-updater ──────────────────────────────────────────────────────────
  // Hand the updater a "prepare to quit" callback so it cleans up the tray
  // ONLY when the install actually starts (not if it fails before that).
  const prepareForUpdateQuit = () => {
    isQuitting = true
    if (tray && !tray.isDestroyed()) {
      tray.destroy()
      tray = null
    }
  }
  ipcMain.handle(IPC.UPDATE_INSTALL, () => installUpdate(prepareForUpdateQuit))
  ipcMain.handle(IPC.UPDATE_CHECK, () => checkForUpdates())

  // ── App info ───────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.APP_GET_VERSION, () => app.getVersion())
  ipcMain.handle(IPC.APP_COMPLETE_ONBOARDING, (_, data) => completeOnboarding(data))

  // ── Settings ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings())
  ipcMain.handle(IPC.SETTINGS_SAVE, (_, partial) => {
    const next = saveSettings(partial)
    // Apply side-effects immediately
    if ('launchAtStartup' in partial) {
      app.setLoginItemSettings({ openAtLogin: next.launchAtStartup })
    }
    return next
  })

  // ── Workspaces ────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.WORKSPACES_CREATE, (_, data) => {
    assertTitle(data?.name, 'workspace name')
    return createWorkspace(data)
  })
  ipcMain.handle(IPC.WORKSPACES_UPDATE, (_, data) => {
    assertUuid(data?.id)
    assertTitle(data?.name, 'workspace name')
    return updateWorkspace(data)
  })
  ipcMain.handle(IPC.WORKSPACES_DELETE, (_, id) => {
    assertUuid(id)
    return deleteWorkspace(id)
  })
  ipcMain.handle(IPC.WORKSPACES_SET_ACTIVE, (_, id) => {
    assertUuid(id)
    return setActiveWorkspace(id)
  })

  // ── Window controls ───────────────────────────────────────────────────────
  ipcMain.handle(IPC.WINDOW_GET_STATE, () => ({ maximized: !!win?.isMaximized() }))
  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
    win?.minimize()
    return { success: true }
  })
  ipcMain.handle(IPC.WINDOW_TOGGLE_MAXIMIZE, () => {
    if (!win) return { maximized: false }
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
    emitWindowState()
    return { maximized: win.isMaximized() }
  })
  ipcMain.handle(IPC.WINDOW_CLOSE, () => {
    win?.close()
    return { success: true }
  })

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
