import { useState } from 'react'
import Modal from './Modal'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Korkea' },
  { value: 'medium', label: 'Normaali' },
  { value: 'low', label: 'Matala' }
]

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Tekemättä' },
  { value: 'in_progress', label: 'Käynnissä' },
  { value: 'done', label: 'Valmis' }
]

const TAG_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#06B6D4', '#84CC16'
]

function msToDateInput(ms) {
  if (!ms) return ''
  return new Date(ms).toISOString().split('T')[0]
}

export default function EditTaskModal({ task, tags, onClose, onSaved, onDeleted, onTagsChanged }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [status, setStatus] = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate, setDueDate] = useState(msToDateInput(task.due_date))
  const [selectedTagIds, setSelectedTagIds] = useState(task.tags?.map((t) => t.id) ?? [])
  const [newTagName, setNewTagName] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const createAndAddTag = async () => {
    const name = newTagName.trim()
    if (!name) return
    try {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
      const tag = await window.api.createTag({ name, color })
      onTagsChanged()
      setNewTagName('')
      setSelectedTagIds((prev) => [...prev, tag.id])
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Otsikko on pakollinen')
      return
    }
    setSaving(true)
    try {
      const updated = await window.api.updateTask({
        id: task.id,
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate).getTime() : null,
        tagIds: selectedTagIds
      })
      onSaved(updated)
    } catch (err) {
      console.error(err)
      setError('Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await window.api.deleteTask(task.id)
      onDeleted(task.id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Modal title="Muokkaa tehtävää" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Otsikko <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Kuvaus</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tila</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Prioriteetti</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Deadline</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tagit</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTagIds.includes(tag.id)
                    ? 'ring-2 ring-white/40 scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: tag.color + '33', color: tag.color }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createAndAddTag())}
              placeholder="Uusi tagi..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={createAndAddTag}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
            >
              + Lisää
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          {/* Delete */}
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
            >
              Poista tehtävä
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Oletko varma?</span>
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded-lg text-xs text-white transition-colors"
              >
                Kyllä, poista
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
              >
                Peruuta
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Tallennetaan...' : 'Tallenna'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
