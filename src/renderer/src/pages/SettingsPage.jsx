import { useState, useEffect } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none
        ${checked ? 'bg-blue-500' : 'bg-slate-600'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0
          transition duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2
        className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {title}
      </h2>
      <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>{children}</div>
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage({ onBack }) {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.api?.getSettings?.().then(setSettings).catch(() => setSettings({}))
    window.api?.getAppVersion?.().then(setVersion).catch(() => {})
  }, [])

  const update = async (key, value) => {
    const optimistic = { ...settings, [key]: value }
    setSettings(optimistic)
    setSaving(true)
    try {
      const saved = await window.api?.saveSettings({ [key]: value })
      if (saved) setSettings(saved)
      setSavedAt(Date.now())
    } catch (err) {
      console.error('[settings] save failed', err)
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Ladataan asetuksia…
      </div>
    )
  }

  const ADVANCE_OPTIONS = [
    { label: '6 tuntia', value: 6 },
    { label: '12 tuntia', value: 12 },
    { label: '24 tuntia', value: 24 },
    { label: '48 tuntia', value: 48 },
    { label: '3 päivää', value: 72 },
    { label: 'Viikko', value: 168 }
  ]

  return (
    <div className="flex flex-col h-full" style={{ background: '#0A0F1C' }}>
      {/* Header — drag region */}
      <div
        className="flex-shrink-0 px-8 py-4 flex items-center gap-3 drag-region"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', paddingRight: '154px' }}
      >
        <div className="no-drag flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors flex-shrink-0"
            title="Takaisin"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-100">Asetukset</h1>
          {saving && <span className="text-xs text-slate-500 ml-auto">Tallennetaan…</span>}
          {!saving && savedAt && (
            <span className="text-xs text-slate-600 ml-auto">Tallennettu ✓</span>
          )}
        </div>
      </div>

      {/* Scrollable settings content */}
      <div className="flex-1 overflow-y-auto">
      <div className="p-8 max-w-2xl">

      {/* ── Yleiset ─────────────────────────────────────────────────────────── */}
      <Section title="Yleiset">
        <SettingRow
          label="Käynnistä Windowsin käynnistyksen yhteydessä"
          description="ProjectHub avautuu automaattisesti kun kirjaudut sisään."
        >
          <Toggle
            checked={!!settings.launchAtStartup}
            onChange={(v) => update('launchAtStartup', v)}
          />
        </SettingRow>

        <SettingRow
          label="Minimoi lokeroalueelle sulkiessa"
          description="Sulkupainike piilottaa ikkunan eikä lopeta sovellusta. Avaa uudelleen kuvakkeesta."
        >
          <Toggle
            checked={settings.minimizeToTray !== false}
            onChange={(v) => update('minimizeToTray', v)}
          />
        </SettingRow>
      </Section>

      {/* ── Ilmoitukset ─────────────────────────────────────────────────────── */}
      <Section title="Ilmoitukset">
        <SettingRow
          label="Näytä määräaikamuistutukset"
          description="Sovellus ilmoittaa lähestyvistä ja ylimenneistä tehtävien määräajoista."
        >
          <Toggle
            checked={!!settings.deadlineNotifications}
            onChange={(v) => update('deadlineNotifications', v)}
          />
        </SettingRow>

        <SettingRow
          label="Muistuta ennen määräaikaa"
          description="Kuinka kauan ennen määräaikaa ilmoitus näytetään."
        >
          <select
            value={settings.notificationAdvanceHours ?? 24}
            disabled={!settings.deadlineNotifications}
            onChange={(e) => update('notificationAdvanceHours', Number(e.target.value))}
            className="rounded-lg px-3 py-1.5 text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {ADVANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* ── Tietoja sovelluksesta ────────────────────────────────────────────── */}
      <Section title="Tietoja sovelluksesta">
        <SettingRow label="Versio">
          <span className="text-sm text-slate-400 font-mono">{version ? `v${version}` : '—'}</span>
        </SettingRow>

        <SettingRow
          label="Tarkista päivitykset"
          description="Sovellus tarkistaa automaattisesti käynnistyksen yhteydessä."
        >
          <button
            onClick={() => window.api?.checkForUpdates?.()}
            className="px-3 py-1.5 text-slate-200 text-sm rounded-lg transition-colors hover:text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Tarkista nyt
          </button>
        </SettingRow>

        <SettingRow label="Lähdekoodi">
          <a
            href="https://github.com/Pastorilaine/ProjectHub"
            onClick={(e) => {
              e.preventDefault()
              window.open('https://github.com/Pastorilaine/ProjectHub')
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            GitHub →
          </a>
        </SettingRow>

        <SettingRow label="Kehittäjä">
          <span className="text-sm text-slate-500">IT-Veljekset Group</span>
        </SettingRow>
      </Section>
      </div>
      </div>
    </div>
  )
}
