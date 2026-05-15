import { useState } from 'react'
import { Target, CheckCircle2, Circle, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { Goal, NorthStar } from '../types'

function rankColor(rank: number) {
  if (rank === 0) return '#f97316'
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#84cc16'
  return '#a8a29e'
}

interface Props {
  index: number
}

function SortableGoalRow({ goal, rank, onToggle, onEdit }: { goal: Goal; rank: number; onToggle: (g: Goal) => void; onEdit: (g: Goal) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: goal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        {...listeners}
        {...attributes}
        className="shrink-0 text-text-faint hover:text-text-muted transition-colors"
        style={{ cursor: 'grab', touchAction: 'none', padding: '2px 0' }}
        tabIndex={-1}
      >
        <GripVertical size={13} />
      </button>
      <button onClick={() => onToggle(goal)} className="shrink-0">
        <Circle size={18} className="text-accent" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-text-primary truncate">{goal.title}</span>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-text-muted shrink-0">{goal.progress}%</span>
            <button
              onClick={() => onEdit(goal)}
              className="text-text-faint hover:text-text-muted opacity-0 group-hover:opacity-100 transition-all text-xs"
            >
              ✎
            </button>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${goal.progress}%`, background: rankColor(rank) }} />
        </div>
      </div>
    </div>
  )
}

function StaticGoalRow({ goal, onToggle, onEdit }: { goal: Goal; onToggle: (g: Goal) => void; onEdit: (g: Goal) => void }) {
  return (
    <div className="flex items-center gap-2 group">
      <div style={{ width: '13px', flexShrink: 0 }} />
      <button onClick={() => onToggle(goal)} className="shrink-0">
        {goal.status === 'completed' ? (
          <CheckCircle2 size={18} className="text-success" />
        ) : (
          <Circle size={18} className="text-text-faint" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm truncate ${goal.status === 'completed' ? 'line-through text-text-faint' : 'text-text-muted'}`}>
            {goal.title}
          </span>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-text-muted shrink-0">{goal.progress}%</span>
            <button
              onClick={() => onEdit(goal)}
              className="text-text-faint hover:text-text-muted opacity-0 group-hover:opacity-100 transition-all text-xs"
            >
              ✎
            </button>
          </div>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${goal.progress}%`, background: goal.status === 'completed' ? '#22c55e' : '#888580' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function GoalsSection({ index }: Props) {
  const { goals, northStar, refreshGoals, refreshNorthStar } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [editingNS, setEditingNS] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [capError, setCapError] = useState(false)
  const [form, setForm] = useState({ title: '', life_area: '', why: '', progress: 0, target_date: '', status: 'active' })
  const [nsForm, setNsForm] = useState({ statement: '', optimizing_for: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const label = `${(index + 1).toString().padStart(2, '0')} — what I'm chasing`
  const completed = goals.filter((g) => g.status === 'completed').length
  const activeCount = goals.filter((g) => g.status === 'active').length
  const activeGoals = [...goals].filter((g) => g.status === 'active').sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || a.id - b.id)
  const otherGoals = goals.filter((g) => g.status !== 'active')

  function openAdd() {
    setEditing(null)
    setCapError(false)
    setForm({ title: '', life_area: '', why: '', progress: 0, target_date: '', status: 'active' })
    setSlideOpen(true)
  }
  function openEdit(g: Goal) {
    setEditing(g)
    setCapError(false)
    setForm({ title: g.title, life_area: g.life_area ?? '', why: g.why ?? '', progress: g.progress, target_date: g.target_date ?? '', status: g.status })
    setSlideOpen(true)
  }
  function openEditNS(ns: NorthStar | null) {
    setNsForm({ statement: ns?.statement ?? '', optimizing_for: ns?.optimizing_for ?? '' })
    setEditingNS(true)
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setEditingNS(false)
    setConfirmDelete(null)
    setCapError(false)
  }

  async function saveGoal() {
    if (!form.title.trim()) return
    const isNewActive = !editing && form.status === 'active'
    const becomingActive = editing && editing.status !== 'active' && form.status === 'active'
    if ((isNewActive || becomingActive) && activeCount >= 10) {
      setCapError(true)
      return
    }
    setCapError(false)
    if (editing) {
      await window.db.goals.update(editing.id, { ...form, progress: Number(form.progress) })
    } else {
      await window.db.goals.create({ ...form, progress: Number(form.progress) })
    }
    await refreshGoals()
    closeSlide()
  }

  async function saveNS() {
    await window.db.northStar.upsert(nsForm.statement, nsForm.optimizing_for)
    await refreshNorthStar()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.goals.delete(id)
    await refreshGoals()
    closeSlide()
  }

  async function toggleComplete(g: Goal) {
    const newStatus = g.status === 'completed' ? 'active' : 'completed'
    const newProgress = newStatus === 'completed' ? 100 : g.progress
    await window.db.goals.update(g.id, { status: newStatus, progress: newProgress })
    await refreshGoals()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = activeGoals.findIndex((g) => g.id === active.id)
    const newIndex = activeGoals.findIndex((g) => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(activeGoals, oldIndex, newIndex)
    await window.db.goals.reorder(reordered.map((g) => g.id))
    await refreshGoals()
  }

  return (
    <section data-section-id="goals" id="goals" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={() => openEditNS(northStar)} className="text-xs text-text-faint hover:text-text-muted transition-colors flex items-center gap-1">
          ✎ edit north star
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Target size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Goals</h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* North Star card */}
        <div className="card col-span-1 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-text-faint mb-3 tracking-widest">NORTH STAR</div>
            <p className="text-text-primary text-base font-medium leading-relaxed">
              {northStar?.statement ?? 'Set your north star...'}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <span className="font-mono text-[11px] text-text-faint">
              → optimizing for: <span className="text-text-muted">{northStar?.optimizing_for ?? '—'}</span>
            </span>
          </div>
        </div>

        {/* Goals list card */}
        <div className="card col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono text-text-faint tracking-widest">
              2026 GOALS · {completed}/{goals.length} COMPLETE · {activeCount}/10 ACTIVE
            </span>
            <button
              onClick={openAdd}
              disabled={activeCount >= 10}
              className="text-xs text-accent hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add goal
            </button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeGoals.map((g) => g.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-3">
                {activeGoals.map((g, i) => (
                  <SortableGoalRow key={g.id} goal={g} rank={i} onToggle={toggleComplete} onEdit={openEdit} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {otherGoals.length > 0 && (
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {otherGoals.map((g) => (
                <StaticGoalRow key={g.id} goal={g} onToggle={toggleComplete} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      </div>

      <SlideOver
        open={slideOpen}
        onClose={closeSlide}
        title={editingNS ? 'Edit North Star' : editing ? 'Edit Goal' : 'New Goal'}
      >
        {editingNS ? (
          <div className="flex flex-col gap-4">
            <div>
              <label>Statement</label>
              <textarea
                rows={4}
                value={nsForm.statement}
                onChange={(e) => setNsForm({ ...nsForm, statement: e.target.value })}
              />
            </div>
            <div>
              <label>Optimizing for</label>
              <input
                value={nsForm.optimizing_for}
                onChange={(e) => setNsForm({ ...nsForm, optimizing_for: e.target.value })}
              />
            </div>
            <button
              onClick={saveNS}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label>Goal title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label>Life area</label>
              <input value={form.life_area} onChange={(e) => setForm({ ...form, life_area: e.target.value })} placeholder="health, career, learning..." />
            </div>
            <div>
              <label>Why this matters</label>
              <textarea rows={3} value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} />
            </div>
            <div>
              <label>Progress ({form.progress}%)</label>
              <input type="range" min={0} max={100} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} style={{ padding: '4px 0' }} />
            </div>
            <div>
              <label>Target date</label>
              <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} />
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => { setForm({ ...form, status: e.target.value }); setCapError(false) }}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            {capError && (
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', fontSize: '12px', color: '#f97316' }}>
                You have 10 active goals — complete or pause one before adding another.
              </div>
            )}
            <button
              onClick={saveGoal}
              className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity"
            >
              Save
            </button>
            {editing && (
              <>
                {confirmDelete === editing.id ? (
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-xs text-text-muted mb-3">Delete this goal permanently?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 hover:bg-red-900/20 transition-colors border border-red-800/30">
                        Yes, delete
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted hover:text-text-primary transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(editing.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">
                    Delete goal
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </SlideOver>
    </section>
  )
}
