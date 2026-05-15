import { useEffect, useState } from 'react'
import { format } from 'date-fns'

const NAV_LINKS = [
  { id: 'goals', label: 'goals' },
  { id: 'inspirations', label: 'inspirations' },
  { id: 'habits', label: 'habits' },
  { id: 'books', label: 'books' },
  { id: 'projects', label: 'projects' },
  { id: 'family', label: 'family' },
  { id: 'health', label: 'health' },
  { id: 'career', label: 'career' },
]

export default function NavBar() {
  const [time, setTime] = useState(format(new Date(), 'HH:mm'))
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(format(new Date(), 'HH:mm'))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    const sections = document.querySelectorAll('[data-section-id]')
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    const el = document.querySelector(`[data-section-id="${id}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 shrink-0"
      style={{ background: 'rgba(13,13,13,0.95)', backdropFilter: 'blur(8px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 min-w-[160px]">
        <span className="text-text-primary font-semibold text-sm tracking-tight">personal.os</span>
        <span
          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
          style={{ color: '#4a4845', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          v2026.1
        </span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map((link) => {
          const isActive = activeSection === link.id
          return (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer"
              style={
                isActive
                  ? {
                      background: 'rgba(249,115,22,0.15)',
                      color: '#f97316',
                      border: '1px solid rgba(249,115,22,0.3)',
                    }
                  : {
                      color: '#888580',
                      border: '1px solid transparent',
                    }
              }
            >
              {link.label}
            </button>
          )
        })}
      </div>

      {/* Clock */}
      <div className="min-w-[160px] flex justify-end">
        <span className="font-mono text-sm" style={{ color: '#4a4845' }}>
          {time}
        </span>
      </div>
    </nav>
  )
}
