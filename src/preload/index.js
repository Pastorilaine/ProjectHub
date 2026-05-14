import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import IPC from '../../shared/ipcChannels'

/**
 * Expose the database API to the renderer via contextBridge.
 * The renderer calls window.api.XXX() — never interacts with ipcRenderer directly.
 */
const api = {
  // Projects
  getProjects: () => ipcRenderer.invoke(IPC.PROJECTS_GET_ALL),
  createProject: (data) => ipcRenderer.invoke(IPC.PROJECTS_CREATE, data),
  updateProject: (data) => ipcRenderer.invoke(IPC.PROJECTS_UPDATE, data),
  deleteProject: (id) => ipcRenderer.invoke(IPC.PROJECTS_DELETE, id),

  // Tasks
  getTasksByProject: (projectId) => ipcRenderer.invoke(IPC.TASKS_GET_BY_PROJECT, projectId),
  createTask: (data) => ipcRenderer.invoke(IPC.TASKS_CREATE, data),
  updateTask: (data) => ipcRenderer.invoke(IPC.TASKS_UPDATE, data),
  deleteTask: (id) => ipcRenderer.invoke(IPC.TASKS_DELETE, id),
  updateTaskStatus: (id, status) => ipcRenderer.invoke(IPC.TASKS_UPDATE_STATUS, { id, status }),

  // Tags
  getTags: () => ipcRenderer.invoke(IPC.TAGS_GET_ALL),
  createTag: (data) => ipcRenderer.invoke(IPC.TAGS_CREATE, data),
  deleteTag: (id) => ipcRenderer.invoke(IPC.TAGS_DELETE, id),

  // Search
  search: (query) => ipcRenderer.invoke(IPC.SEARCH, query),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke(IPC.DASHBOARD_STATS),

  // Auto-updater — install the downloaded update
  installUpdate: () => ipcRenderer.invoke(IPC.UPDATE_INSTALL),

  // Auto-updater — manually trigger a check
  checkForUpdates: () => ipcRenderer.invoke(IPC.UPDATE_CHECK),

  // App info
  getAppVersion: () => ipcRenderer.invoke(IPC.APP_GET_VERSION),

  // User settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  saveSettings: (data) => ipcRenderer.invoke(IPC.SETTINGS_SAVE, data),

  // Auto-updater — push events from main to renderer
  // Each returns a cleanup function to remove the listener.
  onUpdateChecking: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:checking', fn)
    return () => ipcRenderer.removeListener('update:checking', fn)
  },
  onUpdateAvailable: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:available', fn)
    return () => ipcRenderer.removeListener('update:available', fn)
  },
  onUpdateNotAvailable: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:notAvailable', fn)
    return () => ipcRenderer.removeListener('update:notAvailable', fn)
  },
  onUpdateProgress: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:progress', fn)
    return () => ipcRenderer.removeListener('update:progress', fn)
  },
  onUpdateDownloaded: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:downloaded', fn)
    return () => ipcRenderer.removeListener('update:downloaded', fn)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
