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

    // Optimistic update: move the task in local state immediately
    setLocalTasks((prev) => {
      const task = prev.find((t) => t.id === draggableId)
      if (!task) return prev
      const updatedTask = { ...task, status: newStatus }
      const withoutTask = prev.filter((t) => t.id !== draggableId)
      // Insert at the correct position within the destination column
      const destGroup = withoutTask.filter((t) => t.status === newStatus)
      const others = withoutTask.filter((t) => t.status !== newStatus)
      destGroup.splice(destination.index, 0, updatedTask)
      return [...others, ...destGroup]
    })

    // Persist status change to DB when dropping into a different column
    if (source.droppableId !== destination.droppableId) {
      try {
        const updated = await window.api.updateTaskStatus(draggableId, newStatus)
        const updater = (prev) =>
          prev.map((t) => (t.id === draggableId ? { ...updated, tags: t.tags } : t))
        setLocalTasks(updater)
        onTasksChanged(updater)
      } catch (err) {
        console.error('[KanbanBoard] updateTaskStatus failed:', err)
        setLocalTasks(tasks) // revert on error
      }
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
    <div className="flex flex-col h-full">
      {/* Filter bar */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              activeFilter === f.id
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={activeFilter === f.id
              ? { background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }
            }
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
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus[col.id] || []

          return (
            <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${col.accentBorder}` }}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-600 ml-1">{colTasks.length}</span>
                </div>
                <button
                  onClick={() => setAddingToColumn(col.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                  title="Lisää tehtävä"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              {/* Droppable task list */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-16 rounded-xl p-1 transition-all ${
                      snapshot.isDraggingOver ? 'ring-1 ring-blue-500/40' : ''
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

                    {/* Empty state */}
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div
                        className="rounded-xl py-6 text-center cursor-pointer transition-all"
                        style={{ border: '2px dashed rgba(255,255,255,0.08)' }}
                        onMouseEnter={(e) => e.currentTarget.style.border = '2px dashed rgba(255,255,255,0.18)'}
                        onMouseLeave={(e) => e.currentTarget.style.border = '2px dashed rgba(255,255,255,0.08)'}
                        onClick={() => setAddingToColumn(col.id)}
                      >
                        <p className="text-xs text-slate-600">Tyhjä — lisää tehtävä</p>
                      </div>
                    )}

                    {/* Add task inline button */}
                    <button
                      onClick={() => setAddingToColumn(col.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-slate-800/50 transition-colors text-xs"
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

      {/* Create task modal */}
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
