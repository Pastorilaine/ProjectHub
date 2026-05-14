import { useEffect, useState, useCallback } from 'react'

function formatDaysLeft(dueDateMs) {
  const now = Date.now()
  const diff = dueDateMs - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (diff < 0) {
    const overdueDays = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24))
    return { label: overdueDays === 0 ? 'Myöhässä tänään' : `${overdueDays}pv myöhässä`, overdue: true }
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

const PRIORITY_LABELS = {
  high: 'Korkea',
  medium: 'Normaali',
  low: 'Matala'
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      </div>
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
      <div className="flex items-center justify-center h-full text-slate-500">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Ladataan...
      </div>
    )
  }

  if (!stats) return null

  const { activeProjects, openTasks, inProgress, overdue, upcoming, recentProjects } = stats

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Yleiskatsaus</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('fi-FI', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Uusi projekti
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Aktiiviset projektit"
          value={activeProjects}
          color="bg-blue-600/20"
          icon={
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          }
        />
        <StatCard
          label="Avoimet tehtävät"
          value={openTasks}
          color="bg-purple-600/20"
          icon={
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="Käynnissä"
          value={inProgress}
          color="bg-amber-600/20"
          icon={
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          label="Myöhässä"
          value={overdue}
          color={overdue > 0 ? 'bg-red-600/20' : 'bg-green-600/20'}
          icon={
            overdue > 0 ? (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )
          }
        />
      </div>

      {/* Main content: upcoming + recent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming deadlines */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Lähestyvät määräajat
          </h2>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Ei kiireellisiä tehtäviä</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((task) => {
                const { label, overdue: isOverdue, soon } = formatDaysLeft(task.due_date)
                return (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-700/50 cursor-pointer group transition-colors"
                    onClick={() => onOpenProject(task.project_id)}
                  >
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}
                      title={PRIORITY_LABELS[task.priority]}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate group-hover:text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 truncate">{task.project_name}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p
                        className={`text-xs font-medium ${
                          isOverdue ? 'text-red-400' : soon ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-slate-600">{formatDate(task.due_date)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Recent projects */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            Viimeisimmät projektit
          </h2>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
              <p className="text-sm">Ei projekteja vielä</p>
              <button
                onClick={onNewProject}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Luo ensimmäinen projekti
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {recentProjects.map((project) => {
                const done = project.done_count || 0
                const total = project.task_count || 0
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <li
                    key={project.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-700/50 cursor-pointer group transition-colors"
                    onClick={() => onOpenProject(project.id)}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate group-hover:text-white">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{done}/{total}</span>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Empty state: no projects at all */}
      {activeProjects === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-xl p-10 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <p className="text-slate-400 text-sm">Ei aktiivisia projekteja</p>
          <button
            onClick={onNewProject}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Luo ensimmäinen projekti
          </button>
        </div>
      )}
    </div>
  )
}
