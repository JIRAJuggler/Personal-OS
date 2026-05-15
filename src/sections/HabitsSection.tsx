import { useState } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, subDays, subWeeks, subMonths,
  startOfWeek, startOfMonth, endOfMonth,
  addMonths, addYears,
  eachDayOfInterval, isSameMonth,
  getDate, getMonth, getYear, getDay,
} from 'date-fns'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import type { Habit, HabitLog } from '../types'

interface Props {
  index: number
}

// ── Period helpers ────────────────────────────────────────────────────────────

function isoWeek(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}
function isoMonth(date: Date) {
  return format(startOfMonth(date), 'yyyy-MM')
}

/** All ISO week Mondays within the quarter of viewDate */
function getQuarterWeeks(viewDate: Date): Date[] {
  const month = getMonth(viewDate)
  const year = getYear(viewDate)
  const qStartMonth = Math.floor(month / 3) * 3
  const qStart = new Date(year, qStartMonth, 1)
  const qEnd = new Date(year, qStartMonth + 3, 0)
  const weeks: Date[] = []
  let monday = startOfWeek(qStart, { weekStartsOn: 1 })
  if (monday.getTime() < qStart.getTime()) monday = new Date(monday.getTime() + 7 * 86400000)
  while (monday.getTime() <= qEnd.getTime()) {
    weeks.push(new Date(monday.getTime()))
    monday = new Date(monday.getTime() + 7 * 86400000)
  }
  return weeks
}

/** Completion rate for the current running period */
function getCompletionRate(logs: HabitLog[], habit_id: number, frequency: string): string {
  const now = new Date()
  if (frequency === 'daily') {
    const daysElapsed = getDate(now)
    let done = 0
    for (let i = 0; i < daysElapsed; i++) {
      if (isLoggedInPeriod(logs, habit_id, format(subDays(now, i), 'yyyy-MM-dd'), 'daily')) done++
    }
    return `${done}/${daysElapsed} this month`
  }
  if (frequency === 'weekly') {
    const currentWeekStr = isoWeek(now)
    const allWeeks = getQuarterWeeks(now)
    const elapsed = allWeeks.filter((w) => isoWeek(w) <= currentWeekStr)
    const done = elapsed.filter((w) => isLoggedInPeriod(logs, habit_id, isoWeek(w), 'weekly')).length
    return `${done}/${elapsed.length} this quarter`
  }
  if (frequency === 'monthly') {
    const monthsElapsed = getMonth(now) + 1
    const year = getYear(now)
    let done = 0
    for (let m = 0; m < monthsElapsed; m++) {
      if (isLoggedInPeriod(logs, habit_id, format(new Date(year, m, 1), 'yyyy-MM'), 'monthly')) done++
    }
    return `${done}/${monthsElapsed} this year`
  }
  return ''
}

/** Does the habit have a log entry in the given period? */
function isLoggedInPeriod(logs: HabitLog[], habit_id: number, period: string, frequency: string) {
  return logs.some((l) => {
    if (l.habit_id !== habit_id) return false
    if (frequency === 'weekly') return isoWeek(new Date(l.logged_date + 'T00:00:00')) === period
    if (frequency === 'monthly') return l.logged_date.slice(0, 7) === period
    return l.logged_date === period
  })
}

/** Canonical log date to use for a period (used when toggling) */
function canonicalDate(period: string, frequency: string) {
  if (frequency === 'weekly') return period          // Monday of that week
  if (frequency === 'monthly') return period + '-01' // 1st of month
  return period
}

/** Streak in number of consecutive periods */
function getStreak(logs: HabitLog[], habit_id: number, frequency: string) {
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 52; i++) {
    let period: string
    if (frequency === 'weekly')       period = isoWeek(subWeeks(now, i))
    else if (frequency === 'monthly') period = isoMonth(subMonths(now, i))
    else                              period = format(subDays(now, i), 'yyyy-MM-dd')

    if (isLoggedInPeriod(logs, habit_id, period, frequency)) streak++
    else break
  }
  return streak
}

function streakLabel(streak: number, frequency: string) {
  if (streak === 0) return 'no streak'
  const unit = frequency === 'weekly' ? 'wk' : frequency === 'monthly' ? 'mo' : 'd'
  return `${streak}${unit} streak`
}

