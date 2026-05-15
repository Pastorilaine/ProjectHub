import { useState } from 'react'
import Modal from './Modal'

const CATEGORIES = [
  { value: 'general', label: 'Yleinen' },
  { value: 'feature', label: 'Toiminto' },
  { value: 'improvement', label: 'Parannus' },
  { value: 'bug', label: 'Bugi' },
  { value: 'research', label: 'Tutkimus' },
  { value: 'other', label: 'Muu' }
]

const PRIORITIES = [
  { value: 'high', label: 'Korkea' },
  { value: 'medium', label: 'Normaali' },
  { value: 'low', label: 'Matala' }
]

const STATUSES = [
  { value: 'raw', label: 'Raakaidea' },
  { value: 'refined', label: 'Jalostettu' },
  { value: 'implemented', label: 'Toteutettu' }
]

export default function EditIdeaModal({ idea, projects, onClose, onUpdated, onDelete }) {
  const [title, setTitle] = useState(idea.title)
  const [content, setContent] = useState(idea.content || '')
  const [category, setCategory] = useState(idea.category || 'general')
  const [status, setStatus] = useState(idea.status || 'raw')
  const [priority, setPriority] = useState(idea.priority || 'medium')
  const [linkedProjectId, setLinkedProjectId] = useState(idea.linked_project_id || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Otsikko vaaditaan'); return }
    setSaving(true)
    setError('')
    try {
      const updated = await window.api.updateIdea({
        id: idea.id,
        title: title.trim(),
        content: content.trim() || null,
        category,
        status,
        priority,
        linkedProjectId: linkedProjectId || null
      })
      onUpdated(updated)
    } catch (err) {
      setError(err.message || 'Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await onDelete(idea.id)
  }

  return (
    <Modal title="Muokkaa ideaa" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg text-xs text-rose-300" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Otsikko *</label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-amber-500/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Kuvaus</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Kategoria" value={category} onChange={setCategory} options={CATEGORIES} />
          <SelectField label="Tila" value={status} onChange={setStatus} options={STATUSES} />
          <SelectField label="Prioriteetti" value={priority} onChange={setPriority} options={PRIORITIES} />
        </div>

        {projects && projects.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Linkitetty projekti</label>
            <select
              value={linkedProjectId}
              onChange={(e) => setLinkedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 outline-none focus:ring-1 focus:ring-amber-500/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <option value="">— Ei projektia —</option>
              {projects.filter((p) => p.status === 'active').map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleDelete}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              confirmDelete
                ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                : 'text-slate-500 hover:text-rose-400'
            }`}
          >
            {confirmDelete ? 'Vahvista poisto' : 'Poista idea'}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }}
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 rounded-lg text-sm text-slate-200 outline-none focus:ring-1 focus:ring-amber-500/50"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
