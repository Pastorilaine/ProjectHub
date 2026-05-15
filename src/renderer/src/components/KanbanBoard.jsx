import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'

const COLUMNS = [
  {
    id: 'todo',
    label: 'Tekemättä',
    color: 'text-slate-300',
    dotColor: 'bg-slate-500',
    accentBorder: 'rgba(100,116,139,0.30)'
  },
  {
    id: 'in_progress',
    label: 'Käynnissä',
    color: 'text-blue-300',
    dotColor: 'bg-blue-400',
    accentBorder: 'rgba(59,130,246,0.35)'
  },
  {
    id: 'done',
    label: 'Valmis',
    color: 'text-green-300',
    dotColor: 'bg-green-400',
    accentBorder: 'rgba(16,185,129,0.35)'
  }
]

const FILTERS = [
  { id: 'all', label: 'Kaikki' },
  { id: 'high', label: '\uD83D\uDD34 Korkea' },
  { id: 'medium', label: '\uD83D\uDFE1 Normaali' },
  { id: 'low', label: '\u26AA Matala' },
  { id: 'overdue', label: '\u23F0 My\u00F6h\u00E4ss\u00E4' }
]

export default function KanbanBoard({ projectId, tasks, tags, onTasksChanged, onTagsChanged }) {
  const [localTasks, setLocalTasks] = useState(tasks)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [addingToColumn, setAddingToColumn] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // Keep local tasks in sync when the parent reloads them
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    const now = Date.now()
    switch (activeFilter) {
      case 'high': return localTasks.filter((t) => t.priority === 'high')
      case 'medium': return localTasks.filter((t) => t.priority === 'medium')
      case 'low': return localTasks.filter((t) => t.priority === 'low')
      case 'overdue':
        return localTasks.filter((t) => t.due_date && t.due_date < now && t.status !== 'done')
      default: return localTasks
    }
  }, [localTasks, activeFilter])

  const tasksByStatus = useMemo(
    () => ({
      todo: filteredTasks.filter((t) => t.status === 'todo'),
      in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
      done: filteredTasks.filter((t) => t.status === 'done')
    }),
    [filteredTasks]
  )

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const newStatus = destination.droppableId
    const statusChanged = source.droppableId !== destination.droppableId

    // Compute the new task list synchronously — used for both optimistic UI and DB updates
    const task = localTasks.find((t) => t.id === draggableId)
    if (!task) return
    const updatedTask = { ...task, status: newStatus }
    const withoutTask = localTasks.filter((t) => t.id !== draggableId)
    const destGroup = withoutTask.filter((t) => t.status === newStatus)
    const others = withoutTask.filter((t) => t.status !== newStatus)
    destGroup.splice(destination.index, 0, updatedTask)
    const newLocalTasks = [...others, ...destGroup]

    // Optimistic update
    setLocalTasks(newLocalTasks)

    try {
      // Persist status change if the task moved to a different column
      if (statusChanged) {
        const updated = await window.api.updateTaskStatus(draggableId, newStatus)
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === draggableId ? { ...updated, tags: t.tags } : t))
        )
      }

      // Persist sort order for all tasks in affected column(s)
      const affectedStatuses = statusChanged ? [source.droppableId, newStatus] : [newStatus]
      const orderUpdates = []
      for (const status of affectedStatuses) {
        newLocalTasks
          .filter((t) => t.status === status)
          .forEach((t, idx) => orderUpdates.push({ id: t.id, sortOrder: idx }))
      }
      await window.api.updateTasksOrder(orderUpdates)
      onTasksChanged(newLocalTasks)
    } catch (err) {
      console.error('[KanbanBoard] drag failed:', err)
      setLocalTasks(tasks) // revert on error
    }
  }

  // ── Other handlers (keep local + parent state in sync) ────────────────────
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await window.api.updateTaskStatus(taskId, newStatus)
      const updater = (prev) =>
        prev.map((t) => (t.id === taskId ? { ...updated, tags: t.tags } : t))
      setLocalTasks(updater)
      onTasksChanged(updater)
    } catch (err) {
      console.error(err)
    }
  }

  const handleTaskUpdated = (updated) => {
    const updater = (prev) => prev.map((t) => (t.id === updated.id ? updated : t))
    setLocalTasks(updater)
    onTasksChanged(updater)
  }

  const handleTaskDeleted = (id) => {
    const updater = (prev) => prev.filter((t) => t.id !== id)
    setLocalTasks(updater)
    onTasksChanged(updater)
  }

  const handleTaskCreated = (task) => {
    const updater = (prev) => [...prev, task]
    setLocalTasks(updater)
    onTasksChanged(updater)
    setAddingToColumn(null)
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`filter-chip ${activeFilter === f.id ? 'filter-chip--active text-white' : ''}`}
          >
            {f.label}
          </button>
        ))}
        {activeFilter !== 'all' && (
          <span className="ml-1 text-xs text-slate-500">
            {filteredTasks.length} tehtävää
          </span>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2 min-h-0">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id] || []

          return (
            <div key={col.id} className="surface-panel flex-shrink-0 w-[320px] flex flex-col p-3 min-h-0">
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-2xl mb-3 border"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: col.accentBorder }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-600 ml-1">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => setAddingToColumn(col.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors"
                  title="Lisää tehtävä"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[280px] rounded-2xl p-1 transition-all ${
                      snapshot.isDraggingOver ? 'ring-1 ring-blue-500/30' : ''
                    }`}
                    style={{ background: snapshot.isDraggingOver ? 'rgba(59,130,246,0.06)' : 'transparent' }}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-transform ${snapshot.isDragging ? 'rotate-1 scale-[1.02] shadow-xl' : ''}`}
                          >
                            <TaskCard
                              task={task}
                              allTags={tags}
                              onStatusChange={handleStatusChange}
                              onUpdated={handleTaskUpdated}
                              onDeleted={handleTaskDeleted}
                              onTagsChanged={onTagsChanged}
                              editing={editingTaskId === task.id}
                              onStartEdit={() => setEditingTaskId(task.id)}
                              onStopEdit={() => setEditingTaskId(null)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}

                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div
                        className="rounded-2xl border border-dashed border-white/10 py-8 text-center cursor-pointer transition-all text-slate-500 hover:border-white/20 hover:text-slate-300"
                        onClick={() => setAddingToColumn(col.id)}
                      >
                        Tyhjä sarake — lisää tehtävä
                      </div>
                    )}

                    <button
                      onClick={() => setAddingToColumn(col.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-white/10 bg-white/5 text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors text-xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Lisää tehtävä
                    </button>
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
        </div>

        {addingToColumn && (
          <CreateTaskModal
            projectId={projectId}
            initialStatus={addingToColumn}
            tags={tags}
            onClose={() => setAddingToColumn(null)}
            onCreated={handleTaskCreated}
            onTagsChanged={onTagsChanged}
          />
        )}
      </DragDropContext>
    </div>
  )
}
