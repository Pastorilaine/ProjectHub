const STATUS_LABELS = {
  active: 'Aktiivinen',
  archived: 'Arkistoitu',
  completed: 'Valmis'
}

const STATUS_STYLES = {
  active: { bg: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: 'rgba(37,99,235,0.30)' },
  archived: { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8', border: 'rgba(100,116,139,0.30)' },
  completed: { bg: 'rgba(16,185,129,0.15)', color: '#34D399', border: 'rgba(16,185,129,0.30)' }
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
    <div className="flex-1 overflow-y-auto" style={{ background: '#0A0F1C' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-7 py-4 flex items-center justify-between drag-region"
        style={{
          background: 'rgba(10,15,28,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div className="no-drag">
          <h1 className="text-lg font-semibold text-white tracking-tight">Projektit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {projects.length} projekti{projects.length !== 1 ? 'a' : ''}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="no-drag flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Uusi projekti
        </button>
      </div>

      <div className="px-7 py-6">
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">Ei projekteja vielÃ¤</h3>
            <p className="text-slate-500 text-sm mb-6">Luo ensimmÃ¤inen projekti aloittaaksesi</p>
            <button
              onClick={onNewProject}
              className="px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
            >
              Luo projekti
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
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
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
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
  const st = STATUS_STYLES[project.status] || STATUS_STYLES.active

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-5 transition-all group relative overflow-hidden ${muted ? 'opacity-60 hover:opacity-100' : ''}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.055)'
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.13)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
      }}
    >
      {/* Left color accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full"
        style={{ backgroundColor: project.color || '#3B82F6' }}
      />

      {/* Name row */}
      <div className="pl-3 mb-3">
        <h3 className="font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
          {project.name}
        </h3>
        {project.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 ? (
        <div className="mb-3 pl-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{`${done}/${total}`} tehtÃ¤vÃ¤Ã¤</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: project.color || '#3B82F6' }}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-700 mb-3 pl-3">Ei tehtÃ¤viÃ¤ vielÃ¤</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pl-3">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
        >
          {STATUS_LABELS[project.status] || project.status}
        </span>
        <span className="text-xs text-slate-600">{formatDate(project.updated_at)}</span>
      </div>
    </button>
  )
}