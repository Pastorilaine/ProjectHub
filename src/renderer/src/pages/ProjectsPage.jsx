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

function SummaryTile({ label, value, tone }) {
  const tones = {
    blue: 'text-blue-300 border-blue-400/20 bg-blue-500/10',
    slate: 'text-slate-200 border-white/10 bg-white/5',
    emerald: 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10'
  }

  return (
    <div className={`surface-card px-4 py-4 ${tones[tone] || tones.slate}`}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  )
}

export default function ProjectsPage({ projects, onOpenProject, onNewProject }) {
  const active = projects.filter((p) => p.status === 'active')
  const others = projects.filter((p) => p.status !== 'active')
  const completed = projects.filter((p) => p.status === 'completed')

  return (
    <div className="page-shell">
      <div className="page-header page-header--sticky drag-region">
        <div className="page-header-row">
          <div className="page-header-main no-drag">
            <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <div className="page-header-copy">
              <div className="page-eyebrow">Projects</div>
              <h1 className="page-title">Projektit</h1>
              <p className="page-subtitle">{projects.length} projektia yhteensä eri vaiheissa.</p>
            </div>
          </div>
          <div className="page-actions">
            <button onClick={onNewProject} className="primary-button no-drag">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Uusi projekti
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-content-inner">
          <div className="page-content-wide space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryTile label="Aktiiviset" value={active.length} tone="blue" />
              <SummaryTile label="Valmiit tai arkistoidut" value={others.length} tone="slate" />
              <SummaryTile label="Valmiit projektit" value={completed.length} tone="emerald" />
            </div>

            {projects.length === 0 && (
              <div className="surface-panel py-24 px-6 text-center">
                <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-white/10 bg-white/5">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium mb-2">Ei projekteja vielä</h3>
                <p className="text-slate-500 text-sm mb-6">Luo ensimmäinen projekti aloittaaksesi.</p>
                <button onClick={onNewProject} className="primary-button">
                  Luo projekti
                </button>
              </div>
            )}

            {active.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-label text-slate-400">Aktiiviset</h2>
                  <span className="text-xs text-slate-500">{active.length} käynnissä</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {active.map((p) => (
                    <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p)} />
                  ))}
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-label text-slate-400">Arkisto</h2>
                  <span className="text-xs text-slate-500">{others.length} projektia</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {others.map((p) => (
                    <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p)} muted />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
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
      className={`surface-card surface-card-hover w-full text-left p-5 group relative overflow-hidden ${muted ? 'opacity-70 hover:opacity-100' : ''}`}
    >
      <div className="absolute inset-x-5 top-0 h-px opacity-80" style={{ background: `linear-gradient(90deg, transparent, ${project.color || '#3B82F6'}, transparent)` }} />

      <div className="flex items-start gap-3">
        <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: project.color || '#3B82F6' }} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{project.name}</h3>
          {project.description ? (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
          ) : (
            <p className="text-xs text-slate-600 mt-1">Ei kuvausta lisätty.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{total > 0 ? `${done}/${total} tehtävää` : 'Ei tehtäviä vielä'}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: project.color || '#3B82F6' }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/6">
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
          {STATUS_LABELS[project.status] || project.status}
        </span>
        <span className="text-xs text-slate-600">Päivitetty {formatDate(project.updated_at)}</span>
      </div>
    </button>
  )
}
