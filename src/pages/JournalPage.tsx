import { useState, useEffect, useRef } from 'react'
import { format, startOfWeek, subDays, addDays, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, BookMarked, Sparkles, Loader2, Lightbulb, TrendingUp, Flag } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { JournalEntry } from '../types'

const DAILY_HINT = 'What happened today? What drained you, what energized you? Anything on your mind?'
const WEEKLY_HINT = 'How did the week go overall? What did you learn? What will you do differently next week?'

const navBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '5px',
  cursor: 'pointer',
  color: '#888580',
  padding: '5px 8px',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s ease',
}

// ── Debounced auto-save hook ──────────────────────────────────────────────────
function useAutoSave(type: string, dateKey: string, content: string, onSave: () => void, delay = 800) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onSaveRef = useRef(onSave)
  useEffect(() => { onSaveRef.current = onSave }, [onSave])
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      window.db.journal.upsert(type, dateKey, content).then(() => {
        onSaveRef.current()
      })
    }, delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [type, dateKey, content, delay])
}

// ── Journal Panel ─────────────────────────────────────────────────────────────
function JournalPanel({
  type,
  dateKey,
  label,
  hint,
  entries,
  onRefresh,
}: {
  type: 'daily' | 'weekly'
  dateKey: string
  label: string
  hint: string
  entries: JournalEntry[]
  onRefresh: () => void
}) {
  const entry = entries.find((e) => e.type === type && e.entry_date === dateKey)
  const [content, setContent] = useState(entry?.content ?? '')
  const [feedback, setFeedback] = useState(entry?.coach_feedback ?? '')
  const [polish, setPolish] = useState(entry?.polish_output ?? '')
  const [polishDraft, setPolishDraft] = useState(entry?.polish_output ?? '')
  const [reflect, setReflect] = useState(entry?.reflect_output ?? '')
  const [pulse, setPulse] = useState(entry?.pulse_output ?? '')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [polishLoading, setPolishLoading] = useState(false)
  const [reflectLoading, setReflectLoading] = useState(false)
  const [pulseLoading, setPulseLoading] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showPolishPreview, setShowPolishPreview] = useState(Boolean(entry?.polish_output))
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when navigating to a different date
  useEffect(() => {
    const e = entries.find((e) => e.type === type && e.entry_date === dateKey)
    setContent(e?.content ?? '')
    setFeedback(e?.coach_feedback ?? '')
    setPolish(e?.polish_output ?? '')
    setPolishDraft(e?.polish_output ?? '')
    setReflect(e?.reflect_output ?? '')
    setPulse(e?.pulse_output ?? '')
    setShowPolishPreview(Boolean(e?.polish_output))
    setQuestion('')
    setError('')
  }, [dateKey, type, entries])

  function handleSave() {
    setSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
    onRefresh()
  }

  useAutoSave(type, dateKey, content, handleSave)

  async function askCoach() {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await window.db.journal.getCoachFeedback(type, dateKey, content)
      if (result.error) setError(result.error)
      else if (result.feedback) { setFeedback(result.feedback); onRefresh() }
    } finally {
      setLoading(false)
    }
  }

  async function getQuestion() {
    setQuestionLoading(true)
    setError('')
    try {
      const result = await window.db.journal.questionOfDay(dateKey)
      if (result.error) setError(result.error)
      else if (result.question) setQuestion(result.question)
    } finally {
      setQuestionLoading(false)
    }
  }

  async function getReflect() {
    setReflectLoading(true)
    setError('')
    try {
      const result = await window.db.journal.reflect(dateKey)
      if (result.error) setError(result.error)
      else if (result.reflect) { setReflect(result.reflect); onRefresh() }
    } finally {
      setReflectLoading(false)
    }
  }

  async function getPulse() {
    setPulseLoading(true)
    setError('')
    try {
      const result = await window.db.journal.goalCheckPulse(dateKey)
      if (result.error) setError(result.error)
      else if (result.pulse) { setPulse(result.pulse); onRefresh() }
    } finally {
      setPulseLoading(false)
    }
  }

  async function polishWriting() {
    if (!content.trim()) return
    setPolishLoading(true)
    setError('')
    try {
      const result = await window.db.journal.polish(type, dateKey, content)
      if (result.error) setError(result.error)
      else if (result.polished) {
        setPolish(result.polished)
        setPolishDraft(result.polished)
        setShowPolishPreview(true)
        onRefresh()
      }
    } finally {
      setPolishLoading(false)
    }
  }

  function applyPolish() {
    if (!polishDraft.trim()) return
    setContent(polishDraft)
    setShowPolishPreview(false)
  }

  const isDaily = type === 'daily'
  const accentColor  = isDaily ? '#f97316' : '#a78bfa'
  const accentBg     = isDaily ? 'rgba(249,115,22,0.06)' : 'rgba(167,139,250,0.06)'
  const accentBorder = isDaily ? 'rgba(249,115,22,0.2)'  : 'rgba(167,139,250,0.2)'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <BookMarked size={13} color={accentColor} />
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: accentColor, letterSpacing: '0.08em' }}>
              {isDaily ? 'DAILY REFLECTION' : 'WEEKLY REVIEW'}
            </span>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#e8e6e1' }}>{label}</div>
        </div>
        {saved && (
          <span style={{ fontSize: '11px', color: '#4ade80', fontFamily: 'monospace', marginTop: '4px' }}>
            saved ✓
          </span>
        )}
      </div>

      {/* Hint */}
      <p style={{ fontSize: '12px', color: '#4a4845', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{hint}</p>

      {/* Question of the day prompt (daily only) */}
      {isDaily && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={getQuestion}
            disabled={questionLoading}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '5px',
              color: '#888580',
              fontSize: '12px',
              cursor: questionLoading ? 'default' : 'pointer',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { if (!questionLoading) (e.currentTarget as HTMLElement).style.color = '#e8e6e1' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#888580' }}
          >
            {questionLoading ? <Loader2 size={11} className="animate-spin" /> : <Lightbulb size={11} />}
            {questionLoading ? 'Generating…' : "Today's prompt"}
          </button>
          {question && (
            <div style={{ padding: '12px 14px', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '6px', fontSize: '13px', color: '#fed7aa', lineHeight: 1.6, fontStyle: 'italic' }}>
              {question}
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing..."
        style={{
          minHeight: '200px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '14px 16px',
          color: '#d4d0cb',
          fontSize: '14px',
          lineHeight: 1.75,
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s ease',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = accentBorder)}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={askCoach}
          disabled={loading || !content.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: accentBg,
            border: `1px solid ${accentBorder}`,
            borderRadius: '6px',
            color: accentColor,
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading || !content.trim() ? 'default' : 'pointer',
            opacity: !content.trim() ? 0.4 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? 'Thinking…' : 'Ask my coach'}
        </button>

        <button
          onClick={polishWriting}
          disabled={polishLoading || !content.trim()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '6px',
            color: '#86efac',
            fontSize: '13px',
            fontWeight: 500,
            cursor: polishLoading || !content.trim() ? 'default' : 'pointer',
            opacity: !content.trim() ? 0.4 : (polishLoading ? 0.7 : 1),
            transition: 'opacity 0.15s ease',
          }}
        >
          {polishLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {polishLoading ? 'Polishing…' : 'Polish writing'}
        </button>

        {!isDaily && (
          <>
            <button
              onClick={getReflect}
              disabled={reflectLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'rgba(167,139,250,0.06)',
                border: '1px solid rgba(167,139,250,0.15)',
                borderRadius: '6px',
                color: '#c4b5fd',
                fontSize: '13px',
                fontWeight: 500,
                cursor: reflectLoading ? 'default' : 'pointer',
                opacity: reflectLoading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {reflectLoading ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
              {reflectLoading ? 'Finding patterns…' : 'Find patterns'}
            </button>
            <button
              onClick={getPulse}
              disabled={pulseLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.15)',
                borderRadius: '6px',
                color: '#fbbf24',
                fontSize: '13px',
                fontWeight: 500,
                cursor: pulseLoading ? 'default' : 'pointer',
                opacity: pulseLoading ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {pulseLoading ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />}
              {pulseLoading ? 'Checking pulse…' : 'Goal-check pulse'}
            </button>
          </>
        )}
      </div>

      {showPolishPreview && polishDraft && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '14px',
            background: 'rgba(34,197,94,0.04)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#86efac', letterSpacing: '0.08em' }}>
            SUGGESTED WRITING
          </div>
          <textarea
            value={polishDraft}
            onChange={(e) => setPolishDraft(e.target.value)}
            style={{
              minHeight: '150px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '6px',
              padding: '12px',
              color: '#d1d5db',
              fontSize: '13px',
              lineHeight: 1.7,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)')}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={applyPolish}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '6px',
                color: '#86efac',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Save to journal
            </button>
            <button
              onClick={() => setShowPolishPreview(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '6px',
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#f87171', fontSize: '12px', lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {/* Coach feedback */}
      {feedback && (
        <div style={{ borderLeft: `3px solid ${accentColor}`, paddingLeft: '16px', paddingTop: '2px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: accentColor, marginBottom: '8px', letterSpacing: '0.08em' }}>
            COACH
          </div>
          <p style={{ fontSize: '13px', color: '#d4d0cb', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {feedback}
          </p>
        </div>
      )}

      {/* Reflect output (weekly only) */}
      {!isDaily && reflect && (
        <div style={{ borderLeft: '3px solid #c4b5fd', paddingLeft: '16px', paddingTop: '2px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#c4b5fd', marginBottom: '8px', letterSpacing: '0.08em' }}>
            PATTERNS
          </div>
          <p style={{ fontSize: '13px', color: '#d4d0cb', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {reflect}
          </p>
        </div>
      )}

      {/* Pulse output (weekly only) */}
      {!isDaily && pulse && (
        <div style={{ borderLeft: '3px solid #fbbf24', paddingLeft: '16px', paddingTop: '2px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24', marginBottom: '8px', letterSpacing: '0.08em' }}>
            GOAL-CHECK PULSE
          </div>
          <p style={{ fontSize: '13px', color: '#d4d0cb', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {pulse}
          </p>
        </div>
      )}
    </div>
  )
}

// ── History Sidebar ───────────────────────────────────────────────────────────
function groupByMonth(entries: JournalEntry[]): { label: string; entries: JournalEntry[] }[] {
  const map = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const key = format(parseISO(e.entry_date), 'MMM yyyy')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }))
}

function HistorySidebar({
  entries,
  activeDaily,
  activeWeekly,
  onSelectDaily,
  onSelectWeekly,
}: {
  entries: JournalEntry[]
  activeDaily: string
  activeWeekly: string
  onSelectDaily: (date: string) => void
  onSelectWeekly: (date: string) => void
}) {
  const daily = entries.filter((e) => e.type === 'daily' && e.content.trim())
  const weekly = entries.filter((e) => e.type === 'weekly' && e.content.trim())

  function EntryRow({ entry, isActive, accent, onSelect }: {
    entry: JournalEntry
    isActive: boolean
    accent: string
    onSelect: () => void
  }) {
    const dateLabel = entry.type === 'daily'
      ? format(parseISO(entry.entry_date), 'EEE, d MMM')
      : `Wk of ${format(parseISO(entry.entry_date), 'MMM d')}`
    const preview = entry.content.slice(0, 50).replace(/\n/g, ' ')
    const accentRgb = accent === '#f97316' ? '249,115,22' : '167,139,250'
    return (
      <button
        onClick={onSelect}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: isActive ? `rgba(${accentRgb},0.08)` : 'none',
          border: 'none',
          borderLeft: isActive ? `2px solid ${accent}` : '2px solid transparent',
          borderRadius: '0 4px 4px 0',
          padding: '6px 8px',
          cursor: 'pointer',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
          <span style={{ fontSize: '11px', fontWeight: 500, color: isActive ? accent : '#d4d0cb' }}>{dateLabel}</span>
          {entry.coach_feedback && <Sparkles size={8} color={accent} />}
        </div>
        {preview && (
          <span style={{ fontSize: '10px', color: '#4a4845', lineHeight: 1.4, display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '175px' }}>
            {preview}{entry.content.length > 50 ? '…' : ''}
          </span>
        )}
      </button>
    )
  }

  function Section({ label, sectionEntries, activeKey, accent, onSelect }: {
    label: string
    sectionEntries: JournalEntry[]
    activeKey: string
    accent: string
    onSelect: (date: string) => void
  }) {
    const groups = groupByMonth(sectionEntries)
    return (
      <div>
        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '6px', paddingLeft: '8px' }}>
          {label}
        </div>
        {groups.length === 0 ? (
          <p style={{ fontSize: '11px', color: '#3a3836', paddingLeft: '8px', fontStyle: 'italic', margin: 0 }}>No entries yet</p>
        ) : (
          groups.map(({ label: monthLabel, entries: monthEntries }) => (
            <div key={monthLabel} style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', color: '#3a3836', fontFamily: 'monospace', paddingLeft: '8px', marginBottom: '2px', letterSpacing: '0.06em' }}>
                {monthLabel}
              </div>
              {monthEntries.map((e) => (
                <EntryRow
                  key={e.id}
                  entry={e}
                  isActive={e.entry_date === activeKey}
                  accent={accent}
                  onSelect={() => onSelect(e.entry_date)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Section label="DAILY" sectionEntries={daily} activeKey={activeDaily} accent="#f97316" onSelect={onSelectDaily} />
      <Section label="WEEKLY" sectionEntries={weekly} activeKey={activeWeekly} accent="#a78bfa" onSelect={onSelectWeekly} />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JournalPage() {
  const { journalEntries, refreshJournal } = useAppStore()

  const [dailyDate, setDailyDate]   = useState(new Date())
  const [weeklyDate, setWeeklyDate] = useState(new Date())

  const todayKey    = format(new Date(), 'yyyy-MM-dd')
  const dailyKey    = format(dailyDate, 'yyyy-MM-dd')
  const weeklyMonday = startOfWeek(weeklyDate, { weekStartsOn: 1 })
  const weeklyKey   = format(weeklyMonday, 'yyyy-MM-dd')
  const thisWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const dailyLabel  = format(dailyDate, 'EEE, d MMM yyyy')
  const weeklyLabel = `Week of ${format(weeklyMonday, 'MMM d, yyyy')}`

  function handleSelectDaily(dateStr: string) {
    setDailyDate(parseISO(dateStr))
  }
  function handleSelectWeekly(dateStr: string) {
    setWeeklyDate(parseISO(dateStr))
  }

  return (
    <div style={{ padding: '48px 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '12px' }}>
          09 — journal
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#e8e6e1', marginBottom: '8px' }}>Journal</h2>
        <p style={{ color: '#888580', fontSize: '14px' }}>Daily reflections and weekly reviews. Call your coach when you want a second opinion.</p>
      </div>

      {/* Three-column layout: sidebar | daily | weekly */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '32px', alignItems: 'start' }}>

        {/* ── Sidebar ── */}
        <div style={{ position: 'sticky', top: '24px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <HistorySidebar
            entries={journalEntries}
            activeDaily={dailyKey}
            activeWeekly={weeklyKey}
            onSelectDaily={handleSelectDaily}
            onSelectWeekly={handleSelectWeekly}
          />
        </div>

        {/* ── Daily column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              style={navBtnStyle}
              onClick={() => setDailyDate((d) => subDays(d, 1))}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#e8e6e1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888580' }}>{dailyLabel}</span>
            <button
              style={{ ...navBtnStyle, opacity: dailyKey >= todayKey ? 0.3 : 1, cursor: dailyKey >= todayKey ? 'default' : 'pointer' }}
              onClick={() => { if (dailyKey < todayKey) setDailyDate((d) => addDays(d, 1)) }}
              onMouseEnter={(e) => { if (dailyKey < todayKey) (e.currentTarget as HTMLElement).style.color = '#e8e6e1' }}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <JournalPanel
            type="daily"
            dateKey={dailyKey}
            label={dailyLabel}
            hint={DAILY_HINT}
            entries={journalEntries}
            onRefresh={refreshJournal}
          />
        </div>

        {/* ── Weekly column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              style={navBtnStyle}
              onClick={() => setWeeklyDate((d) => subDays(d, 7))}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#e8e6e1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888580' }}>{weeklyLabel}</span>
            <button
              style={{ ...navBtnStyle, opacity: weeklyKey >= thisWeekKey ? 0.3 : 1, cursor: weeklyKey >= thisWeekKey ? 'default' : 'pointer' }}
              onClick={() => { if (weeklyKey < thisWeekKey) setWeeklyDate((d) => addDays(d, 7)) }}
              onMouseEnter={(e) => { if (weeklyKey < thisWeekKey) (e.currentTarget as HTMLElement).style.color = '#e8e6e1' }}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <JournalPanel
            type="weekly"
            dateKey={weeklyKey}
            label={weeklyLabel}
            hint={WEEKLY_HINT}
            entries={journalEntries}
            onRefresh={refreshJournal}
          />
        </div>
      </div>
    </div>
  )
}
