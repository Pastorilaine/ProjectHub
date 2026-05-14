import { useState, useEffect, useRef } from 'react'

export default function SearchModal({ onClose, onOpenProject, onOpenProjectById }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await window.api.search(query.trim())
        setResults(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const total = results ? results.projects.length + results.tasks.length : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-700 gap-3">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Hae projekteja ja tehtäviä..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm outline-none"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-slate-500 border-t-blue-400 rounded-full animate-spin" />
          )}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {!query.trim() && (
            <p className="text-center text-slate-500 text-sm py-8">Kirjoita hakusana...</p>
          )}

          {query.trim() && results && total === 0 && (
            <p className="text-center text-slate-500 text-sm py-8">Ei tuloksia</p>
          )}

          {results && results.projects.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-900/50">
                Projektit
              </div>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color || '#3B82F6' }}
                  />
                  <span className="text-sm text-white">{p.name}</span>
                  {p.description && (
                    <span className="text-xs text-slate-500 truncate">{p.description}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results && results.tasks.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-900/50">
                Tehtävät
              </div>
              {results.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpenProjectById(t.project_id)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.project_color || '#3B82F6' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.project_name}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-slate-700 flex gap-4 text-xs text-slate-600">
          <span><kbd className="text-slate-500">↵</kbd> Avaa</span>
          <span><kbd className="text-slate-500">ESC</kbd> Sulje</span>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    todo: 'bg-slate-700 text-slate-400',
    in_progress: 'bg-blue-900 text-blue-300',
    done: 'bg-green-900 text-green-300'
  }
  const labels = { todo: 'Tekemättä', in_progress: 'Käynnissä', done: 'Valmis' }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${map[status] || map.todo}`}>
      {labels[status] || status}
    </span>
  )
}
