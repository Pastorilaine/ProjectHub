/**
 * Auto-updater module.
 * Checks for updates on GitHub Releases, downloads in the background,
 * and notifies the renderer when ready to install.
 *
 * In dev mode this is a no-op unless DEV_UPDATER_ENABLED=true.
 * Requires: package.json → build.publish → { provider: "github", owner, repo }
 *
 * Logs are written to:
 *   %APPDATA%/projecthub/logs/main.log   (Windows)
 *   ~/Library/Logs/projecthub/main.log   (macOS)
 *   ~/.config/projecthub/logs/main.log   (Linux)
 */

import { autoUpdater } from 'electron-updater'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log'
import { is } from '@electron-toolkit/utils'

let mainWindow = null
let ready = false           // true once initAutoUpdater has run in a packaged app
let downloadedInfo = null   // cached info after `update-downloaded` fires
let installStarted = false  // true after the user clicks "Asenna"

// ── Configure logging ──────────────────────────────────────────────────────────
log.transports.file.level = 'info'
log.transports.console.level = 'info'
autoUpdater.logger = log

export function initAutoUpdater(win) {
  mainWindow = win

  const devOverride = process.env['DEV_UPDATER_ENABLED'] === 'true'

  log.info(`[updater] App version: ${app.getVersion()} | dev: ${is.dev} | override: ${devOverride}`)

  if (is.dev && !devOverride) {
    log.info('[updater] Dev mode — auto-updater disabled (set DEV_UPDATER_ENABLED=true to override)')
    return
  }

  if (devOverride) {
    autoUpdater.updateConfigPath = join(app.getAppPath(), '../../dev-app-update.yml')
    log.info('[updater] DEV_UPDATER_ENABLED — using dev-app-update.yml')
  }

  ready = true

  // We trigger the install manually via quitAndInstall(); don't double-fire on quit.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.disableWebInstaller = true
  // App is not code-signed — bypass the Windows Authenticode verification that
  // electron-updater runs against publisherName. Without this, the update fails
  // with "not digitally signed" even though the file downloaded correctly.
  autoUpdater.verifyUpdateCodeSignature = () => Promise.resolve(null)

  autoUpdater.on('checking-for-update', () => {
    log.info('[updater] Checking for update…')
    send('update:checking', {})
  })

  autoUpdater.on('update-available', (info) => {
    log.info(`[updater] Update available: ${info.version} (current: ${app.getVersion()})`)
    send('update:available', { version: info.version })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info(`[updater] App is up to date (latest on server: ${info?.version})`)
    send('update:notAvailable', {})
  })

  autoUpdater.on('download-progress', (progress) => {
    send('update:progress', { percent: Math.round(progress.percent) })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`[updater] Update downloaded: ${info.version} → ${info.downloadedFile}`)
    downloadedInfo = info
    send('update:downloaded', { version: info.version, file: info.downloadedFile })
  })

  autoUpdater.on('error', (err) => {
    const msg = err?.message || String(err)
    log.error('[updater] Error:', msg, err?.stack)
    // CRITICAL: if the user just clicked "install" and we hit an error,
    // route it to the install-error banner — NOT "up to date".
    if (installStarted) {
      send('update:installError', { message: msg })
      installStarted = false
    } else {
      send('update:error', { message: msg })
    }
  })

  // Check after 3 s so the window has time to open first
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('[updater] checkForUpdates failed:', err?.message)
    })
  }, 3000)
}

/**
 * Called when the renderer asks to install the downloaded update.
 * Will quit the app and relaunch after installing.
 *
 * @param {() => void} [prepareForQuit] – optional callback that cleans up
 *   resources (tray, watchers, …) right before quitAndInstall is invoked.
 */
export function installUpdate(prepareForQuit) {
  if (!ready) {
    log.warn('[updater] installUpdate called but updater not initialised')
    send('update:installError', { message: 'Päivittäjä ei ole alustettu (dev-tila?)' })
    return
  }

  if (!downloadedInfo) {
    log.warn('[updater] installUpdate called but no update has been downloaded yet')
    send('update:installError', { message: 'Päivitystä ei ole ladattu — odota latauksen valmistumista' })
    return
  }

  installStarted = true
  log.info(`[updater] Installing update ${downloadedInfo.version} from ${downloadedInfo.downloadedFile}`)

  // Defer one tick so the IPC reply is sent before we start quitting
  setImmediate(() => {
    try {
      if (typeof prepareForQuit === 'function') prepareForQuit()
      // isSilent=true → runs NSIS with /S flag, no installer wizard.
      // isForceRunAfter=true → relaunches the app after install completes.
      autoUpdater.quitAndInstall(true, true)
    } catch (err) {
      log.error('[updater] quitAndInstall failed:', err?.message, err?.stack)
      installStarted = false
      send('update:installError', { message: err?.message || 'Asennus epäonnistui' })
    }
  })
}

/**
 * Manually triggered update check (from the renderer's "Tarkista päivitykset" button).
 * No-op in dev mode.
 */
export function checkForUpdates() {
  if (!ready) {
    log.info('[updater] checkForUpdates called but updater not initialised (dev mode)')
    send('update:notAvailable', {})
    return
  }
  autoUpdater.checkForUpdates().catch((err) => {
    log.error('[updater] Manual check failed:', err?.message)
  })
}

function send(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}
