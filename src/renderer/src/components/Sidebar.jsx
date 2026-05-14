export default function Sidebar({
  projects,
  selectedProject,
  onSelectProject,
  onGoHome,
  onOpenSearch,
  onNewProject
}) {
  const active = projects.filter((p) => p.status === 'active')
  const archived = projects.filter((p) => p.status !== 'active')

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
        {/* Active projects */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Projektit
            </span>
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
      <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-600">
        IT-Veljekset Group
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
