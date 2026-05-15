import { useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { Heart } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth,
  eachDayOfInterval, subMonths, addMonths, parseISO,
} from 'date-fns'
import type { ExerciseLog, MoodLog } from '../types'

interface Props {
  index: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EXERCISE_TYPES = [
  { key: 'yoga',     label: 'Yoga',     icon: '🧘' },
  { key: 'cardio',   label: 'Cardio',   icon: '🏃' },
  { key: 'walking',  label: 'Walking',  icon: '🚶' },
  { key: 'strength', label: 'Strength', icon: '🏋️' },
  { key: 'cycling',  label: 'Cycling',  icon: '🚴' },
  { key: 'swimming', label: 'Swimming', icon: '🏊' },
]

const MOOD_OPTIONS = [
  { key: 'great',     label: 'Great',     icon: '😄' },
  { key: 'good',      label: 'Good',      icon: '🙂' },
  { key: 'okay',      label: 'Okay',      icon: '😐' },
  { key: 'meh',       label: 'Meh',       icon: '😑' },
  { key: 'sad',       label: 'Sad',       icon: '😔' },
  { key: 'anxious',   label: 'Anxious',   icon: '😰' },
  { key: 'tired',     label: 'Tired',     icon: '😴' },
  { key: 'energized', label: 'Energized', icon: '⚡' },
]

const navBtn: CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '4px',
  color: '#888580',
  cursor: 'pointer',
  fontSize: '16px',
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ── Exercise Calendar ─────────────────────────────────────────────────────────
function ExerciseCalendar() {
  const [month, setMonth]               = useState(new Date())
  const [logs, setLogs]                 = useState<ExerciseLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingTypes, setEditingTypes] = useState<Record<string, number>>({})
  const [saving, setSaving]             = useState(false)

  const loadLogs = useCallback(async (m: Date) => {
    const start = format(startOfMonth(m), 'yyyy-MM-dd')
    const end   = format(endOfMonth(m),   'yyyy-MM-dd')
    setLogs(await window.db.health.exercise.getLogs(start, end))
  }, [])

  useEffect(() => { loadLogs(month) }, [month, loadLogs])

  const days   = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const offset = (startOfMonth(month).getDay() + 6) % 7
  const today  = format(new Date(), 'yyyy-MM-dd')

  function getLogsForDate(dateStr: string) {
    return logs.filter(l => l.log_date === dateStr)
  }

  function openDay(dateStr: string) {
    if (selectedDate === dateStr) { setSelectedDate(null); return }
    const init: Record<string, number> = {}
    getLogsForDate(dateStr).forEach(l => { init[l.type] = l.duration })
    setEditingTypes(init)
    setSelectedDate(dateStr)
  }

  function toggleType(key: string) {
    setEditingTypes(prev => {
      const next = { ...prev }
      if (key in next) delete next[key]
      else next[key] = 30
      return next
    })
  }

