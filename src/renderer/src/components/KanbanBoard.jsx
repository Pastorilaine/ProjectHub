import { useState } from 'react'
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

export default function KanbanBoard({ projectId, tasks, tags, onTasksChanged, onTagsChanged }) {
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [addingToColumn, setAddingToColumn] = useState(null)

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done')
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updated = await window.api.updateTaskStatus(taskId, newStatus)
      onTasksChanged((prev) => prev.map((t) => (t.id === taskId ? { ...updated, tags: t.tags } : t)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleTaskUpdated = (updated) => {
    onTasksChanged((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleTaskDeleted = (id) => {
    onTasksChanged((prev) => prev.filter((t) => t.id !== id))
  }

  const handleTaskCreated = (task) => {
    onTasksChanged((prev) => [...prev, task])
    setAddingToColumn(null)
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
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

            {/* Task list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
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
              ))}

              {/* Empty state */}
              {colTasks.length === 0 && (
                <div
                  className="border-2 border-dashed border-slate-800 rounded-lg py-6 text-center cursor-pointer hover:border-slate-600 transition-colors"
                  onClick={() => setAddingToColumn(col.id)}
                >
                  <p className="text-xs text-slate-600">Tyhjä</p>
                </div>
              )}

              {/* Add task inline */}
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
          </div>
        )
      })}

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
    </div>
  )
}
