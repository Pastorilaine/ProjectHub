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
  onOpenIdeas,
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
    <aside className="w-60 flex-shrink-0 flex flex-col h-full" style={{ background: '#060A12', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* App title — also acts as drag region for the frameless window */}
      <div className="drag-region h-12 px-4 flex items-center gap-2.5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="no-drag flex items-center gap-2.5 cursor-pointer" onClick={onGoHome}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
            P
          </div>
          <span className="font-semibold text-sm text-white tracking-tight">ProjectHub</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <button
          onClick={onOpenSearch}
          className="no-drag w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-xs transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 text-left">Haku</span>
          <kbd className="text-slate-700 text-xs font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="no-drag flex-1 overflow-y-auto px-2 pt-4 pb-2">
        {/* Dashboard */}
        <NavItem
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          label="Yleiskatsaus"
          active={activeView === 'dashboard'}
          onClick={onGoHome}
        />

        {/* Idea library */}
        <NavItem
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          label="Ideakirjasto"
          active={activeView === 'ideas'}
          onClick={onOpenIdeas}
        />

        {/* Projects section */}
        <div className="mt-5 mb-1 px-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenProjects}
              className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                activeView === 'projects' ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              Projektit
            </button>
            <button
              onClick={onNewProject}
              className="w-5 h-5 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-300 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}
              title="Uusi projekti"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {active.length === 0 && (
          <p className="text-xs text-slate-700 px-2 py-1.5 italic">Ei projekteja vielä</p>
        )}

        <div className="mt-1 space-y-0.5">
          {active.map((project) => (
            <SidebarProjectItem
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id && activeView === 'project-detail'}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>

        {/* Archived */}
        {archived.length > 0 && (
          <div className="mt-5">
            <div className="px-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-700">Arkisto</span>
            </div>
            <div className="space-y-0.5">
              {archived.map((project) => (
                <SidebarProjectItem
                  key={project.id}
                  project={project}
                  isSelected={selectedProject?.id === project.id && activeView === 'project-detail'}
                  onClick={() => onSelectProject(project)}
                  muted
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="no-drag px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">IT-Veljekset Group</p>
            {version && <p className="text-xs text-slate-700">v{version}</p>}
          </div>
          <button
            onClick={onOpenSettings}
            title="Asetukset"
            className={`p-1.5 rounded-lg transition-all ${
              activeView === 'settings'
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
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
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-white/5"
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

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs font-medium transition-all group relative ${
        active
          ? 'text-white'
          : 'text-slate-500 hover:text-slate-200'
      }`}
      style={active ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' } : {}}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-blue-400" />
      )}
      <span className={`flex-shrink-0 transition-colors ${active ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  )
}

function SidebarProjectItem({ project, isSelected, onClick, muted }) {
  const total = project.task_count || 0
  const done = project.done_count || 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs transition-all group relative ${
        isSelected
          ? 'text-white'
          : muted
          ? 'text-slate-700 hover:text-slate-400'
          : 'text-slate-400 hover:text-slate-200'
      }`}
      style={isSelected ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
    >
      {isSelected && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3.5 rounded-r-full" style={{ backgroundColor: project.color || '#3B82F6' }} />
      )}
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color || '#3B82F6', opacity: muted ? 0.4 : 1 }}
      />
      <span className="truncate flex-1">{project.name}</span>
      {total > 0 && (
        <span className={`text-xs flex-shrink-0 tabular-nums ${isSelected ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-600'}`}>
          {`${done}/${total}`}
        </span>
      )}
    </button>
  )
}
