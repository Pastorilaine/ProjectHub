/**
 * User settings — persisted to userData/settings.json.
 * All fields have safe defaults so the file is optional.
 */

import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

export const DEFAULTS = {
  /** Launch app automatically when Windows starts */
  launchAtStartup: false,
  /** Hide to tray instead of quitting when the window close button is clicked */
  minimizeToTray: true,
  /** Show Windows toast notifications for upcoming/overdue tasks */
  deadlineNotifications: true,
  /** How many hours ahead to warn about a deadline */
  notificationAdvanceHours: 24
}

const settingsPath = () => join(app.getPath('userData'), 'settings.json')

/** Returns current settings merged over defaults. Never throws. */
export function getSettings() {
  try {
    const raw = JSON.parse(readFileSync(settingsPath(), 'utf-8'))
    return { ...DEFAULTS, ...raw }
  } catch {
    return { ...DEFAULTS }
  }
}

/**
 * Merges `partial` into current settings, writes to disk, and returns the
 * full updated settings object.
 */
export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial }
  try {
    writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf-8')
  } catch (err) {
    console.error('[settings] Failed to write settings:', err)
  }
  return next
}
