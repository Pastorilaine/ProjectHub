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

export default function CreateIdeaModal({ projects, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [status, setStatus] = useState('raw')
  const [priority, setPriority] = useState('medium')
  const [linkedProjectId, setLinkedProjectId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Otsikko vaaditaan'); return }
    setSaving(true)
    setError('')
    try {
      const idea = await window.api.createIdea({
        title: title.trim(),
        content: content.trim() || null,
        category,
        status,
        priority,
        linkedProjectId: linkedProjectId || null
      })
      onCreated(idea)
    } catch (err) {
      setError(err.message || 'Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Uusi idea" onClose={onClose}>
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
            placeholder="Idea lyhyesti..."
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
            placeholder="Tarkempi kuvaus, taustainfo, linkit..."
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
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Linkitä projektiin (valinnainen)</label>
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

        <div className="flex justify-end gap-2 pt-1">
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
            {saving ? 'Tallennetaan...' : 'Tallenna idea'}
          </button>
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
