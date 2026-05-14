import EditTaskModal from './EditTaskModal'

const PRIORITY_STYLES = {
  high: { dot: 'bg-red-400', label: 'Korkea', text: 'text-red-400' },
  medium: { dot: 'bg-yellow-400', label: 'Normaali', text: 'text-yellow-400' },
  low: { dot: 'bg-slate-500', label: 'Matala', text: 'text-slate-500' }
}

function formatDate(ms) {
  if (!ms) return null
  const d = new Date(ms)
  const now = new Date()
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  const str = d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })
  if (diffDays < 0) return { str, overdue: true }
  if (diffDays <= 2) return { str, soon: true }
  return { str, overdue: false, soon: false }
}

export default function TaskCard({
  task,
  allTags,
  onStatusChange,
  onUpdated,
  onDeleted,
  onTagsChanged,
  editing,
  onStartEdit,
  onStopEdit
}) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
  const due = formatDate(task.due_date)

  const STATUSES = ['todo', 'in_progress', 'done']
  const currentIdx = STATUSES.indexOf(task.status)

  return (
    <>
      <div
        className="rounded-xl p-3.5 cursor-pointer group transition-all"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
        }}
        onClick={onStartEdit}
      >
        {/* Priority dot + title */}
        <div className="flex items-start gap-2 mb-2">
          <span
            className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${priority.dot}`}
            title={priority.label}
          />
          <span className="text-sm text-slate-100 leading-snug flex-1">{task.title}</span>
        </div>

        {/* Description preview */}
        {task.description && (
          <p className="text-xs text-slate-500 mb-2 line-clamp-2 pl-4">{task.description}</p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-4 mb-2">
            {task.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: tag.color + '22', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: due date + move buttons */}
        <div className="flex items-center justify-between pl-4 mt-1">
          {due ? (
            <span
              className={`text-xs ${
                due.overdue ? 'text-red-400' : due.soon ? 'text-yellow-400' : 'text-slate-500'
              }`}
            >
              {due.overdue && '⚠ '}
              {due.str}
            </span>
          ) : (
            <span />
          )}

          {/* Quick move buttons */}
          <div
            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {currentIdx > 0 && (
              <button
                onClick={() => onStatusChange(task.id, STATUSES[currentIdx - 1])}
                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                title="Siirrä vasemmalle"
              >
                ←
              </button>
            )}
            {currentIdx < STATUSES.length - 1 && (
              <button
                onClick={() => onStatusChange(task.id, STATUSES[currentIdx + 1])}
                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                title="Siirrä oikealle"
              >
                →
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EditTaskModal
          task={task}
          tags={allTags}
          onClose={onStopEdit}
          onSaved={(updated) => {
            onUpdated(updated)
            onStopEdit()
          }}
          onDeleted={(id) => {
            onDeleted(id)
            onStopEdit()
          }}
          onTagsChanged={onTagsChanged}
        />
      )}
    </>
  )
}
