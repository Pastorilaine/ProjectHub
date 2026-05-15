import { useEffect, useState } from 'react'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-blue-500' : 'bg-slate-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({ label, description, children, last }) {
  return (
    <div className={`flex items-start justify-between gap-6 py-4 ${last ? '' : 'border-b border-white/10'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-100">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function SectionCard({ title, description, children }) {
  return (
    <section className="surface-panel p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export default function SettingsPage({
  onBack,
  settings,
  workspaces,
  activeWorkspaceId,
  onSaveSettings,
  onCreateWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onSetActiveWorkspace
}) {
  const [draftSettings, setDraftSettings] = useState(settings)
  const [appNameDraft, setAppNameDraft] = useState(settings?.appName || 'ProjectHub')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [version, setVersion] = useState('')
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceBusyId, setWorkspaceBusyId] = useState('')
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)

  useEffect(() => {
    setDraftSettings(settings)
    setAppNameDraft(settings?.appName || 'ProjectHub')
  }, [settings])

  useEffect(() => {
    window.api?.getAppVersion?.().then(setVersion).catch(() => {})
  }, [])

  const update = async (key, value) => {
    const optimistic = { ...draftSettings, [key]: value }
    setDraftSettings(optimistic)
    setSaving(true)
    try {
      const saved = await onSaveSettings?.({ [key]: value })
      if (saved) setDraftSettings(saved)
      setSavedAt(Date.now())
    } catch (err) {
      setDraftSettings(settings)
      console.error('[settings] save failed', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateWorkspace = async () => {
    const name = newWorkspaceName.trim()
    if (!name) {
      setWorkspaceError('Anna uudelle workspacelle nimi.')
      return
    }

    setWorkspaceError('')
    setCreatingWorkspace(true)

    try {
      await onCreateWorkspace?.(name)
      setNewWorkspaceName('')
    } catch (err) {
      setWorkspaceError(err?.message || 'Workspacen luonti epäonnistui.')
    } finally {
      setCreatingWorkspace(false)
    }
  }

  const handleSaveAppName = async () => {
    const trimmed = appNameDraft.trim()
    if (!trimmed) {
      setWorkspaceError('Anna sovellukselle nimi.')
      return
    }

    setWorkspaceError('')
    setSaving(true)
    try {
      const saved = await onSaveSettings?.({ appName: trimmed })
      if (saved) setDraftSettings(saved)
      setSavedAt(Date.now())
    } catch (err) {
      setWorkspaceError(err?.message || 'Sovelluksen nimen tallennus epäonnistui.')
    } finally {
      setSaving(false)
    }
  }

  const handleRenameWorkspace = async (id, name) => {
    setWorkspaceError('')
    setWorkspaceBusyId(id)
    try {
      await onRenameWorkspace?.(id, name)
    } catch (err) {
      setWorkspaceError(err?.message || 'Workspacen nimeäminen epäonnistui.')
    } finally {
      setWorkspaceBusyId('')
    }
  }

  const handleActivateWorkspace = async (id) => {
    setWorkspaceError('')
    setWorkspaceBusyId(id)
    try {
      await onSetActiveWorkspace?.(id)
    } catch (err) {
      setWorkspaceError(err?.message || 'Workspacen vaihto epäonnistui.')
    } finally {
      setWorkspaceBusyId('')
    }
  }

  const handleDeleteWorkspace = async (id) => {
    setWorkspaceError('')
    setWorkspaceBusyId(id)
    try {
      await onDeleteWorkspace?.(id)
    } catch (err) {
      setWorkspaceError(err?.message || 'Workspacen poisto epäonnistui.')
    } finally {
      setWorkspaceBusyId('')
    }
  }

  if (!draftSettings) {
    return (
      <div className="page-shell items-center justify-center text-slate-400">
        <div className="surface-card px-5 py-4">Ladataan asetuksia…</div>
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
    <div className="page-shell">
      <div className="page-header drag-region">
        <div className="page-header-row">
          <div className="page-header-main no-drag">
            <button onClick={onBack} className="secondary-button px-3 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Takaisin
            </button>
            <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #0F766E 0%, #0EA5E9 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="page-header-copy">
              <div className="page-eyebrow">Settings</div>
              <h1 className="page-title">Asetukset</h1>
              <p className="page-subtitle">Säädä käynnistystä, ilmoituksia ja päivityskäyttäytymistä.</p>
            </div>
          </div>
          <div className="page-actions no-drag">
            {saving && <span className="text-xs text-slate-500">Tallennetaan…</span>}
            {!saving && savedAt && <span className="text-xs text-emerald-400">Tallennettu</span>}
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-content-inner">
          <div className="page-content-narrow space-y-5">
            <SectionCard title="Workspacet" description="Jokaisella workspacella on oma paikallinen SQLite-tietokanta. Näin eri asiakkaiden tai tiimien työt pysyvät erillään.">
              {workspaceError && (
                <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {workspaceError}
                </div>
              )}

              <div className="surface-card mb-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Sovelluksen nimi</label>
                    <input
                      value={appNameDraft}
                      onChange={(e) => setAppNameDraft(e.target.value)}
                      placeholder="Esim. Studio Hub"
                      className="input-shell w-full px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveAppName}
                    disabled={saving || !appNameDraft.trim() || appNameDraft.trim() === (settings?.appName || 'ProjectHub')}
                    className="secondary-button disabled:opacity-50"
                  >
                    Tallenna nimi
                  </button>
                </div>
              </div>

              <div className="surface-card mb-4 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Uusi workspace</label>
                    <input
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      placeholder="Esim. Asiakas A tai Oma yritys"
                      className="input-shell w-full px-3 py-2.5 text-sm outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creatingWorkspace || !newWorkspaceName.trim()}
                    className="primary-button md:self-end disabled:opacity-50"
                  >
                    {creatingWorkspace ? 'Luodaan…' : 'Luo workspace'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {workspaces.map((workspace) => (
                  <WorkspaceRow
                    key={workspace.id}
                    workspace={workspace}
                    isActive={workspace.id === activeWorkspaceId}
                    canDelete={workspaces.length > 1 && workspace.id !== activeWorkspaceId}
                    busy={workspaceBusyId === workspace.id}
                    onRename={handleRenameWorkspace}
                    onActivate={handleActivateWorkspace}
                    onDelete={handleDeleteWorkspace}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Yleiset" description="Perusasetukset siihen, miten ProjectHub käynnistyy ja käyttäytyy suljettaessa.">
              <SettingRow
                label="Käynnistä Windowsin käynnistyksen yhteydessä"
                description="ProjectHub avautuu automaattisesti kun kirjaudut sisään."
              >
                <Toggle
                  checked={!!draftSettings.launchAtStartup}
                  onChange={(v) => update('launchAtStartup', v)}
                />
              </SettingRow>

              <SettingRow
                label="Minimoi lokeroalueelle sulkiessa"
                description="Sulkupainike piilottaa ikkunan eikä lopeta sovellusta. Avaa uudelleen kuvakkeesta."
                last
              >
                <Toggle
                  checked={draftSettings.minimizeToTray !== false}
                  onChange={(v) => update('minimizeToTray', v)}
                />
              </SettingRow>
            </SectionCard>

            <SectionCard title="Ilmoitukset" description="Deadline-muistutukset ja niiden ennakkoaika.">
              <SettingRow
                label="Näytä määräaikamuistutukset"
                description="Sovellus ilmoittaa lähestyvistä ja ylimenneistä tehtävien määräajoista."
              >
                <Toggle
                  checked={!!draftSettings.deadlineNotifications}
                  onChange={(v) => update('deadlineNotifications', v)}
                />
              </SettingRow>

              <SettingRow
                label="Muistuta ennen määräaikaa"
                description="Kuinka kauan ennen määräaikaa ilmoitus näytetään."
                last
              >
                <select
                  value={draftSettings.notificationAdvanceHours ?? 24}
                  disabled={!draftSettings.deadlineNotifications}
                  onChange={(e) => update('notificationAdvanceHours', Number(e.target.value))}
                  className="input-shell rounded-xl px-3 py-2 text-sm focus:outline-none [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {ADVANCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </SettingRow>
            </SectionCard>

            <SectionCard title="Tietoja sovelluksesta" description="Versiotiedot ja päivityksiin liittyvät toiminnot.">
              <SettingRow label="Versio">
                <span className="text-sm text-slate-300 font-mono">{version ? `v${version}` : '—'}</span>
              </SettingRow>

              <SettingRow
                label="Tarkista päivitykset"
                description="Sovellus tarkistaa automaattisesti käynnistyksen yhteydessä."
              >
                <button onClick={() => window.api?.checkForUpdates?.()} className="secondary-button text-sm">
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

              <SettingRow label="Kehittäjä" last>
                <span className="text-sm text-slate-500">IT-Veljekset Group</span>
              </SettingRow>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceRow({ workspace, isActive, canDelete, busy, onRename, onActivate, onDelete }) {
  const [draftName, setDraftName] = useState(workspace.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setDraftName(workspace.name)
    setConfirmDelete(false)
  }, [workspace.name])

  const changed = draftName.trim() && draftName.trim() !== workspace.name

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{workspace.name}</p>
          <p className="text-xs text-slate-500 mt-1">
            {isActive ? 'Aktiivinen workspace tällä hetkellä.' : 'Erillinen työtila omalla paikallisella datalla.'}
          </p>
        </div>
        <span className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}>
          {isActive ? 'Aktiivinen' : 'Workspace'}
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          className="input-shell flex-1 px-3 py-2.5 text-sm outline-none"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRename(workspace.id, draftName.trim())}
            disabled={!changed || busy}
            className="secondary-button disabled:opacity-50"
          >
            {busy ? 'Tallennetaan…' : 'Tallenna'}
          </button>

          <button
            onClick={() => onActivate(workspace.id)}
            disabled={isActive || busy}
            className="secondary-button disabled:opacity-50"
          >
            Avaa
          </button>

          <button
            onClick={() => {
              if (confirmDelete) {
                onDelete(workspace.id)
              } else {
                setConfirmDelete(true)
              }
            }}
            disabled={!canDelete || busy}
            className={`secondary-button disabled:opacity-40 ${confirmDelete ? 'border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 hover:text-rose-100' : ''}`}
          >
            {confirmDelete ? 'Vahvista poisto' : 'Poista'}
          </button>
        </div>
      </div>
    </div>
  )
}
