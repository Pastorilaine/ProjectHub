import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as db from './database'
import IPC from '../../shared/ipcChannels'

function createWindow() {
  const iconPath = join(app.getAppPath(), 'projecthub.png')

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
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

  win.on('ready-to-show', () => {
    win.show()
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

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
