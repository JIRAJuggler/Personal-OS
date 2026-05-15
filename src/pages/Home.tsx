import { useState, useCallback, useEffect } from 'react'
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, getDate, getMonth, getYear, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical,
  Target,
  Sparkles,
  RefreshCw,
  BookOpen,
  Briefcase,
  Users,
  Heart,
  Pencil,
  BookMarked,
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'

// ── Personal Note Card ────────────────────────────────────────────────────────
function PersonalNoteCard() {
  const { personalNote, refreshPersonalNote } = useAppStore()
  const [slideOpen, setSlideOpen] = useState(false)
  const [draft, setDraft] = useState('')

  function openEdit() {
    setDraft(personalNote?.content ?? '')
    setSlideOpen(true)
  }
  async function save() {
    await window.db.personalNote.set(draft)
    await refreshPersonalNote()
    setSlideOpen(false)
  }

  const hasContent = personalNote && personalNote.content.trim().length > 0

  return (
    <>
      <div style={{ display: 'flex', background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden', marginBottom: '40px' }}>
        <div style={{ width: '3px', background: '#f97316', flexShrink: 0, borderRadius: '10px 0 0 10px' }} />
        <div style={{ flex: 1, padding: '20px 24px 16px' }}>
          {hasContent ? (
            <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#d4d0cb', lineHeight: 1.7, margin: 0 }}>
              {personalNote.content}
            </p>
          ) : (
            <p style={{ fontSize: '15px', fontStyle: 'italic', color: '#4a4845', lineHeight: 1.7, margin: 0 }}>
              Write a note to yourself — a reminder of who you are and what you're about.
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              onClick={openEdit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '11px', fontFamily: 'monospace', padding: 0, transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
            >
              <Pencil size={11} />
              edit note
            </button>
          </div>
        </div>
      </div>

      <SlideOver open={slideOpen} onClose={() => setSlideOpen(false)} title="Personal Note">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label>Your personal note</label>
            <textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="A mantra, a reminder, an intention..." style={{ resize: 'vertical' }} />
            <p style={{ fontSize: '12px', color: '#4a4845', marginTop: '6px' }}>
              This is just for you. A mantra, a reminder, an intention.
            </p>
          </div>
          <button onClick={save} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </SlideOver>
    </>
  )
}

// ── Inspirations Panel (beside Hero, non-draggable) ───────────────────────────
const INSPIRATIONS_HOME_COUNT_KEY = 'inspirations_home_count'

function InspirationsPanel() {
  const { inspirations } = useAppStore()
  const homeCount = Math.max(1, Math.min(4, parseInt(localStorage.getItem(INSPIRATIONS_HOME_COUNT_KEY) ?? '4', 10)))
  const pinned = inspirations.filter((i) => i.pinned === 1)
  const toShow = pinned.slice(0, homeCount)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '14px' }}>
        <Sparkles size={10} />INSPIRATIONS
      </div>
      {toShow.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#4a4845', lineHeight: 1.6 }}>No inspirations yet. <Link to="/inspirations" style={{ color: '#f97316', textDecoration: 'none' }}>Add some</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
          {toShow.map((insp) => (
            <div key={insp.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#f97316', marginBottom: '4px' }}>{insp.author}</div>
              <p style={{ fontSize: '11px', color: '#e8e6e1', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{insp.quote}</p>
            </div>
          ))}
        </div>
      )}
      <Link to="/inspirations" style={{ display: 'inline-block', marginTop: '12px', fontSize: '11px', fontFamily: 'monospace', color: '#4a4845', textDecoration: 'none', transition: 'color 0.15s ease' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f97316')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}>
        → manage inspirations
      </Link>
    </div>
  )
}

// ── Module content components ─────────────────────────────────────────────────

function GoalsContent() {
  const { goals, northStar } = useAppStore()
  const active = [...goals]
    .filter((g) => g.status === 'active')
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999) || a.id - b.id)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {northStar && (
        <div style={{ padding: '10px 12px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '6px', marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#f97316', marginBottom: '4px' }}>NORTH STAR</div>
          <p style={{ fontSize: '12px', color: '#e8e6e1', lineHeight: 1.5, margin: 0 }}>{northStar.statement}</p>
        </div>
      )}
      {active.slice(0, 4).map((g, i) => {
        const pct = g.progress ?? 0
        const done = pct >= 100
        const barColor = i === 0 ? '#f97316' : i === 1 ? '#f59e0b' : i === 2 ? '#84cc16' : '#a8a29e'
        return (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0, background: done ? '#22c55e' : 'transparent', border: `2px solid ${done ? '#22c55e' : '#f97316'}` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: done ? '#4a4845' : '#e8e6e1', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>{g.title}</div>
              <div className="progress-bar" style={{ height: '3px' }}><div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} /></div>
            </div>
            <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 600, flexShrink: 0 }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

function HabitsContent() {
  const { habits, habitLogs, refreshHabits } = useAppStore()
  const active = habits.filter((h) => h.active === 1)

  const today       = format(new Date(), 'yyyy-MM-dd')
  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM')

  function isoWeekKey(d: Date)  { return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd') }
  function isoMonthKey(d: Date) { return format(startOfMonth(d), 'yyyy-MM') }

  function isLoggedPeriod(habit_id: number, period: string, frequency: string) {
    return habitLogs.some((l) => {
      if (l.habit_id !== habit_id) return false
      if (frequency === 'weekly')  return isoWeekKey(new Date(l.logged_date + 'T00:00:00')) === period
      if (frequency === 'monthly') return l.logged_date.slice(0, 7) === period
      return l.logged_date === period
    })
  }

  function getQuarterWeeks(): Date[] {
    const now = new Date()
    const month = getMonth(now)
    const year = getYear(now)
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

  function getCompletionRate(habit_id: number, frequency: string): string {
    const now = new Date()
    if (frequency === 'daily') {
      const daysElapsed = getDate(now)
      let done = 0
      for (let i = 0; i < daysElapsed; i++) {
        if (isLoggedPeriod(habit_id, format(subDays(now, i), 'yyyy-MM-dd'), 'daily')) done++
      }
      return `${done}/${daysElapsed} this month`
    }
    if (frequency === 'weekly') {
      const currentWeekStr = isoWeekKey(now)
      const allWeeks = getQuarterWeeks()
      const elapsed = allWeeks.filter((w) => isoWeekKey(w) <= currentWeekStr)
      const done = elapsed.filter((w) => isLoggedPeriod(habit_id, isoWeekKey(w), 'weekly')).length
      return `${done}/${elapsed.length} this quarter`
    }
    if (frequency === 'monthly') {
      const monthsElapsed = getMonth(now) + 1
      const year = getYear(now)
      let done = 0
      for (let m = 0; m < monthsElapsed; m++) {
        if (isLoggedPeriod(habit_id, format(new Date(year, m, 1), 'yyyy-MM'), 'monthly')) done++
      }
      return `${done}/${monthsElapsed} this year`
    }
    return ''
  }

  function getStreak(habit_id: number, frequency: string) {
    let streak = 0
    for (let i = 0; i < 52; i++) {
      const period =
        frequency === 'weekly'  ? isoWeekKey(subWeeks(new Date(), i)) :
        frequency === 'monthly' ? isoMonthKey(subMonths(new Date(), i)) :
        format(subDays(new Date(), i), 'yyyy-MM-dd')
      if (isLoggedPeriod(habit_id, period, frequency)) streak++
      else break
    }
    return streak
  }

  async function toggleCurrent(h: { id: number; frequency: string }) {
    const logDate =
      h.frequency === 'weekly'  ? currentWeek :
      h.frequency === 'monthly' ? currentMonth + '-01' : today
    const logged = isLoggedPeriod(h.id, h.frequency === 'weekly' ? currentWeek : h.frequency === 'monthly' ? currentMonth : today, h.frequency)
    if (logged) await window.db.habits.unlog(h.id, logDate)
    else        await window.db.habits.log(h.id, logDate)
    await refreshHabits()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {active.map((h) => {
        const streak    = getStreak(h.id, h.frequency)
        const curPeriod = h.frequency === 'weekly' ? currentWeek : h.frequency === 'monthly' ? currentMonth : today
        const curLogged = isLoggedPeriod(h.id, curPeriod, h.frequency)
        const unit      = h.frequency === 'weekly' ? 'wk' : h.frequency === 'monthly' ? 'mo' : 'd'
        return (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => toggleCurrent(h)}
              style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, background: curLogged ? 'rgba(34,197,94,0.15)' : 'transparent', border: `1.5px solid ${curLogged ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', padding: 0 }}
            >
              {curLogged && <span style={{ color: '#22c55e', fontSize: '11px', lineHeight: 1 }}>✓</span>}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: '#e8e6e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '3px' }}>
                {h.name}
                <span style={{ marginLeft: '6px', fontSize: '10px', color: '#4a4845', fontFamily: 'monospace' }}>
                  {streak > 0 ? `${streak}${unit} streak` : 'no streak'}
                </span>
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', marginTop: '1px' }}>
                {getCompletionRate(h.id, h.frequency)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BooksContent() {
  const { books } = useAppStore()
  const reading = books.filter((b) => b.status === 'reading')
  const queue = books.filter((b) => b.status === 'want_to_read').slice(0, 3)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {reading.length === 0 && queue.length === 0 && <p style={{ fontSize: '12px', color: '#4a4845' }}>No books tracked yet.</p>}
      {reading.map((b) => (
        <div key={b.id} style={{ padding: '8px 10px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#e8e6e1', fontWeight: 500 }}>{b.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: '#888580' }}>{b.author}</span>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '1px 6px', borderRadius: '4px' }}>reading</span>
          </div>
        </div>
      ))}
      {queue.length > 0 && (
        <div style={{ marginTop: reading.length > 0 ? '4px' : '0' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', marginBottom: '5px' }}>UP NEXT</div>
          {queue.map((b) => <div key={b.id} style={{ fontSize: '12px', color: '#888580', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</div>)}
        </div>
      )}
    </div>
  )
}


function FamilyContent() {
  const { familyEntries, rituals } = useAppStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const upcoming = familyEntries
    .filter((e) => e.type === 'activity' && e.completed === 0 && e.entry_date != null && e.entry_date >= today)
    .sort((a, b) => (a.entry_date ?? '').localeCompare(b.entry_date ?? ''))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <div style={{ fontWeight: 600, color: '#f97316', fontSize: '11px', fontFamily: 'monospace', marginBottom: '4px' }}>Upcoming Activities</div>
        {upcoming.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#4a4845', lineHeight: 1.5, margin: 0 }}>No upcoming activities.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcoming.slice(0, 4).map((e) => {
              const date = e.entry_date ? format(parseISO(e.entry_date), 'MMM d') : ''
              return (
                <div key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#f97316', background: 'rgba(249,115,22,0.08)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0, marginTop: '1px' }}>{date}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#e8e6e1', fontWeight: 500 }}>{e.title}</div>
                    {e.description && <div style={{ fontSize: '11px', color: '#4a4845', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: '#f97316', fontSize: '11px', fontFamily: 'monospace', marginBottom: '4px' }}>Active Rituals</div>
        {rituals.filter(r => r.active === 1).length === 0 ? (
          <p style={{ fontSize: '12px', color: '#4a4845', lineHeight: 1.5, margin: 0 }}>No active rituals.</p>
        ) : (
          <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {rituals.filter(r => r.active === 1).map((r) => (
              <li key={r.id} style={{ fontSize: '12px', color: '#e8e6e1', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {r.title}
                {r.description && <span style={{ color: '#4a4845', fontSize: '11px', marginLeft: '6px' }}>– {r.description}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function HealthContent() {
  const [exerciseLogs, setExerciseLogs] = useState<Array<{ log_date: string; type: string }>>([])
  const [todayMood, setTodayMood]       = useState<string | null>(null)

  useEffect(() => {
    const today     = format(new Date(), 'yyyy-MM-dd')
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    window.db.health.exercise.getLogs(weekStart, today).then(logs => setExerciseLogs(logs as any)).catch(() => {})
    window.db.health.mood.getLogs(today, today).then(logs => setTodayMood((logs as any)[0]?.mood ?? null)).catch(() => {})
  }, [])

  const EXERCISE_ICONS: Record<string, string> = {
    yoga: '🧘', cardio: '🏃', walking: '🚶', strength: '🏋️', cycling: '🚴', swimming: '🏊',
  }
  const MOOD_ICONS: Record<string, string> = {
    great: '😄', good: '🙂', okay: '😐', meh: '😑', sad: '😔', anxious: '😰', tired: '😴', energized: '⚡',
  }

  const exerciseDays  = new Set(exerciseLogs.map(l => l.log_date)).size
  const exerciseTypes = [...new Set(exerciseLogs.map(l => l.type))]

  return (
    <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '4px' }}>EXERCISE THIS WEEK</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#f97316' }}>
          {exerciseDays}<span style={{ fontSize: '11px', fontWeight: 400, color: '#888580' }}> days</span>
        </div>
        {exerciseTypes.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
            {exerciseTypes.map(t => (
              <span key={t} title={t} style={{ fontSize: '17px' }}>{EXERCISE_ICONS[t] ?? '🏋️'}</span>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '4px' }}>MOOD TODAY</div>
        {todayMood
          ? <div style={{ fontSize: '30px', lineHeight: 1 }}>{MOOD_ICONS[todayMood] ?? '😐'}</div>
          : <div style={{ fontSize: '13px', color: '#4a4845', fontFamily: 'monospace', paddingTop: '4px' }}>—</div>
        }
      </div>
    </div>
  )
}

function CareerContent() {
  const { careerStatus, projects } = useAppStore()
  if (!careerStatus) return <p style={{ fontSize: '12px', color: '#4a4845' }}>Loading...</p>
  const skills: string[] = (() => { try { return JSON.parse(careerStatus.skills_json ?? '[]') } catch { return [] } })()
  const displayProjects = projects.filter((p) => p.status === 'active' || p.status === 'exploring')
  const statusColors: Record<string, { color: string; bg: string; border: string }> = {
    active:    { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)' },
    exploring: { color: '#888580', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
    idea:      { color: '#888580', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
    'on hold': { color: '#b8b014', bg: 'rgba(184,176,20,0.06)',  border: 'rgba(184,176,20,0.2)' },
    done:      { color: '#4a4845', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '0' }}>
      {/* Left: Current role */}
      <div style={{ paddingRight: '24px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '10px' }}>CURRENTLY</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e8e6e1', lineHeight: 1.2 }}>{careerStatus.role || '—'}</div>
          {careerStatus.status_visible === 1 && careerStatus.status_label && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontFamily: 'monospace', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 10px', borderRadius: '999px', flexShrink: 0 }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />{careerStatus.status_label}
            </span>
          )}
        </div>
        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580', marginBottom: '14px' }}>
          @ {careerStatus.company || '—'} · {careerStatus.work_type || '—'} · {careerStatus.year_start}{careerStatus.year_end ? ` → ${careerStatus.year_end}` : ' → now'}
        </div>
        {skills.length > 0 && (
          <>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '7px' }}>SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
              {skills.map((s) => (
                <span key={s} style={{ fontSize: '11px', color: '#d4d0cb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', padding: '2px 9px', borderRadius: '999px' }}>{s}</span>
              ))}
            </div>
          </>
        )}
        {careerStatus.building_toward && (
          <>
            <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '7px' }}>BUILDING TOWARD</div>
            <p style={{ fontSize: '12px', color: '#888580', lineHeight: 1.6, margin: 0 }}>{careerStatus.building_toward}</p>
          </>
        )}
      </div>
      {/* Right: Projects */}
      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '24px' }}>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '10px' }}>ACTIVE PROJECTS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayProjects.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#4a4845' }}>No active projects</span>
          ) : displayProjects.map((p) => {
            const s = statusColors[p.status] ?? statusColors['idea']
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8e6e1', marginBottom: '2px' }}>{p.name}</div>
                  {p.description && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580' }}>{p.description}</div>}
                </div>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>{p.status}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Journal mini card ─────────────────────────────────────────────────────────
function JournalContent() {
  const { journalEntries } = useAppStore()
  const todayKey    = format(new Date(), 'yyyy-MM-dd')
  const thisWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const todayEntry = journalEntries.find((e) => e.type === 'daily'  && e.entry_date === todayKey    && e.content.trim())
  const weekEntry  = journalEntries.find((e) => e.type === 'weekly' && e.entry_date === thisWeekKey && e.content.trim())

  // Daily writing streak
  let streak = 0
  let d = new Date()
  while (journalEntries.some((e) => e.type === 'daily' && e.entry_date === format(d, 'yyyy-MM-dd') && e.content.trim())) {
    streak++
    d = subDays(d, 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 1, padding: '10px 12px', background: todayEntry ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${todayEntry ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', marginBottom: '4px' }}>TODAY</div>
          <div style={{ fontSize: '12px', color: todayEntry ? '#22c55e' : '#4a4845' }}>{todayEntry ? 'written ✓' : 'not yet'}</div>
        </div>
        <div style={{ flex: 1, padding: '10px 12px', background: weekEntry ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${weekEntry ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '6px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', marginBottom: '4px' }}>THIS WEEK</div>
          <div style={{ fontSize: '12px', color: weekEntry ? '#a78bfa' : '#4a4845' }}>{weekEntry ? 'written ✓' : 'not yet'}</div>
        </div>
      </div>
      {streak > 0 && (
        <div style={{ fontSize: '11px', color: '#4a4845', fontFamily: 'monospace' }}>{streak}d writing streak</div>
      )}
    </div>
  )
}

// ── Section registry ──────────────────────────────────────────────────────────
const SECTION_META: Record<string, { label: string; icon: React.ElementType; path: string; Content: React.ComponentType }> = {
  goals:   { label: 'Goals',   icon: Target,      path: '/goals',   Content: GoalsContent   },
  habits:  { label: 'Habits',  icon: RefreshCw,   path: '/habits',  Content: HabitsContent  },
  books:   { label: 'Books',   icon: BookOpen,    path: '/books',   Content: BooksContent   },
  family:  { label: 'Family',  icon: Users,       path: '/family',  Content: FamilyContent  },
  health:  { label: 'Health',  icon: Heart,       path: '/health',  Content: HealthContent  },
  career:  { label: 'Career',  icon: Briefcase,   path: '/career',  Content: CareerContent  },
  journal: { label: 'Journal', icon: BookMarked,  path: '/journal', Content: JournalContent },
}

// ── Sortable card ─────────────────────────────────────────────────────────────
function SortableCard({ id, isDragging }: { id: string; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const meta = SECTION_META[id]
  if (!meta) return null
  const { label, icon: Icon, path, Content } = meta
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, gridColumn: id === 'career' ? 'span 2' : undefined }}>
      <div className="card" style={{ position: 'relative', minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
        <div
          {...attributes} {...listeners}
          style={{ position: 'absolute', top: '10px', right: '10px', color: '#4a4845', cursor: 'grab', padding: '2px', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
        >
          <GripVertical size={13} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Icon size={14} color="#f97316" />
          <span style={{ color: '#e8e6e1', fontWeight: 600, fontSize: '13px' }}>{label}</span>
        </div>
        <div style={{ flex: 1 }}><Content /></div>
        <Link
          to={path}
          style={{ display: 'inline-flex', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#4a4845', fontSize: '11px', fontFamily: 'monospace', textDecoration: 'none', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f97316')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
        >
          → Go to {label}
        </Link>
      </div>
    </div>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const { sectionOrder, setSectionOrder } = useAppStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => setActiveId(event.active.id as string), [])
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as string)
      const newIndex = sectionOrder.indexOf(over.id as string)
      setSectionOrder(arrayMove(sectionOrder, oldIndex, newIndex))
    }
  }, [sectionOrder, setSectionOrder])

  const today = format(new Date(), 'dd MMM yyyy')
  const validOrder = sectionOrder.filter((id) => id in SECTION_META)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 40px' }}>
      {/* Hero + Inspirations Panel row */}
      <div style={{ display: 'grid', gridTemplateColumns: '55% 1fr', marginBottom: '40px', position: 'relative' }}>
        {/* Hero */}
        <div style={{ paddingRight: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.08)', color: '#4a4845', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', marginBottom: '28px' }}>
            <span>⬡</span><span>system online · {today}</span>
          </div>
          <h1 style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
            <span style={{ color: '#e8e6e1' }}>A quiet dashboard /</span><br />
            <span style={{ color: '#f97316' }}>for a deliberate life.</span>
          </h1>
          <p style={{ color: '#888580', fontSize: '14px', maxWidth: '400px', lineHeight: 1.7 }}>Goals, work, and health — in one place. A personal OS I tend to like a garden.</p>
        </div>
        {/* Vertical divider */}
        <div style={{ position: 'absolute', left: '55%', top: '0', bottom: '0', width: '1px', background: 'rgba(255,255,255,0.06)' }} />
        {/* Inspirations panel */}
        <div style={{ paddingLeft: '40px' }}><InspirationsPanel /></div>
      </div>

      <PersonalNoteCard />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={validOrder} strategy={rectSortingStrategy}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {validOrder.map((id) => (
              <SortableCard key={id} id={id} isDragging={activeId === id} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(249,115,22,0.4)', borderRadius: '10px', padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: '#e8e6e1', opacity: 0.85 }}>
              {SECTION_META[activeId]?.label ?? activeId}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <div style={{ height: '60px' }} />
    </div>
  )
}