  async function saveDay() {
    if (!selectedDate) return
    setSaving(true)
    try {
      const existing = getLogsForDate(selectedDate)
      for (const l of existing) {
        if (!(l.type in editingTypes)) await window.db.health.exercise.delete(selectedDate, l.type)
      }
      for (const [type, duration] of Object.entries(editingTypes)) {
        if (duration > 0) await window.db.health.exercise.upsert({ log_date: selectedDate, type, duration })
      }
      await loadLogs(month)
      setSelectedDate(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580', letterSpacing: '0.1em' }}>EXERCISE DAYS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={navBtn} onClick={() => setMonth(m => subMonths(m, 1))}>‹</button>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e8e6e1', minWidth: '108px', textAlign: 'center' }}>
            {format(month, 'MMMM yyyy')}
          </span>
          <button style={navBtn} onClick={() => setMonth(m => addMonths(m, 1))}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', paddingBottom: '4px' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayLogs = getLogsForDate(dateStr)
          const isSel   = selectedDate === dateStr
          const isToday = dateStr === today
          return (
            <button key={dateStr} onClick={() => openDay(dateStr)} style={{
              padding: '5px 2px', borderRadius: '6px',
              border:      isSel    ? '1.5px solid #f97316'
                         : isToday  ? '1px solid rgba(249,115,22,0.35)'
                         :            '1px solid rgba(255,255,255,0.05)',
              background:  isSel           ? 'rgba(249,115,22,0.08)'
                         : dayLogs.length > 0 ? 'rgba(34,197,94,0.06)'
                         :                   'rgba(255,255,255,0.02)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', minHeight: '44px', transition: 'all 0.1s',
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: isToday ? '#f97316' : '#888580' }}>
                {format(day, 'd')}
              </span>
              {dayLogs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1px' }}>
                  {dayLogs.map(l => {
                    const et = EXERCISE_TYPES.find(e => e.key === l.type)
                    return <span key={l.type} title={`${et?.label ?? l.type}: ${l.duration}min`} style={{ fontSize: '11px', lineHeight: 1 }}>{et?.icon ?? '🏋️'}</span>
                  })}
                </div>
              )}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <div style={{ marginTop: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e8e6e1' }}>
              {format(parseISO(selectedDate), 'EEE, MMM d')}
            </span>
            <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#4a4845', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '14px' }}>
            {EXERCISE_TYPES.map(et => {
              const active = et.key in editingTypes
              return (
                <button key={et.key} onClick={() => toggleType(et.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 11px', borderRadius: '999px',
                  border:     active ? '1.5px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', color: active ? '#f97316' : '#888580',
                  fontSize: '12px', fontFamily: 'monospace', transition: 'all 0.1s',
                }}>
                  <span style={{ fontSize: '14px' }}>{et.icon}</span>{et.label}
                </button>
              )
            })}
          </div>
          {Object.entries(editingTypes).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {Object.entries(editingTypes).map(([type, duration]) => {
                const et = EXERCISE_TYPES.find(e => e.key === type)
                return (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', width: '22px', textAlign: 'center' }}>{et?.icon}</span>
                    <span style={{ fontSize: '12px', color: '#d4d0cb', fontFamily: 'monospace', width: '68px' }}>{et?.label}</span>
                    <input
                      type="number" min={1} max={480} value={duration}
                      onChange={e => setEditingTypes(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                      style={{ width: '66px', padding: '4px 8px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e8e6e1', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                    />
                    <span style={{ fontSize: '11px', color: '#4a4845', fontFamily: 'monospace' }}>min</span>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveDay} disabled={saving} style={{ padding: '6px 18px', borderRadius: '6px', background: '#f97316', border: 'none', color: 'white', fontSize: '12px', fontFamily: 'monospace', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setSelectedDate(null)} style={{ padding: '6px 14px', borderRadius: '6px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#888580', fontSize: '12px', fontFamily: 'monospace', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mood Calendar ─────────────────────────────────────────────────────────────
function MoodCalendar() {
  const [month, setMonth]               = useState(new Date())
  const [logs, setLogs]                 = useState<MoodLog[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const loadLogs = useCallback(async (m: Date) => {
    const start = format(startOfMonth(m), 'yyyy-MM-dd')
    const end   = format(endOfMonth(m),   'yyyy-MM-dd')
    setLogs(await window.db.health.mood.getLogs(start, end))
  }, [])

  useEffect(() => { loadLogs(month) }, [month, loadLogs])

  const days   = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const offset = (startOfMonth(month).getDay() + 6) % 7
  const today  = format(new Date(), 'yyyy-MM-dd')

  function getLog(dateStr: string) {
    return logs.find(l => l.log_date === dateStr)
  }

  async function pickMood(dateStr: string, moodKey: string) {
    try {
      if (getLog(dateStr)?.mood === moodKey) {
        await window.db.health.mood.delete(dateStr)
      } else {
        await window.db.health.mood.upsert({ log_date: dateStr, mood: moodKey })
      }
      await loadLogs(month)
      setSelectedDate(null)
    } catch (err) {
      console.error('mood save error:', err)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580', letterSpacing: '0.1em' }}>MOOD</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={navBtn} onClick={() => setMonth(m => subMonths(m, 1))}>‹</button>
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e8e6e1', minWidth: '108px', textAlign: 'center' }}>
            {format(month, 'MMMM yyyy')}
          </span>
          <button style={navBtn} onClick={() => setMonth(m => addMonths(m, 1))}>›</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
        {DAY_LABELS.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', paddingBottom: '4px' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {Array.from({ length: offset }).map((_, i) => <div key={`b${i}`} />)}
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const log     = getLog(dateStr)
          const mood    = MOOD_OPTIONS.find(m => m.key === log?.mood)
          const isSel   = selectedDate === dateStr
          const isToday = dateStr === today
          return (
            <button key={dateStr} onClick={() => setSelectedDate(isSel ? null : dateStr)} style={{
              padding: '5px 2px', borderRadius: '6px',
              border:     isSel   ? '1.5px solid #a78bfa'
                        : isToday ? '1px solid rgba(167,139,250,0.35)'
                        :           '1px solid rgba(255,255,255,0.05)',
              background: isSel ? 'rgba(167,139,250,0.08)'
                        : log  ? 'rgba(167,139,250,0.05)'
                        :        'rgba(255,255,255,0.02)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '2px', minHeight: '44px', transition: 'all 0.1s',
            }}>
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: isToday ? '#a78bfa' : '#888580' }}>
                {format(day, 'd')}
              </span>
              {mood && <span title={mood.label} style={{ fontSize: '14px', lineHeight: 1 }}>{mood.icon}</span>}
            </button>
          )
        })}
      </div>
      {selectedDate && (
        <div style={{ marginTop: '12px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e8e6e1' }}>
              {format(parseISO(selectedDate), 'EEE, MMM d')} — how are you feeling?
            </span>
            <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#4a4845', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {MOOD_OPTIONS.map(opt => {
              const isActive = getLog(selectedDate)?.mood === opt.key
              return (
                <button key={opt.key} onClick={() => pickMood(selectedDate, opt.key)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                  padding: '8px 12px', borderRadius: '8px',
                  border:     isActive ? '1.5px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}>
                  <span style={{ fontSize: '22px' }}>{opt.icon}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: isActive ? '#a78bfa' : '#4a4845' }}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Section ──────────────────────────────────────────────────────────────
export default function HealthSection({ index }: Props) {
  const label = `${(index + 1).toString().padStart(2, '0')} — how I'm doing`

  return (
    <section data-section-id="health" id="health" className="scroll-mt-16">
      <div className="flex items-center justify-between mb-2">
        <span className="section-label">{label}</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <Heart size={18} className="text-accent" />
        <h2 className="text-xl font-bold text-text-primary">Health</h2>
      </div>

      {/* Exercise + Mood calendar tracking */}
      <div className="card" style={{ marginTop: '24px', padding: '22px 24px' }}>
        <ExerciseCalendar />
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '28px 0' }} />
        <MoodCalendar />
      </div>
    </section>
  )
}