// ── Calendar components ───────────────────────────────────────────────────────

const DAY_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function CalNav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <button
        onClick={onPrev}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', padding: '2px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
      >
        <ChevronLeft size={12} />
      </button>
      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580', letterSpacing: '0.04em' }}>{label}</span>
      <button
        onClick={onNext}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', padding: '2px 4px', borderRadius: '3px', display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
      >
        <ChevronRight size={12} />
      </button>
    </div>
  )
}

function DailyCalendar({ habit, logs, onToggle }: { habit: Habit; logs: HabitLog[]; onToggle: (p: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date())
  const today = format(new Date(), 'yyyy-MM-dd')
  const firstDay = startOfMonth(viewDate)
  const lastDay = endOfMonth(viewDate)
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 })
  const lastDayOfWeek = getDay(lastDay)
  const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek
  const gridEnd = new Date(lastDay.getTime() + daysToSunday * 86400000)
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })
  return (
    <div>
      <CalNav
        label={format(viewDate, 'MMMM yyyy')}
        onPrev={() => setViewDate(addMonths(viewDate, -1))}
        onNext={() => setViewDate(addMonths(viewDate, 1))}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '3px' }}>
        {DAY_HEADERS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: '#4a4845', fontFamily: 'monospace', paddingBottom: '2px' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {allDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const inMonth = isSameMonth(day, viewDate)
          const logged = inMonth && isLoggedInPeriod(logs, habit.id, dateStr, 'daily')
          const isCurrent = dateStr === today
          return (
            <button
              key={dateStr}
              onClick={() => { if (inMonth) onToggle(dateStr) }}
              style={{
                padding: '4px 1px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                textAlign: 'center',
                background: logged ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.02)',
                color: logged ? '#22c55e' : inMonth ? '#a8a29e' : '#2a2826',
                border: isCurrent ? '1px solid rgba(249,115,22,0.5)' : logged ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                cursor: inMonth ? 'pointer' : 'default',
              }}
            >
              {getDate(day)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyCalendar({ habit, logs, onToggle }: { habit: Habit; logs: HabitLog[]; onToggle: (p: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date())
  const currentWeekStr = isoWeek(new Date())
  const month = getMonth(viewDate)
  const year = getYear(viewDate)
  const quarter = Math.floor(month / 3) + 1
  const weeks = getQuarterWeeks(viewDate)
  return (
    <div>
      <CalNav
        label={`Q${quarter} ${year}`}
        onPrev={() => setViewDate(addMonths(viewDate, -3))}
        onNext={() => setViewDate(addMonths(viewDate, 3))}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {weeks.map((monday) => {
          const period = isoWeek(monday)
          const logged = isLoggedInPeriod(logs, habit.id, period, 'weekly')
          const isCurrent = period === currentWeekStr
          return (
            <button
              key={period}
              onClick={() => onToggle(period)}
              style={{
                padding: '6px 4px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'monospace',
                textAlign: 'center',
                background: logged ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.02)',
                color: logged ? '#22c55e' : '#a8a29e',
                border: isCurrent ? '1px solid rgba(249,115,22,0.5)' : logged ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {format(monday, 'MMM d')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MonthlyCalendar({ habit, logs, onToggle }: { habit: Habit; logs: HabitLog[]; onToggle: (p: string) => void }) {
  const [viewDate, setViewDate] = useState(new Date())
  const currentMonthStr = isoMonth(new Date())
  const year = getYear(viewDate)
  return (
    <div>
      <CalNav
        label={String(year)}
        onPrev={() => setViewDate(addYears(viewDate, -1))}
        onNext={() => setViewDate(addYears(viewDate, 1))}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {MONTH_NAMES.map((name, i) => {
          const period = format(new Date(year, i, 1), 'yyyy-MM')
          const logged = isLoggedInPeriod(logs, habit.id, period, 'monthly')
          const isCurrent = period === currentMonthStr
          return (
            <button
              key={period}
              onClick={() => onToggle(period)}
              style={{
                padding: '8px 4px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                textAlign: 'center',
                background: logged ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.02)',
                color: logged ? '#22c55e' : '#a8a29e',
                border: isCurrent ? '1px solid rgba(249,115,22,0.5)' : logged ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                cursor: 'pointer',
              }}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function HabitsSection({ index }: Props) {
  const { habits, habitLogs, refreshHabits } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', category: '', frequency: 'daily' })

  const label = `${(index + 1).toString().padStart(2, '0')} — daily system`

  async function toggleLog(habit: Habit, period: string) {
    const logDate = canonicalDate(period, habit.frequency)
    if (isLoggedInPeriod(habitLogs, habit.id, period, habit.frequency)) {
      await window.db.habits.unlog(habit.id, logDate)
    } else {
      await window.db.habits.log(habit.id, logDate)
    }
    await refreshHabits()
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', category: '', frequency: 'daily' })
    setSlideOpen(true)
  }
  function openEdit(h: Habit) {
    setEditing(h)
    setForm({ name: h.name, category: h.category ?? '', frequency: h.frequency })
    setSlideOpen(true)
  }
  function closeSlide() {
    setSlideOpen(false)
    setEditing(null)
    setConfirmDelete(null)
  }

  async function save() {
    if (!form.name.trim()) return
    if (editing) {
      await window.db.habits.update(editing.id, form)
    } else {
      await window.db.habits.create(form)
    }
    await refreshHabits()
    closeSlide()
  }

  async function handleDelete(id: number) {
    await window.db.habits.delete(id)
    await refreshHabits()
    closeSlide()
  }

  return (
    <section data-section-id="habits" id="habits" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
        <button onClick={openAdd} className="text-xs text-text-faint hover:text-text-muted transition-colors">
          + add habit
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <RefreshCw size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Habits</h2>
      </div>

      <div className="flex flex-col gap-4">
        {habits.map((h) => {
          const streak = getStreak(habitLogs, h.id, h.frequency)
          const rate = getCompletionRate(habitLogs, h.id, h.frequency)
          return (
            <div key={h.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span className="text-sm font-medium text-text-primary">{h.name}</span>
                    {h.category && (
                      <span className="text-[10px] font-mono text-text-faint px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                        {h.category}
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: '#f97316', border: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.06)' }}>
                      {h.frequency}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#4a4845' }}>{streakLabel(streak, h.frequency)}</span>
                    {rate && <span style={{ fontSize: '10px', color: '#2a2826' }}>·</span>}
                    {rate && <span style={{ fontSize: '11px', color: '#4a4845' }}>{rate}</span>}
                  </div>
                </div>
                <button onClick={() => openEdit(h)} className="text-text-faint hover:text-text-muted transition-colors text-xs shrink-0">✎</button>
              </div>
              {h.frequency === 'daily'   && <DailyCalendar   habit={h} logs={habitLogs} onToggle={(p) => toggleLog(h, p)} />}
              {h.frequency === 'weekly'  && <WeeklyCalendar  habit={h} logs={habitLogs} onToggle={(p) => toggleLog(h, p)} />}
              {h.frequency === 'monthly' && <MonthlyCalendar habit={h} logs={habitLogs} onToggle={(p) => toggleLog(h, p)} />}
            </div>
          )
        })}
      </div>

      <SlideOver open={slideOpen} onClose={closeSlide} title={editing ? 'Edit Habit' : 'New Habit'}>
        <div className="flex flex-col gap-4">
          <div>
            <label>Habit name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label>Category</label>
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="health, mindset, learning..." />
          </div>
          <div>
            <label>Frequency</label>
            <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button onClick={save} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">
            Save
          </button>
          {editing && (
            <>
              {confirmDelete === editing.id ? (
                <div className="mt-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-xs text-text-muted mb-3">Archive this habit?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(editing.id)} className="flex-1 py-1.5 rounded text-xs text-red-400 border border-red-800/30">Yes, archive</button>
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 rounded text-xs text-text-muted">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(editing.id)} className="mt-1 text-xs text-text-faint hover:text-red-400 transition-colors">
                  Archive habit
                </button>
              )}
            </>
          )}
        </div>
      </SlideOver>
    </section>
  )
}
