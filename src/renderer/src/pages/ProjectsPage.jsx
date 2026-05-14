const STATUS_LABELS = {
  active: 'Aktiivinen',
  archived: 'Arkistoitu',
  completed: 'Valmis'
}

const STATUS_STYLES = {
  active: 'bg-blue-900/40 text-blue-300',
  archived: 'bg-slate-700 text-slate-400',
  completed: 'bg-green-900/40 text-green-300'
}

function formatDate(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('fi-FI', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export default function ProjectsPage({ projects, onOpenProject, onNewProject }) {
  const active = projects.filter((p) => p.status === 'active')
  const others = projects.filter((p) => p.status !== 'active')

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between drag-region">
        <div className="no-drag">
          <h1 className="text-lg font-semibold text-white">Projektit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {projects.length} projekti{projects.length !== 1 ? 'a' : ''}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="no-drag flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Uusi projekti
        </button>
      </div>

      <div className="px-8 py-6">
        {projects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">Ei projekteja vielä</h3>
            <p className="text-slate-500 text-sm mb-6">Luo ensimmäinen projekti aloittaaksesi</p>
            <button
              onClick={onNewProject}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
            >
              Luo projekti
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Aktiiviset
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((p) => (
                <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p)} />
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Arkisto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {others.map((p) => (
                <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p)} muted />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project, onClick, muted }) {
  const total = project.task_count || 0
  const done = project.done_count || 0
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 hover:bg-slate-750 transition-all group ${
        muted ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      {/* Color stripe + name */}
      <div className="flex items-start gap-3 mb-3">
        <span
          className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
          style={{ backgroundColor: project.color || '#3B82F6' }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate group-hover:text-blue-300 transition-colors">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 ? (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{done}/{total} tehtävää</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                backgroundColor: project.color || '#3B82F6'
              }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mb-3">Ei tehtäviä vielä</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            STATUS_STYLES[project.status] || STATUS_STYLES.active
          }`}
        >
          {STATUS_LABELS[project.status] || project.status}
        </span>
        <span className="text-xs text-slate-600">{formatDate(project.updated_at)}</span>
      </div>
    </button>
  )
}
