import { useState, useEffect } from 'react'

/**
 * Banner that appears when a background auto-update is available/downloading/downloaded.
 * Listens to IPC events pushed from the main process via window.api.on* helpers.
 */
export default function UpdateBanner() {
  const [info, setInfo] = useState(null)
  // info: null | { state: 'available'|'downloading'|'downloaded', version, percent }

  useEffect(() => {
    if (!window.api?.onUpdateAvailable) return

    const cleanAvailable = window.api.onUpdateAvailable((data) => {
      setInfo({ state: 'available', version: data.version, percent: 0 })
    })

    const cleanProgress = window.api.onUpdateProgress((data) => {
      setInfo((prev) => (prev ? { ...prev, state: 'downloading', percent: data.percent } : null))
    })

    const cleanDownloaded = window.api.onUpdateDownloaded((data) => {
      setInfo({ state: 'downloaded', version: data.version, percent: 100 })
    })

    return () => {
      cleanAvailable?.()
      cleanProgress?.()
      cleanDownloaded?.()
    }
  }, [])

  if (!info) return null

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-blue-900/90 border-b border-blue-700/60 text-sm text-blue-100 flex-shrink-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {info.state === 'available' && (
          <span className="truncate">
            🔄 Uusi versio <strong>{info.version}</strong> saatavilla — ladataan taustalla…
          </span>
        )}

        {info.state === 'downloading' && (
          <>
            <span className="whitespace-nowrap">⬇️ Ladataan… {info.percent}%</span>
            <div className="flex-1 max-w-48 bg-blue-950 rounded-full h-1.5">
              <div
                className="bg-blue-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${info.percent}%` }}
              />
            </div>
          </>
        )}

        {info.state === 'downloaded' && (
          <>
            <span className="truncate">
              ✅ Versio <strong>{info.version}</strong> ladattu ja valmis asennettavaksi
            </span>
            <button
              onClick={() => window.api.installUpdate()}
              className="ml-2 px-3 py-0.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium rounded transition-colors whitespace-nowrap"
            >
              Asenna &amp; käynnistä uudelleen
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => setInfo(null)}
        className="ml-4 text-blue-400 hover:text-blue-200 text-lg leading-none flex-shrink-0"
        title="Sulje ilmoitus"
      >
        ×
      </button>
    </div>
  )
}
