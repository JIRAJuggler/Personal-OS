import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { RoadmapTimeline, RoadmapItem, RoadmapPhase } from '../types'
import SlideOver from './SlideOver'

// ── Colour palette for quick selection ───────────────────────────────────────
const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#0ea5e9',
]

// ── Segmented progress bar ───────────────────────────────────────────────────
// Renders only within the item's own column span; bounded by exact pixel grid.
function GanttBar({
  item, startIdx, endIdx, sortedTimelines,
}: {
  item: RoadmapItem
  startIdx: number
  endIdx: number
  sortedTimelines: RoadmapTimeline[]
}) {
  const span = endIdx - startIdx + 1
  const progress = Math.max(0, Math.min(100, item.progress)) / 100

  return (
    <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
      {Array.from({ length: span }, (_, i) => {
        const segStart = i / span
        const segEnd = (i + 1) / span
        const t = sortedTimelines[startIdx + i]
        const color = t?.color ?? '#f97316'
        let fill = 0
        if (progress >= segEnd) fill = 1
        else if (progress > segStart) fill = (progress - segStart) / (segEnd - segStart)
        return (
          <div key={t?.id ?? i} style={{ flex: 1, position: 'relative', height: '100%' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, width: `${fill * 100}%`, height: '100%', background: color, opacity: 0.85, transition: 'width 0.3s ease' }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RoadmapView() {
  const { roadmapTimelines, roadmapItems, roadmapPhases, refreshRoadmapTimelines, refreshRoadmapItems, refreshRoadmapPhases } = useAppStore()

  const sorted = [...roadmapTimelines].sort((a, b) => a.position - b.position || a.id - b.id)

  // ── Timeline slide-over state
  const [timelineSlide, setTimelineSlide] = useState(false)
  const [editingTimeline, setEditingTimeline] = useState<RoadmapTimeline | null>(null)
  const [timelineForm, setTimelineForm] = useState({ label: '', color: '#f97316' })
  const [timelineDeleteError, setTimelineDeleteError] = useState('')
  const [confirmDeleteTimeline, setConfirmDeleteTimeline] = useState<number | null>(null)

  // ── Item slide-over state
  const [itemSlide, setItemSlide] = useState(false)
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null)
  const [itemForm, setItemForm] = useState({
    title: '',
    start_timeline_id: 0,
    end_timeline_id: 0,
    progress: 0,
    mindset_note: '',
  })
  const [itemEndError, setItemEndError] = useState('')
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<number | null>(null)

  // ── Phase slide-over state
  const [phaseSlide, setPhaseSlide] = useState(false)
  const [editingPhase, setEditingPhase] = useState<RoadmapPhase | null>(null)
  const [phaseForm, setPhaseForm] = useState({ label: '', start_timeline_id: 0, end_timeline_id: 0, note: '' })
  const [phaseEndError, setPhaseEndError] = useState('')
  const [confirmDeletePhase, setConfirmDeletePhase] = useState<number | null>(null)

  // ── Timeline helpers
  function openAddTimeline() {
    setEditingTimeline(null)
    setTimelineForm({ label: '', color: '#f97316' })
    setTimelineDeleteError('')
    setConfirmDeleteTimeline(null)
    setTimelineSlide(true)
  }
  function openEditTimeline(t: RoadmapTimeline) {
    setEditingTimeline(t)
    setTimelineForm({ label: t.label, color: t.color })
    setTimelineDeleteError('')
    setConfirmDeleteTimeline(null)
    setTimelineSlide(true)
  }
  function closeTimelineSlide() {
    setTimelineSlide(false)
    setEditingTimeline(null)
    setTimelineDeleteError('')
    setConfirmDeleteTimeline(null)
  }
  async function saveTimeline() {
    if (!timelineForm.label.trim()) return
    if (editingTimeline) {
      await window.db.roadmapTimelines.update(editingTimeline.id, { label: timelineForm.label.trim(), color: timelineForm.color })
    } else {
      await window.db.roadmapTimelines.create({ label: timelineForm.label.trim(), color: timelineForm.color })
    }
    await refreshRoadmapTimelines()
    closeTimelineSlide()
  }
  async function deleteTimeline(id: number) {
    const result = await window.db.roadmapTimelines.delete(id)
    if (result.blocked) {
      setTimelineDeleteError('Remove all items using this timeline first.')
      setConfirmDeleteTimeline(null)
      return
    }
    await refreshRoadmapTimelines()
    closeTimelineSlide()
  }

  // ── Item helpers
  function openAddItem() {
    setEditingItem(null)
    const firstId = sorted[0]?.id ?? 0
    setItemForm({ title: '', start_timeline_id: firstId, end_timeline_id: firstId, progress: 0, mindset_note: '' })
    setItemEndError('')
    setConfirmDeleteItem(null)
    setItemSlide(true)
  }
  function openEditItem(item: RoadmapItem) {
    setEditingItem(item)
    setItemForm({
      title: item.title,
      start_timeline_id: item.start_timeline_id,
      end_timeline_id: item.end_timeline_id,
      progress: item.progress,
      mindset_note: item.mindset_note,
    })
    setItemEndError('')
    setConfirmDeleteItem(null)
    setItemSlide(true)
  }
  function closeItemSlide() {
    setItemSlide(false)
    setEditingItem(null)
    setItemEndError('')
    setConfirmDeleteItem(null)
  }
  async function saveItem() {
    if (!itemForm.title.trim()) return
    const startPos = sorted.find(t => t.id === itemForm.start_timeline_id)?.position ?? 0
    const endPos = sorted.find(t => t.id === itemForm.end_timeline_id)?.position ?? 0
    if (endPos < startPos) {
      setItemEndError('End timeline must be at or after the start timeline.')
      return
    }
    const payload = {
      title: itemForm.title.trim(),
      start_timeline_id: itemForm.start_timeline_id,
      end_timeline_id: itemForm.end_timeline_id,
      progress: itemForm.progress,
      mindset_note: itemForm.mindset_note,
    }
    if (editingItem) {
      await window.db.roadmapItems.update(editingItem.id, payload)
    } else {
      await window.db.roadmapItems.create(payload)
    }
    await refreshRoadmapItems()
    closeItemSlide()
  }
  async function deleteItem(id: number) {
    await window.db.roadmapItems.delete(id)
    await refreshRoadmapItems()
    closeItemSlide()
  }

  // ── Phase helpers
  function openAddPhase() {
    setEditingPhase(null)
    const firstId = sorted[0]?.id ?? 0
    setPhaseForm({ label: '', start_timeline_id: firstId, end_timeline_id: firstId, note: '' })
    setPhaseEndError('')
    setConfirmDeletePhase(null)
    setPhaseSlide(true)
  }
  function openEditPhase(p: RoadmapPhase) {
    setEditingPhase(p)
    setPhaseForm({ label: p.label, start_timeline_id: p.start_timeline_id, end_timeline_id: p.end_timeline_id, note: p.note })
    setPhaseEndError('')
    setConfirmDeletePhase(null)
    setPhaseSlide(true)
  }
  function closePhaseSlide() {
    setPhaseSlide(false)
    setEditingPhase(null)
    setPhaseEndError('')
    setConfirmDeletePhase(null)
  }
  async function savePhase() {
    if (!phaseForm.label.trim()) return
    const startPos = sorted.find(t => t.id === phaseForm.start_timeline_id)?.position ?? 0
    const endPos = sorted.find(t => t.id === phaseForm.end_timeline_id)?.position ?? 0
    if (endPos < startPos) {
      setPhaseEndError('End timeline must be at or after the start timeline.')
      return
    }
    const payload = { label: phaseForm.label.trim(), start_timeline_id: phaseForm.start_timeline_id, end_timeline_id: phaseForm.end_timeline_id, note: phaseForm.note }
    if (editingPhase) {
      await window.db.roadmapPhases.update(editingPhase.id, payload)
    } else {
      await window.db.roadmapPhases.create(payload)
    }
    await refreshRoadmapPhases()
    closePhaseSlide()
  }
  async function deletePhase(id: number) {
    await window.db.roadmapPhases.delete(id)
    await refreshRoadmapPhases()
    closePhaseSlide()
  }

  // ── Shared styles
  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#888580',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#e8e6e1',
    fontSize: 13,
    outline: 'none',
  }

  const COL_WIDTH = 180
  const ROW_HEIGHT = 62
  const gridTemplate = `repeat(${sorted.length}, ${COL_WIDTH}px) 48px`

  // ── Empty state
  if (sorted.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#888580', fontSize: 14, marginBottom: 20 }}>
          No timelines yet. Add your first timeline column to get started.
        </p>
        <button
          onClick={openAddTimeline}
          style={{
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 18px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          + Add Timeline
        </button>

        {/* Timeline slide-over (reused below) */}
        <SlideOver open={timelineSlide} onClose={closeTimelineSlide} title={editingTimeline ? 'Edit Timeline' : 'Add Timeline'}>
          <TimelineForm
            form={timelineForm}
            setForm={setTimelineForm}
            onSave={saveTimeline}
            onClose={closeTimelineSlide}
            editing={editingTimeline}
            confirmDelete={confirmDeleteTimeline}
            setConfirmDelete={setConfirmDeleteTimeline}
            onDelete={deleteTimeline}
            deleteError={timelineDeleteError}
            inputStyle={inputStyle}
            labelStyle={labelStyle}
          />
        </SlideOver>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Gantt grid ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
        <div style={{ width: `${COL_WIDTH * sorted.length + 48}px` }}>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: gridTemplate, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {sorted.map(t => (
              <div
                key={t.id}
                onClick={() => openEditTimeline(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 8px',
                  cursor: 'pointer',
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ background: t.color, borderRadius: 20, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="11" rx="2" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
                    <path d="M2 7h12" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
                    <path d="M5 1v4M11 1v4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{t.label}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={openAddTimeline}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: '#888580', fontSize: 18, lineHeight: 1,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>
          </div>

          {/* Phase band row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              minHeight: 36,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
              alignItems: 'center',
            }}
          >
            {/* column dividers */}
            {sorted.map((_, i) => (
              <div key={i} style={{ gridColumn: i + 1, gridRow: 1, height: '100%', borderRight: '1px solid rgba(255,255,255,0.04)' }} />
            ))}
            {/* phase pills */}
            {roadmapPhases.map(phase => {
              const startIdx = sorted.findIndex(t => t.id === phase.start_timeline_id)
              const endIdx = sorted.findIndex(t => t.id === phase.end_timeline_id)
              if (startIdx === -1 || endIdx === -1) return null
              const color = sorted[startIdx]?.color ?? '#f97316'
              return (
                <div
                  key={phase.id}
                  onClick={() => openEditPhase(phase)}
                  title={phase.note || undefined}
                  style={{
                    gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                    gridRow: 1,
                    zIndex: 1,
                    margin: '5px 6px',
                    padding: '4px 12px',
                    borderRadius: 20,
                    background: color + '26',
                    border: `1px solid ${color}55`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#e8e6e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {phase.label}
                  </span>
                  {phase.note && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888580" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  )}
                </div>
              )
            })}
            {/* add phase button in trailing cell */}
            <div style={{ gridColumn: sorted.length + 1, gridRow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
              <button
                onClick={openAddPhase}
                title="Add phase"
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#888580', fontSize: 15, lineHeight: 1,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >+</button>
            </div>
          </div>

          {/* Item rows */}
          {roadmapItems.map(item => {
            const startIdx = sorted.findIndex(t => t.id === item.start_timeline_id)
            const endIdx = sorted.findIndex(t => t.id === item.end_timeline_id)
            if (startIdx === -1 || endIdx === -1) return null
            return (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: gridTemplate,
                  height: ROW_HEIGHT,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  position: 'relative',
                }}
              >
                {/* column boundary dividers */}
                {sorted.map((_, i) => (
                  <div key={i} style={{ gridColumn: i + 1, gridRow: 1, borderRight: '1px solid rgba(255,255,255,0.04)' }} />
                ))}

                {/* title above bar — placed in its column span, z-index over dividers */}
                <div
                  onClick={() => openEditItem(item)}
                  style={{
                    gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                    gridRow: 1,
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '4px 10px',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: '#e8e6e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {item.title}
                    </span>
                    {item.mindset_note && (
                      <span title={item.mindset_note} style={{ flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.5 2a6 6 0 0 1 5 9.5M9.5 2a6 6 0 0 0-5 9.5" />
                          <path d="M4.5 11.5A5.5 5.5 0 0 0 9.5 22h5a5.5 5.5 0 0 0 5-9.5" />
                          <line x1="12" y1="11" x2="12" y2="22" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <GanttBar item={item} startIdx={startIdx} endIdx={endIdx} sortedTimelines={sorted} />
                </div>
              </div>
            )
          })}

          {/* Add item row */}
          <div style={{ paddingLeft: 0, paddingTop: 12 }}>
            <button
              onClick={openAddItem}
              style={{
                background: 'none', border: 'none',
                color: '#888580', fontSize: 13,
                cursor: 'pointer', padding: '6px 0',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>+</span> Add item
            </button>
          </div>
        </div>
      </div>

      {/* ── Phase slide-over ─────────────────────────────────────────────────── */}
      <SlideOver open={phaseSlide} onClose={closePhaseSlide} title={editingPhase ? 'Edit Phase' : 'Add Phase'}>
        <PhaseForm
          form={phaseForm}
          setForm={setPhaseForm}
          timelines={sorted}
          onSave={savePhase}
          onClose={closePhaseSlide}
          editing={editingPhase}
          endError={phaseEndError}
          setEndError={setPhaseEndError}
          confirmDelete={confirmDeletePhase}
          setConfirmDelete={setConfirmDeletePhase}
          onDelete={deletePhase}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </SlideOver>

      {/* ── Timeline slide-over ─────────────────────────────────────────── */}
      <SlideOver open={timelineSlide} onClose={closeTimelineSlide} title={editingTimeline ? 'Edit Timeline' : 'Add Timeline'}>
        <TimelineForm
          form={timelineForm}
          setForm={setTimelineForm}
          onSave={saveTimeline}
          onClose={closeTimelineSlide}
          editing={editingTimeline}
          confirmDelete={confirmDeleteTimeline}
          setConfirmDelete={setConfirmDeleteTimeline}
          onDelete={deleteTimeline}
          deleteError={timelineDeleteError}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </SlideOver>

      {/* ── Item slide-over ─────────────────────────────────────────────── */}
      <SlideOver open={itemSlide} onClose={closeItemSlide} title={editingItem ? 'Edit Item' : 'Add Item'}>
        <ItemForm
          form={itemForm}
          setForm={setItemForm}
          timelines={sorted}
          onSave={saveItem}
          onClose={closeItemSlide}
          editing={editingItem}
          endError={itemEndError}
          setEndError={setItemEndError}
          confirmDelete={confirmDeleteItem}
          setConfirmDelete={setConfirmDeleteItem}
          onDelete={deleteItem}
          inputStyle={inputStyle}
          labelStyle={labelStyle}
        />
      </SlideOver>
    </div>
  )
}

// ── Timeline form (extracted for reuse in empty-state) ────────────────────────
function TimelineForm({
  form, setForm, onSave, onClose,
  editing, confirmDelete, setConfirmDelete, onDelete, deleteError,
  inputStyle, labelStyle,
}: {
  form: { label: string; color: string }
  setForm: React.Dispatch<React.SetStateAction<{ label: string; color: string }>>
  onSave: () => void
  onClose: () => void
  editing: RoadmapTimeline | null
  confirmDelete: number | null
  setConfirmDelete: (v: number | null) => void
  onDelete: (id: number) => void
  deleteError: string
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={labelStyle}>Label</p>
        <input
          style={inputStyle}
          placeholder="e.g. May, Q3 2025"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && onSave()}
          autoFocus
        />
      </div>

      <div>
        <p style={labelStyle}>Colour</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {PALETTE.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, color: c }))}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: c, border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
          ))}
        </div>
        <input
          type="color"
          value={form.color}
          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
          style={{ width: 40, height: 28, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
        />
      </div>

      {deleteError && (
        <p style={{ color: '#f87171', fontSize: 12 }}>{deleteError}</p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={onSave}
          disabled={!form.label.trim()}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 6,
            background: form.label.trim() ? '#f97316' : 'rgba(249,115,22,0.3)',
            border: 'none', color: '#fff', fontSize: 13, cursor: form.label.trim() ? 'pointer' : 'default',
          }}
        >
          {editing ? 'Save' : 'Add Timeline'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '9px 14px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#888580', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: 8 }}>
          {confirmDelete === editing.id ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onDelete(editing.id)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#888580', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setConfirmDelete(editing.id) }}
              style={{ width: '100%', padding: '8px 0', borderRadius: 6, background: 'none', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
            >
              Delete Timeline
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Item form ─────────────────────────────────────────────────────────────────
function ItemForm({
  form, setForm, timelines, onSave, onClose,
  editing, endError, setEndError, confirmDelete, setConfirmDelete, onDelete,
  inputStyle, labelStyle,
}: {
  form: { title: string; start_timeline_id: number; end_timeline_id: number; progress: number; mindset_note: string }
  setForm: React.Dispatch<React.SetStateAction<{ title: string; start_timeline_id: number; end_timeline_id: number; progress: number; mindset_note: string }>>
  timelines: RoadmapTimeline[]
  onSave: () => void
  onClose: () => void
  editing: RoadmapItem | null
  endError: string
  setEndError: (v: string) => void
  confirmDelete: number | null
  setConfirmDelete: (v: number | null) => void
  onDelete: (id: number) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
}) {
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <p style={labelStyle}>Title</p>
        <input
          style={inputStyle}
          placeholder="e.g. Launch newsletter"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={labelStyle}>Start</p>
          <select
            style={selectStyle}
            value={form.start_timeline_id}
            onChange={e => {
              setEndError('')
              setForm(f => ({ ...f, start_timeline_id: Number(e.target.value) }))
            }}
          >
            {timelines.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <p style={labelStyle}>End</p>
          <select
            style={selectStyle}
            value={form.end_timeline_id}
            onChange={e => {
              setEndError('')
              setForm(f => ({ ...f, end_timeline_id: Number(e.target.value) }))
            }}
          >
            {timelines.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {endError && <p style={{ color: '#f87171', fontSize: 12, marginTop: -10 }}>{endError}</p>}

      <div>
        <p style={labelStyle}>Progress — {form.progress}%</p>
        <input
          type="range"
          min={0} max={100}
          value={form.progress}
          onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
          style={{ width: '100%', accentColor: '#f97316' }}
        />
        <input
          type="number"
          min={0} max={100}
          value={form.progress}
          onChange={e => setForm(f => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value))) }))}
          style={{ ...inputStyle, width: 70, marginTop: 8 }}
        />
      </div>

      <div>
        <p style={labelStyle}>Mindset note</p>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          placeholder="e.g. Consistency. Show up even when you don't feel like it."
          value={form.mindset_note}
          onChange={e => setForm(f => ({ ...f, mindset_note: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onSave}
          disabled={!form.title.trim()}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 6,
            background: form.title.trim() ? '#f97316' : 'rgba(249,115,22,0.3)',
            border: 'none', color: '#fff', fontSize: 13, cursor: form.title.trim() ? 'pointer' : 'default',
          }}
        >
          {editing ? 'Save' : 'Add Item'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '9px 14px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#888580', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: 4 }}>
          {confirmDelete === editing.id ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onDelete(editing.id)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#888580', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(editing.id)}
              style={{ width: '100%', padding: '8px 0', borderRadius: 6, background: 'none', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
            >
              Delete Item
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Phase form ────────────────────────────────────────────────────────────────
function PhaseForm({
  form, setForm, timelines, onSave, onClose,
  editing, endError, setEndError, confirmDelete, setConfirmDelete, onDelete,
  inputStyle, labelStyle,
}: {
  form: { label: string; start_timeline_id: number; end_timeline_id: number; note: string }
  setForm: React.Dispatch<React.SetStateAction<{ label: string; start_timeline_id: number; end_timeline_id: number; note: string }>>
  timelines: RoadmapTimeline[]
  onSave: () => void
  onClose: () => void
  editing: RoadmapPhase | null
  endError: string
  setEndError: (v: string) => void
  confirmDelete: number | null
  setConfirmDelete: (v: number | null) => void
  onDelete: (id: number) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
}) {
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <p style={labelStyle}>Label</p>
        <input
          style={inputStyle}
          placeholder="e.g. Define my positioning"
          value={form.label}
          onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
          autoFocus
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p style={labelStyle}>From</p>
          <select
            style={selectStyle}
            value={form.start_timeline_id}
            onChange={e => {
              setEndError('')
              setForm(f => ({ ...f, start_timeline_id: Number(e.target.value) }))
            }}
          >
            {timelines.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <p style={labelStyle}>To</p>
          <select
            style={selectStyle}
            value={form.end_timeline_id}
            onChange={e => {
              setEndError('')
              setForm(f => ({ ...f, end_timeline_id: Number(e.target.value) }))
            }}
          >
            {timelines.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      {endError && <p style={{ color: '#f87171', fontSize: 12, marginTop: -10 }}>{endError}</p>}

      <div>
        <p style={labelStyle}>Note</p>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          placeholder="Describe what this phase is about…"
          value={form.note}
          onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          onClick={onSave}
          disabled={!form.label.trim()}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 6,
            background: form.label.trim() ? '#f97316' : 'rgba(249,115,22,0.3)',
            border: 'none', color: '#fff', fontSize: 13, cursor: form.label.trim() ? 'pointer' : 'default',
          }}
        >
          {editing ? 'Save' : 'Add Phase'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '9px 14px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#888580', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: 4 }}>
          {confirmDelete === editing.id ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onDelete(editing.id)}
                style={{ flex: 1, padding: '8px 0', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#888580', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(editing.id)}
              style={{ width: '100%', padding: '8px 0', borderRadius: 6, background: 'none', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
            >
              Delete Phase
            </button>
          )}
        </div>
      )}
    </div>
  )
}
