/**
 * Auto-updater module.
 * Checks for updates on GitHub Releases, downloads in the background,
 * and notifies the renderer when ready to install.
 *
 * In dev mode this is a no-op.
 * Requires: package.json → build.publish → { provider: "github", owner, repo }
 */

import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

let mainWindow = null

export function initAutoUpdater(win) {
  mainWindow = win

  if (is.dev) {
    console.log('[updater] Dev mode — auto-updater disabled')
    return
  }

  // Download silently in the background; don't show the default dialog
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for update…')
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[updater] Update available: ${info.version}`)
    send('update:available', { version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] App is up to date')
  })

  autoUpdater.on('download-progress', (progress) => {
    send('update:progress', { percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[updater] Update downloaded: ${info.version}`)
    send('update:downloaded', { version: info.version })
  })

  autoUpdater.on('error', (err) => {
    console.error('[updater] Error:', err.message)
    // Don't surface error to user — silent background updater
  })

  // Check after 3 s so the window has time to open first
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[updater] checkForUpdates failed:', err.message)
    })
  }, 3000)
}

/**
 * Called when the renderer asks to install the downloaded update.
 * Will quit the app and relaunch after installing.
 */
export function installUpdate() {
  autoUpdater.quitAndInstall(false, true)
}

function send(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}
