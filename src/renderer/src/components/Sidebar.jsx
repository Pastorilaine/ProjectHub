import { useState, useEffect } from 'react'

export default function Sidebar({
  projects,
  workspaces,
  activeWorkspace,
  selectedProject,
  onSelectProject,
  onGoHome,
  onOpenProjects,
  onOpenSearch,
  onNewProject,
  onOpenSettings,
  onOpenIdeas,
  onSwitchWorkspace,
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
      setTimeout(() => setChecking(false), 3000)
    }
  }

  return (
    <aside className="sidebar-shell flex flex-col h-full">
      <div className="drag-region sidebar-brand flex-shrink-0">
        <div className="no-drag flex items-center gap-3 cursor-pointer group min-w-0" onClick={onGoHome}>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 14px 32px rgba(37,99,235,0.24)' }}
          >
            PH
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.24em] uppercase text-slate-600">Desktop app</p>
            <span className="font-semibold text-[15px] text-white tracking-tight">ProjectHub</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={onOpenSearch}
          className="no-drag surface-card surface-card-hover w-full flex items-center gap-3 px-3.5 py-3 text-sm text-slate-400 hover:text-white transition-all"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="flex-1 text-left">Haku</span>
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-mono text-slate-500">⌘K</kbd>
        </button>
      </div>

      <div className="px-4 pt-4 no-drag">
        <div className="grid grid-cols-2 gap-2">
          <MiniSidebarStat label="Aktiiviset" value={active.length} tone="blue" />
          <MiniSidebarStat label="Arkistoidut" value={archived.length} />
        </div>
      </div>

      <nav className="no-drag flex-1 overflow-y-auto px-3 pt-5 pb-3">
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

        <div className="mt-6 mb-2 px-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenProjects}
              className={`section-label transition-colors ${
                activeView === 'projects' ? 'text-blue-300' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              Projektit
            </button>
            <button
              onClick={onNewProject}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 transition-colors border border-white/10 bg-white/5 hover:bg-white/10"
              title="Uusi projekti"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {active.length === 0 && (
          <p className="text-xs text-slate-600 px-2 py-2 italic">Ei projekteja vielä</p>
        )}

        <div className="mt-1 space-y-1">
          {active.map((project) => (
            <SidebarProjectItem
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id && activeView === 'project-detail'}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>

        {archived.length > 0 && (
          <div className="mt-5">
            <div className="px-2 mb-2">
              <span className="section-label text-slate-700">Arkisto</span>
            </div>
            <div className="space-y-1">
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

      <div className="no-drag px-4 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="sidebar-footer-panel p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-600">Workspace</p>
              <p className="text-sm font-medium text-slate-200 truncate mt-1">{activeWorkspace?.name || 'Ei workspacea'}</p>
              <p className="text-xs text-slate-500 mt-1">
                {Array.isArray(workspaces) ? `${workspaces.length} ${workspaces.length === 1 ? 'workspace' : 'workspacea'}` : '0 workspacea'}
                {version ? ` · v${version}` : ''}
              </p>
            </div>
            <button
              onClick={onOpenSettings}
              title="Asetukset"
              className={`p-2 rounded-xl transition-all border ${
                activeView === 'settings'
                  ? 'text-blue-300 bg-blue-500/10 border-blue-400/20'
                  : 'text-slate-500 hover:text-slate-200 border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {Array.isArray(workspaces) && workspaces.length > 0 && (
            <div className="mt-3 space-y-2">
              {workspaces.map((workspace) => {
                const isActiveWorkspace = workspace.id === activeWorkspace?.id

                return (
                  <button
                    key={workspace.id}
                    onClick={() => {
                      if (!isActiveWorkspace) onSwitchWorkspace?.(workspace.id)
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all border ${
                      isActiveWorkspace
                        ? 'bg-blue-500/10 border-blue-400/20 text-blue-100'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{workspace.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActiveWorkspace ? 'bg-blue-400/15 text-blue-200' : 'bg-white/5 text-slate-500'
                    }`}>
                      {isActiveWorkspace ? 'Aktiivinen' : 'Vaihda'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-white/10 bg-white/5 hover:bg-white/10"
          >
            {checking ? (
              <span className="w-3.5 h-3.5 rounded-full border border-slate-400 border-t-transparent animate-spin flex-shrink-0" />
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {checking ? 'Tarkistetaan…' : 'Tarkista päivitykset'}
          </button>
        </div>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all group relative border ${
        active
          ? 'text-white'
          : 'text-slate-400 hover:text-slate-100'
      }`}
      style={active
        ? {
            background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(124,58,237,0.14) 100%)',
            border: '1px solid rgba(96,165,250,0.22)',
            boxShadow: '0 12px 24px rgba(37,99,235,0.12)'
          }
        : {
            border: '1px solid transparent'
          }}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0 transition-colors ${
          active ? 'text-blue-200' : 'text-slate-500 group-hover:text-slate-200'
        }`}
        style={active ? { background: 'rgba(255,255,255,0.08)' } : { background: 'rgba(255,255,255,0.04)' }}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}

function MiniSidebarStat({ label, value, tone }) {
  return (
    <div
      className="surface-card px-3 py-2.5"
      style={tone === 'blue' ? { borderColor: 'rgba(96,165,250,0.18)' } : {}}
    >
      <div className={`text-base font-semibold tabular-nums ${tone === 'blue' ? 'text-blue-300' : 'text-slate-200'}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

function SidebarProjectItem({ project, isSelected, onClick, muted }) {
  const total = project.task_count || 0
  const done = project.done_count || 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all group relative border ${
        isSelected
          ? 'text-white'
          : muted
          ? 'text-slate-600 hover:text-slate-300'
          : 'text-slate-400 hover:text-slate-100'
      }`}
      style={isSelected
        ? {
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 12px 24px rgba(2,6,23,0.18)'
          }
        : {
            border: '1px solid transparent'
          }}
    >
      {isSelected && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ backgroundColor: project.color || '#3B82F6' }} />
      )}
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: project.color || '#3B82F6', opacity: muted ? 0.4 : 1 }}
      />
      <span className="truncate flex-1">{project.name}</span>
      {total > 0 && (
        <span className={`text-[11px] flex-shrink-0 tabular-nums px-2 py-0.5 rounded-full ${isSelected ? 'text-slate-300 bg-white/10' : 'text-slate-500 bg-white/5 group-hover:text-slate-300'}`}>
          {`${done}/${total}`}
        </span>
      )}
    </button>
  )
}
