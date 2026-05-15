import { useState } from 'react'

export default function FirstRunSetup({ initialAppName, onComplete, busy }) {
  const [appName, setAppName] = useState(initialAppName || 'ProjectHub')
  const [workspaceName, setWorkspaceName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedAppName = appName.trim()
    const trimmedWorkspaceName = workspaceName.trim()

    if (!trimmedAppName) {
      setError('Anna sovellukselle nimi.')
      return
    }

    if (!trimmedWorkspaceName) {
      setError('Anna ensimmäiselle workspacelle nimi.')
      return
    }

    setError('')

    try {
      await onComplete({ appName: trimmedAppName, workspaceName: trimmedWorkspaceName })
    } catch (err) {
      setError(err?.message || 'Alustuksen tallennus epäonnistui.')
    }
  }

  return (
    <div className="first-run-shell drag-region">
      <div className="first-run-card surface-panel no-drag">
        <div className="page-eyebrow">First launch</div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Aloitetaan ProjectHubin käyttöönotto</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Määritä ensin sovelluksen näkyvä nimi ja luo ensimmäinen workspace. Voit lisätä myöhemmin lisää workspaceja eri asiakkaille tai tiimeille.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sovelluksen nimi</label>
            <input
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              placeholder="Esim. Studio Hub"
              className="input-shell mt-2 w-full px-4 py-3 text-sm outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Ensimmäinen workspace</label>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Esim. Oma yritys tai Asiakas A"
              className="input-shell mt-2 w-full px-4 py-3 text-sm outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-400">
            Jokainen workspace saa oman paikallisen tietokantansa. Näin eri asiakkaiden projektit, tehtävät ja ideat pysyvät erillään.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="primary-button w-full justify-center disabled:opacity-60"
          >
            {busy ? 'Tallennetaan…' : 'Aloita käyttö'}
          </button>
        </form>
      </div>
    </div>
  )
}
