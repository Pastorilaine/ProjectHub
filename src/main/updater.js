/**
 * Auto-updater module.
 * Checks for updates on GitHub Releases, downloads in the background,
 * and notifies the renderer when ready to install.
 *
 * In dev mode this is a no-op.
 * Requires: package.json → build.publish → { provider: "github", owner, repo }
 */

import { autoUpdater } from 'electron-updater'
import { app } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let mainWindow = null
let ready = false  // true once initAutoUpdater has run in a packaged app

export function initAutoUpdater(win) {
  mainWindow = win

  const devOverride = process.env['DEV_UPDATER_ENABLED'] === 'true'

  if (is.dev && !devOverride) {
    console.log('[updater] Dev mode — auto-updater disabled (set DEV_UPDATER_ENABLED=true to override)')
    return
  }

  if (devOverride) {
    // Point at the local yaml so the full fetch/download chain can be tested
    // without a packaged build. Must be run via `npm run preview`.
    autoUpdater.updateConfigPath = join(app.getAppPath(), '../../dev-app-update.yml')
    console.log('[updater] DEV_UPDATER_ENABLED — using dev-app-update.yml')
  }

  ready = true

  // Download silently in the background; don't show the default dialog
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  // Prevent the web-based delta-installer path — we use the full NSIS installer
  autoUpdater.disableWebInstaller = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] Checking for update…')
    send('update:checking', {})
  })

  autoUpdater.on('update-available', (info) => {
    console.log(`[updater] Update available: ${info.version}`)
    send('update:available', { version: info.version })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] App is up to date')
    send('update:notAvailable', {})
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
    // Dismiss the "checking" banner — without this the spinner loops forever
    send('update:notAvailable', {})
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
  // Defer one tick so the IPC reply is sent before we start quitting
  setImmediate(() => {
    try {
      // isSilent=true  → runs NSIS with /S flag, no wizard dialog
      // isForceRunAfter=true → relaunches the app after install completes
      autoUpdater.quitAndInstall(true, true)
    } catch (err) {
      console.error('[updater] quitAndInstall failed:', err.message)
      // Fallback: autoInstallOnAppQuit=true will pick up the cached download
      send('update:installError', { message: err.message })
      app.quit()
    }
  })
}

/**
 * Manually triggered update check (from the renderer's "Tarkista päivitykset" button).
 * No-op in dev mode.
 */
export function checkForUpdates() {
  if (!ready) {
    console.log('[updater] checkForUpdates called but updater not initialised (dev mode)')
    return
  }
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] Manual check failed:', err.message)
  })
}

function send(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}
