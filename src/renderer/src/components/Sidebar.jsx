import { useState, useEffect } from 'react'

export default function Sidebar({
  projects,
  selectedProject,
  onSelectProject,
  onGoHome,
  onOpenProjects,
  onOpenSearch,
  onNewProject,
  onOpenSettings,
  activeView
}) {
  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status !== 'active')
  const [version, setVersion] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    window.api?.getAppVersion?.().then((v) => setVersion(v)).catch(() => {})
  }, [])

  const handleCheckUpdate = async () => {
    if (checking) return
    setChecking(true)
    try {
      await window.api?.checkForUpdates?.()
    } finally {
      // The UpdateBanner takes over from here via IPC events; reset button after delay
      setTimeout(() => setChecking(false), 3000)
    }
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col h-full">
      {/* App title */}
      <div
        className="drag-region px-4 py-4 border-b border-slate-800 flex items-center gap-2 cursor-pointer select-none no-drag"
        onClick={onGoHome}
      >
        <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
          P
        </div>
        <span className="font-semibold text-sm text-white">ProjectHub</span>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs transition-colors no-drag"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Haku</span>
          <kbd className="ml-auto text-slate-600 text-xs">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 space-y-4">
        {/* Dashboard */}
        <button
          onClick={onGoHome}
          className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
            activeView === 'dashboard'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Yleiskatsaus
        </button>

        {/* Active projects */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onOpenProjects}
              className={`text-xs font-medium uppercase tracking-wider transition-colors ${
                activeView === 'projects'
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Projektit
            </button>
            <button
              onClick={onNewProject}
              className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Uusi projekti"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {active.length === 0 && (
            <p className="text-xs text-slate-600 px-2 py-1">Ei projekteja</p>
          )}

          {active.map((project) => (
            <SidebarProjectItem
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>

        {/* Archived projects */}
        {archived.length > 0 && (
          <div>
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider block mb-1">
              Arkisto
            </span>
            {archived.map((project) => (
              <SidebarProjectItem
                key={project.id}
                project={project}
                isSelected={selectedProject?.id === project.id}
                onClick={() => onSelectProject(project)}
                muted
              />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-600 flex-1">IT-Veljekset Group</span>
          {version && <span className="text-xs text-slate-700">v{version}</span>}
          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Asetukset"
            className={`p-1 rounded transition-colors ${
              activeView === 'settings'
                ? 'text-blue-400 bg-slate-800'
                : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleCheckUpdate}
          disabled={checking}
          className="w-full flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {checking ? (
            <span className="w-3 h-3 rounded-full border border-slate-500 border-t-transparent animate-spin flex-shrink-0" />
          ) : (
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          {checking ? 'Tarkistetaan…' : 'Tarkista päivitykset'}
        </button>
      </div>
    </aside>
  )
}

function SidebarProjectItem({ project, isSelected, onClick, muted }) {
  const total = project.task_count || 0
  const done = project.done_count || 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors mb-0.5 group ${
        isSelected
          ? 'bg-slate-700 text-white'
          : muted
          ? 'text-slate-600 hover:bg-slate-800 hover:text-slate-400'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color || '#3B82F6' }}
      />
      <span className="truncate flex-1">{project.name}</span>
      {total > 0 && (
        <span className="text-slate-600 text-xs flex-shrink-0 group-hover:text-slate-500">
          {done}/{total}
        </span>
      )}
    </button>
  )
}
