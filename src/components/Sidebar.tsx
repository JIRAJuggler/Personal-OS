import { NavLink } from 'react-router-dom'
import {
  Home,
  Sparkles,
  Target,
  RefreshCw,
  BookOpen,
  Briefcase,
  Users,
  Heart,
  Settings,
  BookMarked,
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home, end: true },
  { path: '/inspirations', label: 'Inspirations', icon: Sparkles },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/habits', label: 'Habits', icon: RefreshCw },
  { path: '/books', label: 'Books', icon: BookOpen },
  { path: '/journal', label: 'Journal', icon: BookMarked },
  { path: '/career', label: 'Career', icon: Briefcase },

  { path: '/family', label: 'Family', icon: Users },
  { path: '/health', label: 'Health', icon: Heart },
]

interface NavItemProps {
  path: string
  label: string
  icon: React.ElementType
  end?: boolean
}

function NavItem({ path, label, icon: Icon, end }: NavItemProps) {
  return (
    <NavLink
      to={path}
      end={end}
      style={({ isActive }) =>
        isActive
          ? {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#f97316',
              background: 'rgba(249,115,22,0.12)',
              border: '1px solid rgba(249,115,22,0.2)',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }
          : {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#888580',
              border: '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }
      }
    >
      <Icon size={15} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside
      style={{
        width: '220px',
        minWidth: '220px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: '#0f0f0f',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          marginBottom: '28px',
        }}
      >
        <span
          style={{
            color: '#e8e6e1',
            fontWeight: 600,
            fontSize: '13px',
            letterSpacing: '-0.02em',
          }}
        >
          personal.os
        </span>
        <span
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '10px',
            color: '#4a4845',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '1px 6px',
            borderRadius: '4px',
          }}
        >
          v2026.1
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} path={item.path} label={item.label} icon={item.icon} end={item.end} />
        ))}
      </nav>

      {/* Settings pinned at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <NavItem path="/settings" label="Settings" icon={Settings} />
      </div>
    </aside>
  )
}
