/**
 * User settings — persisted to userData/settings.json.
 * All fields have safe defaults so the file is optional.
 */

import { randomUUID } from 'crypto'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs'

const LEGACY_DB_FILE = 'projecthub.db'
const DEFAULT_WORKSPACE_ID = '00000000-0000-4000-8000-000000000000'
const DEFAULT_WORKSPACE_NAME = 'IT-Veljekset Group'

export const DEFAULTS = {
  /** Brand name shown in the sidebar and onboarding */
  appName: 'ProjectHub',
  /** Whether the first-run setup has been completed */
  onboardingCompleted: true,
  /** Launch app automatically when Windows starts */
  launchAtStartup: false,
  /** Hide to tray instead of quitting when the window close button is clicked */
  minimizeToTray: true,
  /** Show Windows toast notifications for upcoming/overdue tasks */
  deadlineNotifications: true,
  /** How many hours ahead to warn about a deadline */
  notificationAdvanceHours: 24,
  /** Workspace registry */
  workspaces: [],
  activeWorkspaceId: null
}

const settingsPath = () => join(app.getPath('userData'), 'settings.json')
const workspaceDbPath = (dbFile) => join(app.getPath('userData'), dbFile)

function hasLegacyWorkspaceData() {
  return existsSync(workspaceDbPath(LEGACY_DB_FILE))
}

function createDefaultWorkspace() {
  const now = Date.now()
  return {
    id: DEFAULT_WORKSPACE_ID,
    name: DEFAULT_WORKSPACE_NAME,
    dbFile: LEGACY_DB_FILE,
    createdAt: now,
    updatedAt: now
  }
}

function normalizeWorkspace(workspace, index) {
  const now = Date.now()
  const id = typeof workspace?.id === 'string' && workspace.id.trim()
    ? workspace.id.trim()
    : randomUUID()

  return {
    id,
    name: typeof workspace?.name === 'string' && workspace.name.trim()
      ? workspace.name.trim()
      : `Workspace ${index + 1}`,
    dbFile: typeof workspace?.dbFile === 'string' && workspace.dbFile.trim()
      ? workspace.dbFile.trim()
      : `projecthub-workspace-${id}.db`,
    createdAt: Number.isFinite(workspace?.createdAt) ? workspace.createdAt : now,
    updatedAt: Number.isFinite(workspace?.updatedAt) ? workspace.updatedAt : now
  }
}

function readSettingsState() {
  if (!existsSync(settingsPath())) {
    return { raw: {}, hasSettingsFile: false }
  }

  try {
    return {
      raw: JSON.parse(readFileSync(settingsPath(), 'utf-8')),
      hasSettingsFile: true
    }
  } catch {
    return { raw: {}, hasSettingsFile: true }
  }
}

function normalizeSettings(raw = {}, { hasSettingsFile = true } = {}) {
  const base = { ...DEFAULTS, ...raw }
  const hasWorkspaceArray = Array.isArray(raw.workspaces)
  const legacyWorkspace = !hasWorkspaceArray && hasLegacyWorkspaceData()
  const firstRun = !hasSettingsFile && !legacyWorkspace

  const workspaces = hasWorkspaceArray && base.workspaces.length > 0
    ? base.workspaces.map(normalizeWorkspace)
    : legacyWorkspace
    ? [createDefaultWorkspace()]
    : []

  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === base.activeWorkspaceId)
    ? base.activeWorkspaceId
    : workspaces[0]?.id || null

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null
  const appName = typeof raw.appName === 'string' && raw.appName.trim()
    ? raw.appName.trim()
    : DEFAULTS.appName
  const onboardingCompleted = typeof raw.onboardingCompleted === 'boolean'
    ? raw.onboardingCompleted
    : !firstRun

  return {
    ...base,
    appName,
    onboardingCompleted,
    workspaces,
    activeWorkspaceId,
    activeWorkspace
  }
}

function serializeSettings(settings) {
  const { activeWorkspace, ...persisted } = settings
  return persisted
}

