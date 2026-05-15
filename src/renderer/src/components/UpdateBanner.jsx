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

    const cleanInstallError = window.api.onUpdateInstallError?.((data) => {
      setInfo({ state: 'installError', message: data?.message })
      autoClose(10000)
    })

    const cleanError = window.api.onUpdateError?.((data) => {
      setInfo({ state: 'error', message: data?.message })
      autoClose(8000)
    })

    return () => {
      cleanChecking?.()
      cleanNotAvailable?.()
      cleanAvailable?.()
      cleanProgress?.()
      cleanDownloaded?.()
      cleanInstallError?.()
      cleanError?.()
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [])

  if (!info) return null

  return (
    <div
      className={`window-banner flex items-center justify-between px-4 py-2.5 text-sm flex-shrink-0 transition-colors ${
        info.state === 'notAvailable'
          ? 'bg-emerald-950/70 text-emerald-100'
          : info.state === 'installError' || info.state === 'error'
          ? 'bg-rose-950/70 text-rose-100'
          : 'bg-sky-950/75 text-sky-100'
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
            Uusi versio <strong>{info.version}</strong> saatavilla — ladataan taustalla…
          </span>
        )}

        {info.state === 'downloading' && (
          <>
            <span className="whitespace-nowrap">Ladataan… {info.percent}%</span>
            <div className="flex-1 max-w-52 rounded-full h-1.5 bg-white/10">
              <div
                className="h-1.5 rounded-full transition-all duration-500 bg-sky-300"
                style={{ width: `${info.percent}%` }}
              />
            </div>
          </>
        )}

        {info.state === 'downloaded' && (
          <>
            <span className="truncate">
              Versio <strong>{info.version}</strong> ladattu ja valmis asennettavaksi
            </span>
            <button
              onClick={() => window.api.installUpdate()}
              className="ml-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              Asenna &amp; käynnistä uudelleen
            </button>
          </>
        )}

        {info.state === 'installError' && (
          <span className="truncate">
            Asennus epäonnistui{info.message ? `: ${info.message}` : ''} — katso loki tai asenna manuaalisesti
          </span>
        )}

        {info.state === 'error' && (
          <span className="truncate">
            Päivitysvirhe{info.message ? `: ${info.message}` : ''}
          </span>
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
