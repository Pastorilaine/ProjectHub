import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'

const COLUMNS = [
  {
    id: 'todo',
    label: 'Tekemättä',
    color: 'text-slate-400',
    headerBg: 'bg-slate-800',
    dotColor: 'bg-slate-500'
  },
  {
    id: 'in_progress',
    label: 'Käynnissä',
    color: 'text-blue-400',
    headerBg: 'bg-blue-950',
    dotColor: 'bg-blue-400'
  },
  {
    id: 'done',
    label: 'Valmis',
    color: 'text-green-400',
    headerBg: 'bg-green-950',
    dotColor: 'bg-green-400'
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
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${col.headerBg}`}
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
                    className={`flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-16 rounded-lg p-1 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-slate-800/50 ring-1 ring-slate-600' : ''
                    }`}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
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
                        className="border-2 border-dashed border-slate-800 rounded-lg py-6 text-center cursor-pointer hover:border-slate-600 transition-colors"
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
