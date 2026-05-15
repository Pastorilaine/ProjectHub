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

  // Ideas
  getIdeas: () => ipcRenderer.invoke(IPC.IDEAS_GET_ALL),
  createIdea: (data) => ipcRenderer.invoke(IPC.IDEAS_CREATE, data),
  updateIdea: (data) => ipcRenderer.invoke(IPC.IDEAS_UPDATE, data),
  deleteIdea: (id) => ipcRenderer.invoke(IPC.IDEAS_DELETE, id),
  updateIdeaStatus: (id, status) => ipcRenderer.invoke(IPC.IDEAS_UPDATE_STATUS, { id, status }),

  // Auto-updater — install the downloaded update
  installUpdate: () => ipcRenderer.invoke(IPC.UPDATE_INSTALL),

  // Auto-updater — manually trigger a check
  checkForUpdates: () => ipcRenderer.invoke(IPC.UPDATE_CHECK),

  // App info
  getAppVersion: () => ipcRenderer.invoke(IPC.APP_GET_VERSION),
  completeOnboarding: (data) => ipcRenderer.invoke(IPC.APP_COMPLETE_ONBOARDING, data),

  // User settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET),
  saveSettings: (data) => ipcRenderer.invoke(IPC.SETTINGS_SAVE, data),

  // Workspaces
  createWorkspace: (data) => ipcRenderer.invoke(IPC.WORKSPACES_CREATE, data),
  updateWorkspace: (data) => ipcRenderer.invoke(IPC.WORKSPACES_UPDATE, data),
  deleteWorkspace: (id) => ipcRenderer.invoke(IPC.WORKSPACES_DELETE, id),
  setActiveWorkspace: (id) => ipcRenderer.invoke(IPC.WORKSPACES_SET_ACTIVE, id),

  // Window controls
  getWindowState: () => ipcRenderer.invoke(IPC.WINDOW_GET_STATE),
  minimizeWindow: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  toggleMaximizeWindow: () => ipcRenderer.invoke(IPC.WINDOW_TOGGLE_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),

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
  },
  onUpdateInstallError: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:installError', fn)
    return () => ipcRenderer.removeListener('update:installError', fn)
  },
  onUpdateError: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('update:error', fn)
    return () => ipcRenderer.removeListener('update:error', fn)
  },
  onWindowStateChanged: (cb) => {
    const fn = (_, data) => cb(data)
    ipcRenderer.on('window:stateChanged', fn)
    return () => ipcRenderer.removeListener('window:stateChanged', fn)
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
