import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { Book } from '../types'

interface Props {
  index: number
}

export default function BooksSection({ index }: Props) {
  const { books, refreshBooks } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ title: '', author: '', status: 'want_to_read', rating: '', notes: '', date_started: '', target_finish: '' })

  const label = `${(index + 1).toString().padStart(2, '0')} — what I'm reading`
  const reading = books.filter((b) => b.status === 'reading')
  const wantToRead = books.filter((b) => b.status === 'want_to_read')
  const finished = books.filter((b) => b.status === 'finished')

  function openAdd() {
    setEditing(null)
    setForm({ title: '', author: '', status: 'want_to_read', rating: '', notes: '', date_started: '' })
    setSlideOpen(true)
  }
  function openEdit(b: Book) {
    setEditing(b)
    setForm({ title: b.title, author: b.author, status: b.status, rating: b.rating?.toString() ?? '', notes: b.notes ?? '', date_started: b.date_started ?? '', target_finish: b.target_finish ?? '' })
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setConfirmDelete(null)
  }

  async function save() {
    if (!form.title.trim()) return
    const data = { title: form.title, author: form.author, status: form.status, notes: form.notes, date_started: form.date_started || null, target_finish: form.target_finish || null, rating: form.rating ? Number(form.rating) : null }
    if (editing) {
      await window.db.books.update(editing.id, data)
    } else {
      await window.db.books.create(data)
    }
    await refreshBooks()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.books.delete(id)
    await refreshBooks()
    closeSlide()
  }

  const statusLabel = { reading: 'Reading', want_to_read: 'Want to read', finished: 'Finished' }

  return (
    <section data-section-id="books" id="books" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">
          + add book
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <BookOpen size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Books</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Currently reading */}
        <div className="card col-span-2">
          <div className="text-[10px] font-mono text-text-faint mb-4 tracking-widest">CURRENTLY READING</div>
          {reading.length === 0 ? (
            <p className="text-sm text-text-faint">Nothing in progress.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reading.map((b) => (
                <div key={b.id} className="group flex items-start justify-between gap-3 cursor-pointer" onClick={() => openEdit(b)}>
                  <div>
                    <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{b.title}</div>
                    <div className="text-xs text-text-muted mt-0.5">{b.author}</div>
                    {(b.date_started || b.target_finish) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {b.date_started && (
                          <span className="text-[10px] font-mono text-text-faint">started {b.date_started}</span>
                        )}
                        {b.target_finish && (
                          <span className="text-[10px] font-mono text-text-faint">→ finish by {b.target_finish}</span>
                        )}
                      </div>
                    )}
                    {b.notes && <div className="text-xs text-text-faint mt-1 line-clamp-2">{b.notes}</div>}
                  </div>
                  <span className="text-[10px] font-mono text-accent shrink-0 px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.06)' }}>
                    reading
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Want to read + finished */}
        <div className="card">
          <div className="text-[10px] font-mono text-text-faint mb-4 tracking-widest">WANT TO READ</div>
          <div className="flex flex-col gap-2">
            {wantToRead.map((b) => (
              <div key={b.id} className="group cursor-pointer" onClick={() => openEdit(b)}>
                <div className="text-xs text-text-primary group-hover:text-accent transition-colors">{b.title}</div>
                <div className="text-[11px] text-text-faint">{b.author}</div>
              </div>
            ))}
          </div>
          {finished.length > 0 && (
            <>
              <div className="text-[10px] font-mono text-text-faint mt-4 mb-2 tracking-widest">FINISHED</div>
              <div className="flex flex-col gap-2">
                {finished.slice(0, 5).map((b) => (
                  <div key={b.id} className="group cursor-pointer flex items-center justify-between" onClick={() => openEdit(b)}>
                    <div>
                      <div className="text-xs text-text-muted line-through group-hover:no-underline group-hover:text-text-primary transition-colors">{b.title}</div>
                    </div>
                    {b.rating && <span className="text-[10px] text-text-faint">{b.rating}★</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? 'Edit Book' : 'Add Book'} width="700px">
        <div className="flex gap-6" style={{ minHeight: '520px' }}>

          {/* Left column — metadata */}
          <div className="flex flex-col gap-4" style={{ width: '240px', flexShrink: 0 }}>
            <div>
              <label>Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label>Author</label>
              <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="want_to_read">Want to read</option>
                <option value="reading">Reading</option>
                <option value="finished">Finished</option>
              </select>
            </div>
            <div>
              <label>Start Date</label>
              <input type="date" value={form.date_started} onChange={(e) => setForm({ ...form, date_started: e.target.value })} />
            </div>
            <div>
              <label>Target Finish Date</label>
              <input type="date" value={form.target_finish} onChange={(e) => setForm({ ...form, target_finish: e.target.value })} />
            </div>
            <div>
              <label>Rating (1–5)</label>
              <input type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-4">
              <button onClick={save} className="w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">
                Save
              </button>
              {editing && (
                confirmDelete === editing.id ? (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-xs text-text-muted mb-3">Delete this book?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30">Yes, delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(editing.id)} className="text-xs text-text-faint hover:text-red-400 transition-colors text-center">Delete book</button>
                )
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

          {/* Right column — notes */}
          <div className="flex flex-col flex-1">
            <label className="mb-2">Notes &amp; reading log</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Thoughts, quotes, takeaways..."
              style={{ flex: 1, minHeight: '460px', resize: 'none', lineHeight: '1.7', fontSize: '13px' }}
            />
          </div>

        </div>
      </SlideOver>
    </section>
  )
}
