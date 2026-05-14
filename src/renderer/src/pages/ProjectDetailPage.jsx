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
    <div className="flex flex-col h-full" style={{ background: '#0A0F1C' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-3.5 drag-region"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3 no-drag">
          {/* Breadcrumb */}
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Projektit
          </button>
          <span className="text-slate-700">/</span>

          {/* Project name with color */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#3B82F6' }}
            />
            <h1 className="text-base font-semibold text-white truncate">{project.name}</h1>
            <span className="text-xs text-slate-600 ml-1">
              {STATUS_LABELS[project.status] || project.status}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
          <button
              onClick={() => setShowEdit(true)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              Muokkaa
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
              >
                Poista
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-red-400">Oletko varma?</span>
                <button
                  onClick={handleDeleteProject}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs text-white transition-colors"
                >
                  Kyllä
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
                >
                  Ei
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-3 no-drag">
          {project.description && (
            <p className="text-xs text-slate-500 flex-1 truncate">{project.description}</p>
          )}
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            <StatPill label="Yhteensä" value={total} />
            <StatPill label="Käynnissä" value={inProgress} color="text-blue-400" />
            <StatPill label="Valmis" value={done} color="text-green-400" />
            {total > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: project.color || '#3B82F6'
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500">{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notes collapsible */}
      <div
        className="flex-shrink-0 px-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="flex items-center gap-2 py-2 text-xs text-slate-500 hover:text-slate-300 w-full text-left transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${notesOpen ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Muistiinpanot
          {notesSaving && <span className="ml-2 text-slate-600">Tallennetaan...</span>}
          {notesSaved && <span className="ml-2 text-green-500">Tallennettu \u2713</span>}
        </button>
        {notesOpen && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesSave}
            placeholder="Kirjoita muistiinpanoja projektista..."
            rows={3}
            className="w-full text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none mb-3"
            style={{ background: 'transparent' }}
          />
        )}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden px-6 pt-5">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Ladataan tehtäviä...
          </div>
        ) : (
          <KanbanBoard
            projectId={project.id}
            tasks={tasks}
            tags={tags}
            onTasksChanged={setTasks}
            onTagsChanged={onTagsChanged}
          />
        )}
      </div>

      {/* Edit modal */}
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

function StatPill({ label, value, color }) {
  return (
    <div className="text-center">
      <div className={`text-sm font-semibold ${color || 'text-slate-300'}`}>{value}</div>
      <div className="text-xs text-slate-600">{label}</div>
    </div>
  )
}
