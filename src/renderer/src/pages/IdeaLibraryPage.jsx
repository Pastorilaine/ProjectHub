import { useState, useEffect, useCallback } from 'react'
import CreateIdeaModal from '../components/CreateIdeaModal'
import EditIdeaModal from '../components/EditIdeaModal'

const STATUS_COLUMNS = [
  {
    key: 'raw',
    label: 'Raakaideat',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    dot: 'bg-amber-400'
  },
  {
    key: 'refined',
    label: 'Jalostettu',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    dot: 'bg-blue-400'
  },
  {
    key: 'implemented',
    label: 'Toteutettu',
    color: '#10B981',
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

export default function IdeaLibraryPage({ projects }) {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(null)
  const [dragging, setDragging] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await window.api.getIdeas()
      setIdeas(data)
    } catch (err) {
      console.error('Failed to load ideas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = async (idea) => {
    setIdeas((prev) => [idea, ...prev])
    setShowCreate(false)
  }

  const handleUpdated = (updated) => {
    setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setEditTarget(null)
  }

  const handleDelete = async (id) => {
    await window.api.deleteIdea(id)
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    setEditTarget(null)
  }

  const handleStatusChange = async (id, status) => {
    const updated = await window.api.updateIdeaStatus(id, status)
    setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
  }

  // Drag-and-drop between columns
  const handleDragStart = (e, idea) => {
    setDragging(idea)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, statusKey) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragging || dragging.status === statusKey) { setDragging(null); return }
    await handleStatusChange(dragging.id, statusKey)
    setDragging(null)
  }

  const filtered = ideas.filter((idea) => {
    if (filterCategory !== 'all' && idea.category !== filterCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        idea.title.toLowerCase().includes(q) ||
        (idea.content || '').toLowerCase().includes(q) ||
        (idea.linked_project_name || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const byStatus = (status) => filtered.filter((i) => i.status === status)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <svg className="animate-spin w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span className="text-sm">Ladataan ideoita...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Ideakirjasto</h1>
            </div>
            <p className="text-sm text-slate-500 pl-11">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideaa'} tallennettuna
            </p>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Uusi idea
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hae ideoita..."
              className="w-full pl-8 pr-3 py-2 text-sm text-slate-300 rounded-lg placeholder-slate-600 outline-none focus:ring-1 focus:ring-amber-500/40"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <CategoryChip label="Kaikki" value="all" active={filterCategory === 'all'} onClick={setFilterCategory} />
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <CategoryChip key={k} label={v} value={k} active={filterCategory === k} onClick={setFilterCategory} />
            ))}
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full px-8 py-6 min-w-max">
          {STATUS_COLUMNS.map((col) => {
            const colIdeas = byStatus(col.key)
            return (
              <div
                key={col.key}
                className="flex flex-col w-80 flex-shrink-0 rounded-2xl transition-all"
                style={{
                  background: dragOver === col.key ? col.bg : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${dragOver === col.key ? col.border : 'rgba(255,255,255,0.06)'}`,
                  minHeight: 0
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(col.key) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{col.label}</span>
                  <span className="ml-auto text-xs font-medium text-slate-600 tabular-nums">{colIdeas.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {colIdeas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <span className="text-2xl mb-2">💡</span>
                      <p className="text-xs text-slate-700 italic">Ei ideoita tässä vaiheessa</p>
                    </div>
                  )}
                  {colIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      statusColumns={STATUS_COLUMNS}
                      onEdit={() => setEditTarget(idea)}
                      onStatusChange={handleStatusChange}
                      onDragStart={handleDragStart}
                    />
                  ))}
                </div>
              </div>
            )
          })}
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
      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
        active ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'
      }`}
      style={active
        ? { background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }
        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      {label}
    </button>
  )
}

function IdeaCard({ idea, statusColumns, onEdit, onStatusChange, onDragStart }) {
  const pri = PRIORITY_META[idea.priority] || PRIORITY_META.medium
  const cat = CATEGORY_LABELS[idea.category] || idea.category
  const otherStatuses = statusColumns.filter((c) => c.key !== idea.status)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, idea)}
      className="group rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Category + Priority row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {cat}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-md ${pri.color} ${pri.bg}`}>
          {pri.label}
        </span>
        {idea.linked_project_name && (
          <span className="text-xs px-1.5 py-0.5 rounded-md text-slate-400 truncate max-w-28"
            style={{ background: idea.linked_project_color ? `${idea.linked_project_color}22` : 'rgba(255,255,255,0.06)', border: idea.linked_project_color ? `1px solid ${idea.linked_project_color}40` : 'none' }}>
            {idea.linked_project_name}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-200 leading-snug mb-1 line-clamp-2">{idea.title}</p>

      {/* Content excerpt */}
      {idea.content && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{idea.content}</p>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Move to status */}
        <div className="flex items-center gap-1">
          {otherStatuses.map((col) => (
            <button
              key={col.key}
              onClick={() => onStatusChange(idea.id, col.key)}
              title={`Siirrä: ${col.label}`}
              className="p-1 rounded-md text-slate-600 hover:text-slate-300 transition-colors text-xs"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-slate-200 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          title="Muokkaa"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