function writeSettings(settings) {
  writeFileSync(settingsPath(), JSON.stringify(serializeSettings(settings), null, 2), 'utf-8')
}

function persist(buildNext) {
  const current = getSettings()
  const next = normalizeSettings(buildNext(current))
  try {
    writeSettings(next)
  } catch (err) {
    console.error('[settings] Failed to write settings:', err)
  }
  return next
}

/** Returns current settings merged over defaults. Never throws. */
export function getSettings() {
  const { raw, hasSettingsFile } = readSettingsState()
  return normalizeSettings(raw, { hasSettingsFile })
}

export function getActiveWorkspace() {
  return getSettings().activeWorkspace
}

/**
 * Merges `partial` into current settings, writes to disk, and returns the
 * full updated settings object.
 */
export function saveSettings(partial) {
  return persist((current) => ({
    ...serializeSettings(current),
    ...partial
  }))
}

export function completeOnboarding({ appName, workspaceName }) {
  const trimmedAppName = typeof appName === 'string' ? appName.trim() : ''
  const trimmedWorkspaceName = typeof workspaceName === 'string' ? workspaceName.trim() : ''

  if (!trimmedAppName) throw new Error('Application name is required')
  if (!trimmedWorkspaceName) throw new Error('Workspace name is required')

  return persist((current) => {
    const now = Date.now()
    const workspaceId = randomUUID()
    const firstWorkspace = {
      id: workspaceId,
      name: trimmedWorkspaceName,
      dbFile: `projecthub-workspace-${workspaceId}.db`,
      createdAt: now,
      updatedAt: now
    }

    const workspaces = current.workspaces.length > 0 ? current.workspaces : [firstWorkspace]
    const activeWorkspaceId = workspaces.some((workspace) => workspace.id === current.activeWorkspaceId)
      ? current.activeWorkspaceId
      : workspaces[0].id

    return {
      ...serializeSettings(current),
      appName: trimmedAppName,
      onboardingCompleted: true,
      workspaces,
      activeWorkspaceId
    }
  })
}

export function createWorkspace({ name }) {
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) throw new Error('Workspace name is required')

  return persist((current) => {
    const now = Date.now()
    const id = randomUUID()
    const workspace = {
      id,
      name: trimmedName,
      dbFile: `projecthub-workspace-${id}.db`,
      createdAt: now,
      updatedAt: now
    }

    return {
      ...serializeSettings(current),
      workspaces: [...current.workspaces, workspace],
      activeWorkspaceId: id
    }
  })
}

export function updateWorkspace({ id, name }) {
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (!trimmedName) throw new Error('Workspace name is required')

  return persist((current) => {
    const exists = current.workspaces.some((workspace) => workspace.id === id)
    if (!exists) throw new Error('Workspace not found')

    return {
      ...serializeSettings(current),
      workspaces: current.workspaces.map((workspace) => (
        workspace.id === id
          ? { ...workspace, name: trimmedName, updatedAt: Date.now() }
          : workspace
      ))
    }
  })
}

export function setActiveWorkspace(id) {
  return persist((current) => {
    const exists = current.workspaces.some((workspace) => workspace.id === id)
    if (!exists) throw new Error('Workspace not found')

    return {
      ...serializeSettings(current),
      activeWorkspaceId: id
    }
  })
}

export function deleteWorkspace(id) {
  const current = getSettings()
  if (current.workspaces.length <= 1) {
    throw new Error('At least one workspace must remain')
  }
  if (current.activeWorkspaceId === id) {
    throw new Error('Switch to another workspace before deleting this one')
  }

  const target = current.workspaces.find((workspace) => workspace.id === id)
  if (!target) throw new Error('Workspace not found')

  const next = persist((settings) => ({
    ...serializeSettings(settings),
    workspaces: settings.workspaces.filter((workspace) => workspace.id !== id)
  }))

  try {
    const dbFilePath = workspaceDbPath(target.dbFile)
    if (existsSync(dbFilePath)) unlinkSync(dbFilePath)
  } catch (err) {
    console.error('[settings] Failed to delete workspace database:', err)
  }

  return next
}
