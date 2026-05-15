import { useEffect, useState } from 'react'

export default function WindowControls() {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    let cleanup = () => {}

    window.api?.getWindowState?.()
      .then((state) => setMaximized(!!state?.maximized))
      .catch(() => {})

    cleanup = window.api?.onWindowStateChanged?.((state) => {
      setMaximized(!!state?.maximized)
    }) || (() => {})

    return cleanup
  }, [])

  return (
    <div className="window-controls-shell no-drag">
      <button
        type="button"
        className="window-control-button"
        title="Pienennä"
        aria-label="Pienennä ikkuna"
        onClick={() => window.api?.minimizeWindow?.()}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      </button>

      <button
        type="button"
        className="window-control-button"
        title={maximized ? 'Palauta' : 'Suurenna'}
        aria-label={maximized ? 'Palauta ikkuna' : 'Suurenna ikkuna'}
        onClick={() => window.api?.toggleMaximizeWindow?.()}
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
        className="window-control-button window-control-button--danger"
        title="Sulje"
        aria-label="Sulje ikkuna"
        onClick={() => window.api?.closeWindow?.()}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M18 6l-12 12" />
        </svg>
      </button>
    </div>
  )
}
