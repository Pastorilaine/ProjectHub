import { useState, useEffect, useRef } from 'react'

/**
 * Banner that appears when a background auto-update is available/downloading/downloaded.
 * Also handles the manual "Tarkista päivitykset" flow triggered from the Sidebar.
 * State machine: null → checking → notAvailable (auto-clears) | available → downloading → downloaded
 */
export default function UpdateBanner() {
  const [info, setInfo] = useState(null)
  const clearTimer = useRef(null)

  // Auto-clear transient states after a timeout
  const autoClose = (ms = 4000) => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setInfo(null), ms)
  }

  useEffect(() => {
    if (!window.api?.onUpdateAvailable) return

    const cleanChecking = window.api.onUpdateChecking?.(() => {
      setInfo({ state: 'checking' })
      // Safety net: if no response in 12 s, dismiss the spinner
      autoClose(12000)
    })

    const cleanNotAvailable = window.api.onUpdateNotAvailable?.(() => {
      setInfo({ state: 'notAvailable' })
      autoClose(3000)
    })

    const cleanAvailable = window.api.onUpdateAvailable((data) => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
      setInfo({ state: 'available', version: data.version, percent: 0 })
    })

    const cleanProgress = window.api.onUpdateProgress((data) => {
      setInfo((prev) => {
        if (!prev || prev.state === 'downloaded') return prev
        return { ...prev, state: 'downloading', percent: data.percent }
      })
    })

    const cleanDownloaded = window.api.onUpdateDownloaded((data) => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
      setInfo({ state: 'downloaded', version: data.version, percent: 100 })
    })

    return () => {
      cleanChecking?.()
      cleanNotAvailable?.()
      cleanAvailable?.()
      cleanProgress?.()
      cleanDownloaded?.()
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [])

  if (!info) return null

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 border-b text-sm flex-shrink-0 transition-colors ${
        info.state === 'notAvailable'
          ? 'bg-green-900/70 border-green-700/60 text-green-100'
          : 'bg-blue-900/90 border-blue-700/60 text-blue-100'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {info.state === 'checking' && (
          <span className="flex items-center gap-2 truncate">
            <span className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
            Tarkistetaan päivityksiä…
          </span>
        )}

        {info.state === 'notAvailable' && (
          <span className="truncate">✓ Sovellus on ajan tasalla</span>
        )}

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
        onClick={() => {
          if (clearTimer.current) clearTimeout(clearTimer.current)
          setInfo(null)
        }}
        className="ml-4 text-lg leading-none flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        title="Sulje"
      >
        ×
      </button>
    </div>
  )
}
