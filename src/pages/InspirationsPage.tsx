import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import InspirationsSection from '../sections/InspirationsSection'

export const INSPIRATIONS_HOME_COUNT_KEY = 'inspirations_home_count'

export default function InspirationsPage() {
  const { inspirations } = useAppStore()
  const pinnedCount = inspirations.filter((i) => i.pinned === 1).length

  const [homeCount, setHomeCount] = useState<number>(() => {
    const stored = localStorage.getItem(INSPIRATIONS_HOME_COUNT_KEY)
    return stored ? Math.max(1, Math.min(4, parseInt(stored, 10))) : 4
  })

  function handleCountChange(n: number) {
    setHomeCount(n)
    localStorage.setItem(INSPIRATIONS_HOME_COUNT_KEY, String(n))
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>
      <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontFamily: 'monospace', color: '#888580' }}>
          <span>★ {pinnedCount}/4 starred</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span>Show on Home:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => handleCountChange(n)}
                style={{
                  width: '24px', height: '24px', borderRadius: '4px',
                  background: homeCount === n ? 'rgba(249,115,22,0.15)' : 'transparent',
                  border: homeCount === n ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: homeCount === n ? '#f97316' : '#4a4845',
                  fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s ease',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4a4845' }}>max 4 · oldest unstarred when limit reached</span>
      </div>
      <InspirationsSection index={1} />
    </div>
  )
}

