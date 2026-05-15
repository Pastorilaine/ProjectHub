import { useEffect, useState, useCallback } from 'react'

function formatDaysLeft(dueDateMs) {
  const now = Date.now()
  const diff = dueDateMs - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (diff < 0) {
    const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24))
    return { label: overdueDays === 0 ? 'Myöhässä tänään' : `${overdueDays} pv myöhässä`, overdue: true }
  }
  if (days === 0) return { label: 'Tänään', soon: true }
  if (days === 1) return { label: 'Huomenna', soon: true }
  return { label: `${days} pv`, soon: false }
}

function formatDate(ms) {
  if (!ms) return ''
  return new Date(ms).toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
}

const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-500'
}

function StatCard({ label, value, gradient, icon, alert }) {
  return (
    <div
      className="surface-card surface-card-hover rounded-[24px] p-5 flex items-center gap-4 relative overflow-hidden"
      style={{ borderColor: alert ? 'rgba(248,113,113,0.22)' : undefined }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: gradient, boxShadow: '0 14px 30px rgba(2,6,23,0.22)' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{label}</p>
      </div>
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full opacity-20 pointer-events-none" style={{ background: gradient }} />
    </div>
  )
}

function OverviewBadge({ label, value, tone }) {
  const tones = {
    blue: 'text-blue-300 border-blue-400/20 bg-blue-500/10',
    amber: 'text-amber-300 border-amber-400/20 bg-amber-500/10',
    rose: 'text-rose-300 border-rose-400/20 bg-rose-500/10'
  }

  return (
    <div className={`px-3 py-2 rounded-2xl border text-sm ${tones[tone] || 'text-slate-200 border-white/10 bg-white/5'}`}>
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-slate-400 ml-2">{label}</span>
    </div>
  )
}

export default function DashboardPage({ onOpenProject, onNewProject }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await window.api.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('[Dashboard] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="page-shell items-center justify-center text-slate-400">
        <div className="surface-card flex items-center gap-3 px-5 py-4">
          <svg className="animate-spin w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Ladataan näkymää...
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { activeProjects, openTasks, inProgress, overdue, upcoming, recentProjects } = stats

  return (
    <div className="page-shell">
      <div className="page-header drag-region">
        <div className="page-header-row">
          <div className="page-header-main no-drag">
            <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="page-header-copy">
              <div className="page-eyebrow">Overview</div>
              <h1 className="page-title">Yleiskatsaus</h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
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
            <div className="surface-panel p-5 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Tilanne tänään</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Seuraa avoimia töitä, myöhässä olevia tehtäviä ja viimeisintä projektivirtaa yhdestä näkymästä.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OverviewBadge label="Avoinna" value={openTasks} tone="blue" />
                  <OverviewBadge label="Käynnissä" value={inProgress} tone="amber" />
                  <OverviewBadge label="Myöhässä" value={overdue} tone={overdue > 0 ? 'rose' : 'blue'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Aktiiviset projektit"
                value={activeProjects}
                gradient="linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)"
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                }
              />
              <StatCard
                label="Avoimet tehtävät"
                value={openTasks}
                gradient="linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)"
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                label="Käynnissä"
                value={inProgress}
                gradient="linear-gradient(135deg, #B45309 0%, #D97706 100%)"
                icon={
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />
              <StatCard
                label="Myöhässä"
                value={overdue}
                alert={overdue > 0}
                gradient={overdue > 0
                  ? 'linear-gradient(135deg, #991B1B 0%, #DC2626 100%)'
                  : 'linear-gradient(135deg, #065F46 0%, #059669 100%)'}
                icon={
                  overdue > 0 ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                }
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="surface-panel p-5">
                <h2 className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Lähestyvät määräajat
                </h2>
                {upcoming.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
                    Ei kiireellisiä tehtäviä juuri nyt.
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {upcoming.map((task) => {
                      const { label, overdue: isOverdue, soon } = formatDaysLeft(task.due_date)
                      return (
                        <li
                          key={task.id}
                          className="surface-card surface-card-hover flex items-start gap-3 p-3 cursor-pointer"
                          onClick={() => onOpenProject(task.project_id)}
                        >
                          <span
                            className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}
                            title={task.priority}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-100 truncate">{task.title}</p>
                            <p className="text-xs text-slate-500 mt-1 truncate">{task.project_name}</p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className={`text-xs font-medium ${isOverdue ? 'text-red-400' : soon ? 'text-amber-400' : 'text-slate-400'}`}>
                              {label}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">{formatDate(task.due_date)}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="surface-panel p-5">
                <h2 className="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                  </svg>
                  Viimeisimmät projektit
                </h2>
                {recentProjects.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
                    <p>Ei projekteja vielä.</p>
                    <button onClick={onNewProject} className="secondary-button mt-4">
                      Luo ensimmäinen projekti
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {recentProjects.map((project) => {
                      const done = project.done_count || 0
                      const total = project.task_count || 0
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0
                      return (
                        <li
                          key={project.id}
                          className="surface-card surface-card-hover flex items-center gap-3 p-3 cursor-pointer"
                          onClick={() => onOpenProject(project.id)}
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color || '#3B82F6' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-100 truncate">{project.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="h-1.5 rounded-full overflow-hidden bg-white/10 flex-1 max-w-28">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: project.color || '#3B82F6' }} />
                              </div>
                              <p className="text-xs text-slate-500 tabular-nums">{done}/{total || 0}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-600">{formatDate(project.updated_at)}</span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
