import { useState } from 'react'
import Modal from './Modal'

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#06B6D4', '#84CC16',
  '#F97316', '#6B7280'
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktiivinen' },
  { value: 'archived', label: 'Arkistoitu' },
  { value: 'completed', label: 'Valmis' }
]

export default function EditProjectModal({ project, onClose, onSaved }) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [color, setColor] = useState(project.color || COLORS[0])
  const [status, setStatus] = useState(project.status || 'active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Projektin nimi on pakollinen')
      return
    }
    setSaving(true)
    try {
      const updated = await window.api.updateProject({
        id: project.id,
        name: name.trim(),
        description: description.trim() || null,
        color,
        status
      })
      onSaved(updated)
    } catch (err) {
      console.error(err)
      setError('Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Muokkaa projektia" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Nimi <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Kuvaus</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Väri</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-800' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tila</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 [color-scheme:dark] transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            Peruuta
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
          >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
