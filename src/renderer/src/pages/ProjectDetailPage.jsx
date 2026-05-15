import { useState, useEffect, useCallback } from 'react'
import KanbanBoard from '../components/KanbanBoard'
import EditProjectModal from '../components/EditProjectModal'

const STATUS_LABELS = {
  active: 'Aktiivinen',
  archived: 'Arkistoitu',
  completed: 'Valmis'
}

export default function ProjectDetailPage({
  project,
  tags,
  onBack,
  onProjectUpdated,
  onProjectDeleted,
  onTagsChanged
}) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notes, setNotes] = useState(project.notes || '')
  const [notesOpen, setNotesOpen] = useState(Boolean(project.notes))
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => {
    setNotes(project.notes || '')
  }, [project.notes])

  const loadTasks = useCallback(async () => {
    try {
      const data = await window.api.getTasksByProject(project.id)
      setTasks(data)
    } catch (err) {
      console.error('Failed to load tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    setLoading(true)
    loadTasks()
  }, [loadTasks])

  const handleDeleteProject = async () => {
    try {
      await window.api.deleteProject(project.id)
      onProjectDeleted()
    } catch (err) {
      console.error(err)
    }
  }

  const handleProjectSaved = async (updated) => {
    setShowEdit(false)
    onProjectUpdated(updated)
  }

  const handleNotesSave = async () => {
    const trimmed = notes.trim()
    try {
      setNotesSaving(true)
      const updated = await window.api.updateProject({
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        notes: trimmed || null
      })
      onProjectUpdated(updated)
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } catch (err) {
      console.error('[ProjectDetailPage] notes save failed:', err)
    } finally {
      setNotesSaving(false)
    }
  }

  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="page-shell">
      <div className="page-header drag-region">
        <div className="page-header-row">
          <div className="page-header-main no-drag">
            <button onClick={onBack} className="secondary-button px-3 py-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Projektit
            </button>
            <div
              className="page-header-icon"
              style={{ background: `linear-gradient(135deg, ${project.color || '#3B82F6'} 0%, rgba(15,23,42,0.9) 100%)` }}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            </div>
            <div className="page-header-copy">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="page-eyebrow mb-0">Project</div>
                <span className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-slate-300">
                  {STATUS_LABELS[project.status] || project.status}
                </span>
              </div>
              <h1 className="page-title">{project.name}</h1>
              <p className="page-subtitle">{project.description || 'Ei kuvausta lisätty projektille.'}</p>
            </div>
          </div>

          <div className="page-actions no-drag">
            <button onClick={() => setShowEdit(true)} className="secondary-button text-sm">
              Muokkaa
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="secondary-button text-sm text-red-300 border-red-500/20 bg-red-500/10 hover:bg-red-500/15"
              >
                Poista
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <span>Vahvista poisto</span>
                <button onClick={handleDeleteProject} className="px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors">
                  Kyllä
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 transition-colors">
                  Ei
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="no-drag flex flex-wrap items-center gap-3 mt-4">
          <MetricBadge label="Yhteensä" value={total} />
          <MetricBadge label="Käynnissä" value={inProgress} tone="blue" />
          <MetricBadge label="Valmis" value={done} tone="emerald" />
          <div className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-3 min-w-[180px]">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: project.color || '#3B82F6' }} />
            </div>
            <span className="text-xs text-slate-400 tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-content-inner">
          <div className="page-content-wide space-y-5">
            <div className="surface-panel p-4 no-drag">
              <button
                onClick={() => setNotesOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white w-full text-left transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform ${notesOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Muistiinpanot
                {notesSaving && <span className="ml-2 text-xs text-slate-500">Tallennetaan…</span>}
                {notesSaved && <span className="ml-2 text-xs text-emerald-400">Tallennettu</span>}
              </button>
              {notesOpen && (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  placeholder="Kirjoita muistiinpanoja projektista..."
                  rows={4}
                  className="mt-4 w-full min-h-[120px] resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400/30"
                />
              )}
            </div>

            <div className="surface-panel p-4 min-h-[560px] flex flex-col overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  Ladataan tehtäviä...
                </div>
              ) : (
                <div className="flex-1 min-h-0">
                  <KanbanBoard
                    projectId={project.id}
                    tasks={tasks}
                    tags={tags}
                    onTasksChanged={setTasks}
                    onTagsChanged={onTagsChanged}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEdit(false)}
          onSaved={handleProjectSaved}
        />
      )}
    </div>
  )
}

function MetricBadge({ label, value, tone }) {
  const toneStyles = {
    blue: 'text-blue-300 border-blue-400/20 bg-blue-500/10',
    emerald: 'text-emerald-300 border-emerald-400/20 bg-emerald-500/10'
  }

  return (
    <div className={`px-4 py-2 rounded-2xl border bg-white/5 ${toneStyles[tone] || 'border-white/10 text-slate-200'}`}>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-slate-500 ml-2">{label}</span>
    </div>
  )
}
