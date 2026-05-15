import { useState, useEffect, useCallback, useMemo } from 'react'
import CreateIdeaModal from '../components/CreateIdeaModal'
import EditIdeaModal from '../components/EditIdeaModal'

const STATUS_COLUMNS = [
  {
    key: 'raw',
    label: 'Raakaideat',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    dot: 'bg-amber-400'
  },
  {
    key: 'refined',
    label: 'Jalostettu',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    dot: 'bg-blue-400'
  },
  {
    key: 'implemented',
    label: 'Toteutettu',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
    dot: 'bg-emerald-400'
  }
]

const CATEGORY_LABELS = {
  general: 'Yleinen',
  feature: 'Toiminto',
  improvement: 'Parannus',
  bug: 'Bugi',
  research: 'Tutkimus',
  other: 'Muu'
}

const PRIORITY_META = {
  high: { label: 'Korkea', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  medium: { label: 'Normaali', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  low: { label: 'Matala', color: 'text-slate-400', bg: 'bg-slate-400/10' }
}

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
}

export default function IdeaLibraryPage({ projects }) {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const [draggingIdea, setDraggingIdea] = useState(null)

  const loadIdeas = useCallback(async () => {
    try {
      const data = await window.api.getIdeas()
      setIdeas(data)
    } catch (error) {
      console.error('Failed to load ideas:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdeas()
  }, [loadIdeas])

  const handleCreated = (idea) => {
    setIdeas((prev) => [idea, ...prev])
    setShowCreate(false)
  }

  const handleUpdated = (updatedIdea) => {
    setIdeas((prev) => prev.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea)))
    setEditTarget(null)
  }

  const handleDelete = async (ideaId) => {
    try {
      await window.api.deleteIdea(ideaId)
      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId))
      setEditTarget(null)
    } catch (error) {
      console.error('Failed to delete idea:', error)
    }
  }

  const handleStatusChange = useCallback(async (ideaId, nextStatus) => {
    try {
      const updatedIdea = await window.api.updateIdeaStatus(ideaId, nextStatus)
      setIdeas((prev) => prev.map((idea) => (idea.id === updatedIdea.id ? updatedIdea : idea)))
    } catch (error) {
      console.error('Failed to update idea status:', error)
    }
  }, [])

  const filteredIdeas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return ideas
      .filter((idea) => {
        if (filterCategory !== 'all' && idea.category !== filterCategory) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        const haystack = [idea.title, idea.content, idea.linked_project_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(normalizedSearch)
      })
      .sort((left, right) => {
        const leftPriority = PRIORITY_ORDER[left.priority] ?? PRIORITY_ORDER.medium
        const rightPriority = PRIORITY_ORDER[right.priority] ?? PRIORITY_ORDER.medium
        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority
        }

        const rightTimestamp = new Date(right.updated_at || right.created_at || 0).getTime()
        const leftTimestamp = new Date(left.updated_at || left.created_at || 0).getTime()
        return rightTimestamp - leftTimestamp
      })
  }, [filterCategory, ideas, search])

  const ideasByStatus = useMemo(() => {
    return STATUS_COLUMNS.reduce((accumulator, column) => {
      accumulator[column.key] = filteredIdeas.filter((idea) => idea.status === column.key)
      return accumulator
    }, {})
  }, [filteredIdeas])

  const handleDragStart = (event, idea) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(idea.id))
    setDraggingIdea(idea)
  }

  const handleDrop = async (event, status) => {
    event.preventDefault()
    setDragOver(null)

    if (!draggingIdea || draggingIdea.status === status) {
      setDraggingIdea(null)
      return
    }

    await handleStatusChange(draggingIdea.id, status)
    setDraggingIdea(null)
  }

  if (loading) {
    return (
      <div className="page-shell items-center justify-center text-slate-400">
        <div className="surface-card flex items-center gap-3 px-5 py-4">
          <svg className="animate-spin w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm">Ladataan ideoita...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-header drag-region">
        <div className="page-header-row">
          <div className="page-header-main no-drag">
            <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="page-header-copy">
              <div className="page-eyebrow">Ideas</div>
              <h1 className="page-title">Ideakirjasto</h1>
              <p className="page-subtitle">{ideas.length} {ideas.length === 1 ? 'idea' : 'ideaa'} tallennettuna.</p>
            </div>
          </div>

          <div className="page-actions">
            <button onClick={() => setShowCreate(true)} className="primary-button primary-button--amber no-drag">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Uusi idea
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="page-content-inner">
          <div className="page-content-wide space-y-5">
            <div className="surface-panel p-4 no-drag">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Hae ideoita..."
                    className="input-shell w-full pl-10 pr-3 py-2.5 text-sm placeholder-slate-600 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryChip label="Kaikki" value="all" active={filterCategory === 'all'} onClick={setFilterCategory} />
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <CategoryChip key={value} label={label} value={value} active={filterCategory === value} onClick={setFilterCategory} />
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto overflow-y-hidden pb-2">
              <div className="flex gap-4 min-w-max">
                {STATUS_COLUMNS.map((column) => {
                  const columnIdeas = ideasByStatus[column.key] || []

                  return (
                    <div
                      key={column.key}
                      className="surface-panel w-[340px] flex-shrink-0 flex flex-col min-h-[560px] transition-all"
                      style={{
                        background: dragOver === column.key ? column.bg : undefined,
                        borderColor: dragOver === column.key ? column.border : undefined
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        setDragOver(column.key)
                      }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(event) => handleDrop(event, column.key)}
                    >
                      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10 flex-shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${column.dot}`} />
                        <span className="text-xs font-semibold text-slate-200 uppercase tracking-[0.18em]">{column.label}</span>
                        <span className="ml-auto text-xs font-medium text-slate-500 tabular-nums">{columnIdeas.length}</span>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {columnIdeas.length === 0 && (
                          <div className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-slate-500">
                            <svg className="w-8 h-8 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                              />
                            </svg>
                            Ei ideoita tässä vaiheessa
                          </div>
                        )}

                        {columnIdeas.map((idea) => (
                          <IdeaCard
                            key={idea.id}
                            idea={idea}
                            statusColumns={STATUS_COLUMNS}
                            onEdit={() => setEditTarget(idea)}
                            onStatusChange={handleStatusChange}
                            onDragStart={handleDragStart}
                            onDragEnd={() => {
                              setDraggingIdea(null)
                              setDragOver(null)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateIdeaModal
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {editTarget && (
        <EditIdeaModal
          idea={editTarget}
          projects={projects}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

function CategoryChip({ label, value, active, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={`filter-chip ${active ? 'filter-chip--active' : ''}`}
      style={active
        ? {
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(249,115,22,0.16) 100%)',
            borderColor: 'rgba(251,191,36,0.28)',
            color: '#fde68a'
          }
        : {}}
    >
      {label}
    </button>
  )
}

function IdeaCard({ idea, statusColumns, onEdit, onStatusChange, onDragStart, onDragEnd }) {
  const priorityMeta = PRIORITY_META[idea.priority] || PRIORITY_META.medium
  const categoryLabel = CATEGORY_LABELS[idea.category] || idea.category
  const nextStatuses = statusColumns.filter((column) => column.key !== idea.status)

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, idea)}
      onDragEnd={onDragEnd}
      className="surface-card surface-card-hover group rounded-2xl p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs text-slate-400 px-2 py-1 rounded-full border border-white/10 bg-white/5">
          {categoryLabel}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full border border-transparent ${priorityMeta.color} ${priorityMeta.bg}`}>
          {priorityMeta.label}
        </span>
        {idea.linked_project_name && (
          <span
            className="text-xs px-2 py-1 rounded-full truncate max-w-32"
            style={{
              color: idea.linked_project_color || '#cbd5e1',
              background: idea.linked_project_color ? `${idea.linked_project_color}1f` : 'rgba(255,255,255,0.06)',
              border: idea.linked_project_color ? `1px solid ${idea.linked_project_color}40` : '1px solid rgba(255,255,255,0.08)'
            }}
          >
            {idea.linked_project_name}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-slate-100 leading-snug mb-2 line-clamp-2">{idea.title}</p>

      {idea.content && (
        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">{idea.content}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          {nextStatuses.map((column) => (
            <button
              key={column.key}
              onClick={() => onStatusChange(idea.id, column.key)}
              title={`Siirrä: ${column.label}`}
              className="w-7 h-7 rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-500 hover:text-slate-100 hover:bg-white/10 transition-all"
          title="Muokkaa"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
