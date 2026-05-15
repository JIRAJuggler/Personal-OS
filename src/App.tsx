import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import GoalsPage from './pages/GoalsPage'
import InspirationsPage from './pages/InspirationsPage'
import HabitsPage from './pages/HabitsPage'
import BooksPage from './pages/BooksPage'
import CareerPage from './pages/CareerPage'
import FamilyPage from './pages/FamilyPage'
import HealthPage from './pages/HealthPage'
import SettingsPage from './pages/SettingsPage'
import JournalPage from './pages/JournalPage'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const loadAll = useAppStore((s) => s.loadAll)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/inspirations" element={<InspirationsPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/career" element={<CareerPage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
