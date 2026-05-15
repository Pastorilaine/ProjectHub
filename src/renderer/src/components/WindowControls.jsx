import { useEffect, useState } from 'react'

export default function WindowControls() {
  const [maximized, setMaximized] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(true)

  useEffect(() => {
    let cleanup = () => {}
    let mounted = true

    const getWindowState = window.api?.getWindowState
    const onWindowStateChanged = window.api?.onWindowStateChanged

    if (typeof getWindowState !== 'function' || typeof onWindowStateChanged !== 'function') {
      console.error('[window-controls] Window control APIs are unavailable. Restart the app so preload and main-process changes are loaded.')
      return cleanup
    }

    getWindowState()
      .then((state) => {
        if (mounted) setMaximized(!!state?.maximized)
      })
      .catch((error) => {
        console.error('[window-controls] Failed to read current window state:', error)
      })

    window.api?.getSettings?.()
      .then((settings) => {
        if (mounted) setMinimizeToTray(settings?.minimizeToTray !== false)
      })
      .catch(() => {})

    cleanup = onWindowStateChanged((state) => {
      setMaximized(!!state?.maximized)
    })

    return () => {
      mounted = false
      cleanup()
    }
  }, [])

  const runWindowAction = async (methodName) => {
    const action = window.api?.[methodName]
    if (typeof action !== 'function') {
      console.error(`[window-controls] ${methodName} is unavailable. Restart the app so preload and main-process changes are loaded.`)
      return
    }

    try {
      await action()
    } catch (error) {
      console.error(`[window-controls] ${methodName} failed:`, error)
    }
  }

  return (
    <div className="window-controls-shell no-drag">
      <button
        type="button"
        className="window-control-button no-drag"
        title="Pienennä"
        aria-label="Pienennä ikkuna"
        onClick={() => runWindowAction('minimizeWindow')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      </button>

      <button
        type="button"
        className="window-control-button no-drag"
        title={maximized ? 'Palauta' : 'Suurenna'}
        aria-label={maximized ? 'Palauta ikkuna' : 'Suurenna ikkuna'}
        onClick={() => runWindowAction('toggleMaximizeWindow')}
      >
        {maximized ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h10v10H9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5h10v10" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth="2" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className="window-control-button window-control-button--danger no-drag"
        title={minimizeToTray ? 'Piilota ikkunaan lokeroon' : 'Sulje'}
        aria-label={minimizeToTray ? 'Piilota ikkuna lokeroon' : 'Sulje ikkuna'}
        onClick={() => runWindowAction('closeWindow')}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>
    </div>
  )
}
