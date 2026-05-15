import { useState } from 'react'
import { Hexagon } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { Project } from '../types'

interface Props {
  index: number
}

const STATUSES = ['idea', 'active', 'on_hold', 'done']
const STATUS_LABELS: Record<string, string> = { idea: 'Idea', active: 'Active', on_hold: 'On Hold', done: 'Done' }

export default function ProjectsSection({ index }: Props) {
  const { projects, refreshProjects } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'idea', progress: 0, links: '', notes: '' })

  const label = `${(index + 1).toString().padStart(2, '0')} — what I'm building`

  function openAdd() {
    setEditing(null)
    setForm({ name: '', description: '', status: 'idea', progress: 0, links: '', notes: '' })
    setSlideOpen(true)
  }
  function openEdit(p: Project) {
    setEditing(p)
    setForm({ name: p.name, description: p.description ?? '', status: p.status, progress: p.progress, links: p.links ?? '', notes: p.notes ?? '' })
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setConfirmDelete(null)
  }

  async function save() {
    if (!form.name.trim()) return
    const data = { ...form, progress: Number(form.progress) }
    if (editing) {
      await window.db.projects.update(editing.id, data)
    } else {
      await window.db.projects.create(data)
    }
    await refreshProjects()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.projects.delete(id)
    await refreshProjects()
    closeSlide()
  }

  return (
    <section data-section-id="projects" id="projects" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">
          + add project
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Hexagon size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Projects</h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {STATUSES.map((status) => (
          <div key={status}>
            <div className="text-[10px] font-mono text-text-faint mb-2 tracking-widest">{STATUS_LABELS[status]}</div>
            <div className="flex flex-col gap-2">
              {projects.filter((p) => p.status === status).map((p) => (
                <div key={p.id} className="card cursor-pointer group" style={{ padding: '14px' }} onClick={() => openEdit(p)}>
                  <div className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{p.name}</div>
                  {p.description && <div className="text-xs text-text-faint mt-1 line-clamp-2">{p.description}</div>}
                  {p.progress > 0 && (
                    <div className="progress-bar mt-3">
                      <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? 'Edit Project' : 'New Project'}>
        <div className="flex flex-col gap-4">
          <div>
            <label>Project name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label>Progress ({form.progress}%)</label>
            <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} style={{ padding: '4px 0' }} />
          </div>
          <div>
            <label>Links</label>
            <input value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button onClick={save} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
          {editing && (
            confirmDelete === editing.id ? (
              <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs text-text-muted mb-3">Delete this project?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30">Yes, delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(editing.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">Delete project</button>
            )
          )}
        </div>
      </SlideOver>
    </section>
  )
}
