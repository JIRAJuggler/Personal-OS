import { useState } from 'react'
import { Sparkles, Star } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { Inspiration } from '../types'

interface Props {
  index: number
}

export default function InspirationsSection({ index }: Props) {
  const { inspirations, refreshInspirations } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<Inspiration | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ author: '', quote: '', tag: '' })

  const label = `${(index + 1).toString().padStart(2, '0')} — what's shaping my thinking`

  function openAdd() {
    setEditing(null)
    setForm({ author: '', quote: '', tag: '' })
    setSlideOpen(true)
  }
  function openEdit(i: Inspiration) {
    setEditing(i)
    setForm({ author: i.author, quote: i.quote, tag: i.tag ?? '' })
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setConfirmDelete(null)
  }

  async function save() {
    if (!form.author.trim() || !form.quote.trim()) return
    if (editing) {
      await window.db.inspirations.update(editing.id, form)
    } else {
      await window.db.inspirations.create(form)
    }
    await refreshInspirations()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.inspirations.delete(id)
    await refreshInspirations()
    closeSlide()
  }

  async function togglePin(e: React.MouseEvent, id: number) {
    e.stopPropagation()
    const item = inspirations.find((i) => i.id === id)
    if (!item) return
    if (item.pinned !== 1) {
      const pinned = inspirations.filter((i) => i.pinned === 1)
      if (pinned.length >= 4) {
        const oldest = pinned.reduce((min, i) => i.id < min.id ? i : min, pinned[0])
        await window.db.inspirations.togglePin(oldest.id)
      }
    }
    await window.db.inspirations.togglePin(id)
    await refreshInspirations()
  }

  return (
    <section data-section-id="inspirations" id="inspirations" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">
          ✎ edit
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Inspirations</h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {inspirations.slice(0, 8).map((insp) => (
          <div
            key={insp.id}
            className="card cursor-pointer"
            style={{ padding: '16px', position: 'relative' }}
            onClick={() => openEdit(insp)}
          >
            <button
              onClick={(e) => togglePin(e, insp.id)}
              title={insp.pinned === 1 ? 'Unpin from Home' : 'Pin to Home'}
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: insp.pinned === 1 ? '#f97316' : '#4a4845', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => { if (insp.pinned !== 1) (e.currentTarget as HTMLElement).style.color = '#888580' }}
              onMouseLeave={(e) => { if (insp.pinned !== 1) (e.currentTarget as HTMLElement).style.color = '#4a4845' }}
            >
              <Star size={12} fill={insp.pinned === 1 ? '#f97316' : 'none'} />
            </button>
            <div className="text-xs font-semibold mb-2" style={{ color: '#f97316' }}>
              {insp.author}
            </div>
            <p className="text-xs text-text-primary leading-relaxed line-clamp-5">{insp.quote}</p>
            {insp.tag && (
              <div className="mt-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-mono text-text-faint">{insp.tag}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title={editing ? 'Edit Inspiration' : 'New Inspiration'}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label>Author *</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div>
            <label>Quote *</label>
            <textarea rows={5} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
          </div>
          <div>
            <label>Tag</label>
            <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="stoicism, wealth, focus..." />
          </div>
          <button
            onClick={save}
            className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity"
          >
            Save
          </button>
          {editing && (
            <>
              {confirmDelete === editing.id ? (
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs text-text-muted mb-3">Delete this inspiration?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30 hover:bg-red-900/20 transition-colors">
                      Yes, delete
                    </button>
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted hover:text-text-primary transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(editing.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">
                  Delete inspiration
                </button>
              )}
            </>
          )}
        </div>
      </SlideOver>
    </section>
  )
}
