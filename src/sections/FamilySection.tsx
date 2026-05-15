import { useState } from 'react'
import { Diamond, Check, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { FamilyEntry, FamilyRitual } from '../types'

interface Props {
  index: number
}

function getLastDone(ritualId: number, logs: { ritual_id: number; logged_date: string }[]): string {
  const sorted = logs.filter(l => l.ritual_id === ritualId).sort((a, b) => b.logged_date.localeCompare(a.logged_date))
  if (sorted.length === 0) return 'never'
  const last = sorted[0].logged_date
  const today = new Date().toISOString().slice(0, 10)
  const diffDays = Math.round((new Date(today).getTime() - new Date(last).getTime()) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function timesThisYear(ritualId: number, logs: { ritual_id: number; logged_date: string }[]): number {
  const year = new Date().getFullYear().toString()
  return logs.filter(l => l.ritual_id === ritualId && l.logged_date.startsWith(year)).length
}

interface RitualCalendarProps {
  ritualId: number
  logs: { ritual_id: number; logged_date: string }[]
  onToggle: (ritualId: number, date: string) => void
  onClose: () => void
}

function RitualCalendar({ ritualId, logs, onToggle, onClose }: RitualCalendarProps) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const loggedDates = new Set(logs.filter(l => l.ritual_id === ritualId).map(l => l.logged_date))

  const startDow = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-based
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <div className="mt-3 mb-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-text-faint hover:text-text-muted transition-colors"><ChevronLeft size={14} /></button>
        <span className="text-xs font-mono text-text-muted">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="text-text-faint hover:text-text-muted transition-colors"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => <div key={d} className="text-center text-[9px] font-mono text-text-faint">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isLogged = loggedDates.has(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr
          return (
            <button
              key={i}
              disabled={isFuture}
              onClick={() => { onToggle(ritualId, dateStr); onClose() }}
              className="flex items-center justify-center mx-auto transition-all"
              style={{
                width: '24px', height: '24px', borderRadius: '50%',
                fontSize: '11px', fontFamily: 'monospace',
                cursor: isFuture ? 'default' : 'pointer',
                background: isLogged ? 'rgba(249,115,22,0.2)' : isToday ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: isLogged ? '1px solid rgba(249,115,22,0.5)' : isToday ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                color: isLogged ? 'rgb(249,115,22)' : isFuture ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function FamilySection({ index }: Props) {
  const { familyEntries, refreshFamily, rituals, ritualLogs, refreshRituals } = useAppStore()
  const today = new Date().toISOString().slice(0, 10)

  // One-off entry state
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<FamilyEntry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ type: 'activity', title: '', description: '', entry_date: '' })

  // Ritual state
  const [ritualSlideOpen, setRitualSlideOpen] = useState(false)
  const [editingRitual, setEditingRitual] = useState<FamilyRitual | null>(null)
  const [confirmDeleteRitual, setConfirmDeleteRitual] = useState<number | null>(null)
  const [ritualForm, setRitualForm] = useState({ title: '', description: '', frequency: 'weekly', notes: '' })
  const [expandedCalendar, setExpandedCalendar] = useState<number | null>(null)

  const label = `${(index + 1).toString().padStart(2, '0')} — who I'm showing up for`

  function openAdd() {
    setEditing(null)
    setForm({ type: 'activity', title: '', description: '', entry_date: '' })
    setSlideOpen(true)
  }
  function openEdit(f: FamilyEntry) {
    setEditing(f)
    setForm({ type: f.type, title: f.title, description: f.description ?? '', entry_date: f.entry_date ?? '' })
    setSlideOpen(true)
  }
  function closeSlide() { setSlideOpen(false); setEditing(null); setConfirmDelete(null) }

  async function save() {
    if (!form.title.trim()) return
    if (editing) await window.db.family.update(editing.id, form)
    else await window.db.family.create(form)
    await refreshFamily()
    closeSlide()
  }
  async function handleDelete(id: number) {
    await window.db.family.delete(id)
    await refreshFamily()
    closeSlide()
  }

  function openAddRitual() {
    setEditingRitual(null)
    setRitualForm({ title: '', description: '', frequency: 'weekly', notes: '' })
    setRitualSlideOpen(true)
  }
  function openEditRitual(r: FamilyRitual) {
    setEditingRitual(r)
    setRitualForm({ title: r.title, description: r.description ?? '', frequency: r.frequency, notes: r.notes ?? '' })
    setRitualSlideOpen(true)
  }
  function closeRitualSlide() { setRitualSlideOpen(false); setEditingRitual(null); setConfirmDeleteRitual(null) }

  async function saveRitual() {
    if (!ritualForm.title.trim()) return
    if (editingRitual) await window.db.family.rituals.update(editingRitual.id, ritualForm)
    else await window.db.family.rituals.create(ritualForm)
    await refreshRituals()
    closeRitualSlide()
  }
  async function handleDeleteRitual(id: number) {
    await window.db.family.rituals.delete(id)
    await refreshRituals()
    closeRitualSlide()
  }
  async function toggleLog(ritualId: number, date: string = today) {
    const isLogged = ritualLogs.some(l => l.ritual_id === ritualId && l.logged_date === date)
    if (isLogged) await window.db.family.rituals.unlog(ritualId, date)
    else await window.db.family.rituals.log(ritualId, date)
    await refreshRituals()
  }

  return (
    <section data-section-id="family" id="family" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <div className="flex gap-3">
          <button onClick={openAddRitual} className="text-xs text-text-faint hover:text-text-muted transition-colors">+ ritual</button>
          <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">+ entry</button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Diamond size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Family</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Rituals — full width */}
        <div className="card col-span-2">
          <div className="text-[10px] font-mono text-text-faint mb-4 tracking-widest">RITUALS</div>
          {rituals.length === 0 ? (
            <p className="text-sm text-text-faint">No rituals yet. Add things you want to do together regularly.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {rituals.map((r) => {
                const isLogged = ritualLogs.some(l => l.ritual_id === r.id && l.logged_date === today)
                const lastDone = getLastDone(r.id, ritualLogs)
                const calOpen = expandedCalendar === r.id
                return (
                  <div key={r.id}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleLog(r.id)}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                        style={{
                          background: isLogged ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isLogged ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          color: isLogged ? 'rgb(249,115,22)' : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        <Check size={11} />
                      </button>
                      <div className="flex-1 cursor-pointer group min-w-0" onClick={() => openEditRitual(r)}>
                        <span className="text-sm text-text-primary group-hover:text-accent transition-colors">{r.title}</span>
                        {r.description && <span className="text-xs text-text-faint ml-2">{r.description}</span>}
                      </div>
                      <span className="text-[10px] font-mono text-text-faint px-1.5 py-0.5 rounded shrink-0" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                        {timesThisYear(r.id, ritualLogs)}× this year
                      </span>
                      <span className="text-[10px] font-mono text-text-faint w-20 text-right shrink-0">{lastDone}</span>
                      <button
                        onClick={() => setExpandedCalendar(calOpen ? null : r.id)}
                        className="shrink-0 transition-colors"
                        style={{ color: calOpen ? 'rgb(249,115,22)' : 'rgba(255,255,255,0.2)' }}
                      >
                        <CalendarDays size={13} />
                      </button>
                    </div>
                    {calOpen && (
                      <RitualCalendar ritualId={r.id} logs={ritualLogs} onToggle={toggleLog} onClose={() => setExpandedCalendar(null)} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Activities */}
        <div className="card">
          <div className="text-[10px] font-mono text-text-faint mb-4 tracking-widest">UPCOMING ACTIVITIES</div>
          <div className="flex flex-col gap-3">
            {familyEntries.filter((e) => e.type === 'activity').map((e) => (
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

        {/* Memory Log */}
        <div className="card">
          <div className="text-[10px] font-mono text-text-faint mb-4 tracking-widest">MEMORY LOG</div>
          <div className="flex flex-col gap-3">
            {familyEntries.filter((e) => e.type === 'memory').map((e) => (
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
      </div>

      {/* One-off entry SlideOver */}
      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? 'Edit Entry' : 'New Family Entry'}>
        <div className="flex flex-col gap-4">
          <div>
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="activity">Activity</option>
              <option value="memory">Memory</option>
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

      {/* Ritual SlideOver */}
      <SlideOver open={ritualSlideOpen} onClose={closeRitualSlide} title={editingRitual ? 'Edit Ritual' : 'New Ritual'}>
        <div className="flex flex-col gap-4">
          <div>
            <label>Title *</label>
            <input value={ritualForm.title} onChange={(e) => setRitualForm({ ...ritualForm, title: e.target.value })} placeholder="e.g. Sunday morning walk" />
          </div>
          <div>
            <label>Description</label>
            <input value={ritualForm.description} onChange={(e) => setRitualForm({ ...ritualForm, description: e.target.value })} placeholder="optional detail" />
          </div>
          <div>
            <label>Frequency</label>
            <select value={ritualForm.frequency} onChange={(e) => setRitualForm({ ...ritualForm, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label>Notes</label>
            <textarea rows={4} value={ritualForm.notes} onChange={(e) => setRitualForm({ ...ritualForm, notes: e.target.value })} placeholder="Why this matters, ideas, etc." />
          </div>
          <button onClick={saveRitual} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
          {editingRitual && (
            confirmDeleteRitual === editingRitual.id ? (
              <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs text-text-muted mb-3">Delete this ritual?</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteRitual(editingRitual.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30">Yes</button>
                  <button onClick={() => setConfirmDeleteRitual(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDeleteRitual(editingRitual.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">Delete ritual</button>
            )
          )}
        </div>
      </SlideOver>
    </section>
  )
}
