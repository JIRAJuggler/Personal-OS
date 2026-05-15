import { create } from 'zustand'
import type { Goal, NorthStar, Habit, HabitLog, Inspiration, Book, Project, FamilyEntry, FamilyRitual, FamilyRitualLog, HealthCheckin, CareerEntry, PersonalNote, CareerStatus, JournalEntry, RoadmapTimeline, RoadmapItem, RoadmapPhase } from '../types'

interface AppState {
  northStar: NorthStar | null
  goals: Goal[]
  habits: Habit[]
  habitLogs: HabitLog[]
  inspirations: Inspiration[]
  books: Book[]
  projects: Project[]
  familyEntries: FamilyEntry[]
  rituals: FamilyRitual[]
  ritualLogs: FamilyRitualLog[]
  healthCheckins: HealthCheckin[]
  careerEntries: CareerEntry[]
  sectionOrder: string[]
  personalNote: PersonalNote | null
  careerStatus: CareerStatus | null
  journalEntries: JournalEntry[]
  roadmapTimelines: RoadmapTimeline[]
  roadmapItems: RoadmapItem[]
  roadmapPhases: RoadmapPhase[]

  loadAll: () => Promise<void>
  refreshGoals: () => Promise<void>
  refreshInspirations: () => Promise<void>
  refreshHabits: () => Promise<void>
  refreshBooks: () => Promise<void>
  refreshProjects: () => Promise<void>
  refreshFamily: () => Promise<void>
  refreshRituals: () => Promise<void>
  refreshHealth: () => Promise<void>
  refreshCareer: () => Promise<void>
  refreshNorthStar: () => Promise<void>
  refreshPersonalNote: () => Promise<void>
  refreshCareerStatus: () => Promise<void>
  refreshJournal: () => Promise<void>
  refreshRoadmapTimelines: () => Promise<void>
  refreshRoadmapItems: () => Promise<void>
  refreshRoadmapPhases: () => Promise<void>
  setSectionOrder: (order: string[]) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  northStar: null,
  goals: [],
  habits: [],
  habitLogs: [],
  inspirations: [],
  books: [],
  projects: [],
  familyEntries: [],
  rituals: [],
  ritualLogs: [],
  healthCheckins: [],
  careerEntries: [],
  sectionOrder: ['goals', 'habits', 'books', 'career', 'family', 'health', 'journal'],
  personalNote: null,
  careerStatus: null,
  journalEntries: [],
  roadmapTimelines: [],
  roadmapItems: [],
  roadmapPhases: [],

  loadAll: async () => {
    const [northStar, goals, habits, habitLogs, inspirations, books, projects, familyEntries, rituals, ritualLogs, healthCheckins, careerEntries, sectionOrder, personalNote, careerStatus, journalEntries, roadmapTimelines, roadmapItems, roadmapPhases] = await Promise.all([
      window.db.northStar.get(),
      window.db.goals.getAll(),
      window.db.habits.getAll(),
      window.db.habits.getLogs(365),
      window.db.inspirations.getAll(),
      window.db.books.getAll(),
      window.db.projects.getAll(),
      window.db.family.getAll(),
      window.db.family.rituals.getAll(),
      window.db.family.rituals.getLogs(365),
      window.db.health.getAll(),
      window.db.career.getAll(),
      window.db.sectionOrder.get(),
      window.db.personalNote.get(),
      window.db.careerStatus.get(),
      window.db.journal.getAll(),
      window.db.roadmapTimelines.getAll(),
      window.db.roadmapItems.getAll(),
      window.db.roadmapPhases.getAll(),
    ])
    set({ northStar: northStar ?? null, goals, habits, habitLogs, inspirations, books, projects, familyEntries, rituals, ritualLogs, healthCheckins, careerEntries, sectionOrder, personalNote: personalNote ?? null, careerStatus: careerStatus ?? null, journalEntries, roadmapTimelines, roadmapItems, roadmapPhases })
  },

  refreshNorthStar: async () => {
    const northStar = await window.db.northStar.get()
    set({ northStar: northStar ?? null })
  },
  refreshGoals: async () => set({ goals: await window.db.goals.getAll() }),
  refreshInspirations: async () => set({ inspirations: await window.db.inspirations.getAll() }),
  refreshHabits: async () => {
    const [habits, habitLogs] = await Promise.all([window.db.habits.getAll(), window.db.habits.getLogs(365)])
    set({ habits, habitLogs })
  },
  refreshBooks: async () => set({ books: await window.db.books.getAll() }),
  refreshProjects: async () => set({ projects: await window.db.projects.getAll() }),
  refreshFamily: async () => set({ familyEntries: await window.db.family.getAll() }),
  refreshRituals: async () => {
    const [rituals, ritualLogs] = await Promise.all([window.db.family.rituals.getAll(), window.db.family.rituals.getLogs(365)])
    set({ rituals, ritualLogs })
  },
  refreshHealth: async () => set({ healthCheckins: await window.db.health.getAll() }),
  refreshCareer: async () => set({ careerEntries: await window.db.career.getAll() }),
  refreshPersonalNote: async () => {
    const personalNote = await window.db.personalNote.get()
    set({ personalNote: personalNote ?? null })
  },
  refreshCareerStatus: async () => {
    const careerStatus = await window.db.careerStatus.get()
    set({ careerStatus: careerStatus ?? null })
  },

  refreshJournal: async () => set({ journalEntries: await window.db.journal.getAll() }),
  refreshRoadmapTimelines: async () => set({ roadmapTimelines: await window.db.roadmapTimelines.getAll() }),
  refreshRoadmapItems: async () => set({ roadmapItems: await window.db.roadmapItems.getAll() }),
  refreshRoadmapPhases: async () => set({ roadmapPhases: await window.db.roadmapPhases.getAll() }),

  setSectionOrder: async (order: string[]) => {
    await window.db.sectionOrder.set(order)
    set({ sectionOrder: order })
  },
}))
