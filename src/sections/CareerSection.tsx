import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { CareerEntry } from '../types'

interface Props {
  index: number
}

const TYPE_LABELS: Record<string, string> = { milestone: 'Milestone', skill: 'Skill', goal: 'Goal', win: 'Win' }

export default function CareerSection({ index }: Props) {
  const { careerEntries, refreshCareer } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<CareerEntry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ type: 'milestone', title: '', description: '', entry_date: '' })

  const label = `${(index + 1).toString().padStart(2, '0')} — where I'm going`

  function openAdd() {
    setEditing(null)
    setForm({ type: 'milestone', title: '', description: '', entry_date: '' })
    setSlideOpen(true)
  }
  function openEdit(c: CareerEntry) {
    setEditing(c)
    setForm({ type: c.type, title: c.title, description: c.description ?? '', entry_date: c.entry_date ?? '' })
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setConfirmDelete(null)
  }

  async function save() {
    if (!form.title.trim()) return
    if (editing) {
      await window.db.career.update(editing.id, form)
    } else {
      await window.db.career.create(form)
    }
    await refreshCareer()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.career.delete(id)
    await refreshCareer()
    closeSlide()
  }

  const grouped = Object.keys(TYPE_LABELS).reduce((acc, type) => {
    acc[type] = careerEntries.filter((e) => e.type === type)
    return acc
  }, {} as Record<string, CareerEntry[]>)

  return (
    <section data-section-id="career" id="career" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">
          + add entry
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Career</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(grouped).filter(([, items]) => items.length > 0).map(([type, items]) => (
          <div key={type} className="card">
            <div className="text-[10px] font-mono text-text-faint mb-3 tracking-widest">{TYPE_LABELS[type]?.toUpperCase()}</div>
            <div className="flex flex-col gap-2">
              {items.map((e) => (
                <div key={e.id} className="group flex items-start justify-between cursor-pointer" onClick={() => openEdit(e)}>
                  <div>
                    <div className="text-sm text-text-primary group-hover:text-accent transition-colors">{e.title}</div>
                    {e.description && <div className="text-xs text-text-faint mt-0.5">{e.description}</div>}
                  </div>
                  {e.entry_date && <span className="font-mono text-[10px] text-text-faint shrink-0 ml-3">{e.entry_date}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
        {careerEntries.length === 0 && (
          <div className="card col-span-2 text-sm text-text-faint">
            No career entries yet.{' '}
            <button onClick={openAdd} className="text-accent hover:opacity-80">Add one</button>
          </div>
        )}
      </div>

      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? 'Edit Entry' : 'New Career Entry'}>
        <div className="flex flex-col gap-4">
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
          </div>
          <button onClick={save} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
          {editing && (
            confirmDelete === editing.id ? (
              <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs text-text-muted mb-3">Delete this entry?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30">Yes</button>
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(editing.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">Delete entry</button>
            )
          )}
        </div>
      </SlideOver>
    </section>
  )
}
