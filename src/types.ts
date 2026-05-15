export interface ExerciseLog {
  id: number
  log_date: string
  type: string // yoga, cardio, walking, etc.
  duration: number
  notes: string | null
  created_at: string
}

export interface MoodLog {
  id: number
  log_date: string
  mood: string // icon key
  notes: string | null
  created_at: string
}
// Type declarations for window.db (IPC bridge)
export interface Goal {
  id: number
  title: string
  life_area: string | null
  why: string | null
  status: string
  progress: number
  priority: number
  target_date: string | null
  created_at: string
  updated_at: string
}

export interface NorthStar {
  id: number
  statement: string
  optimizing_for: string | null
  updated_at: string
}

export interface Habit {
  id: number
  name: string
  category: string | null
  frequency: string
  active: number
  created_at: string
}

export interface HabitLog {
  id: number
  habit_id: number
  logged_date: string
  created_at: string
}

export interface Inspiration {
  id: number
  author: string
  quote: string
  tag: string | null
  pinned: number
  created_at: string
}

export interface Book {
  id: number
  title: string
  author: string
  status: string
  rating: number | null
  notes: string | null
  date_started: string | null
  target_finish: string | null
  date_finished: string | null
  created_at: string
}

export interface Project {
  id: number
  name: string
  description: string | null
  status: string
  progress: number
  links: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FamilyEntry {
  id: number
  type: string
  title: string
  description: string | null
  entry_date: string | null
  completed: number
  created_at: string
}

export interface FamilyRitual {
  id: number
  title: string
  description: string | null
  frequency: string
  notes: string | null
  active: number
  created_at: string
}

export interface FamilyRitualLog {
  id: number
  ritual_id: number
  logged_date: string
  created_at: string
}

export interface HealthCheckin {
  id: number
  week_starting: string
  energy: number | null
  sleep_quality: number | null
  exercise_days: number | null
  mood: number | null
  notes: string | null
  created_at: string
}

export interface CareerEntry {
  id: number
  type: string
  title: string
  description: string | null
  entry_date: string | null
  created_at: string
}

export interface RoadmapTimeline {
  id: number
  label: string
  color: string
  position: number
  created_at: string
}

export interface RoadmapItem {
  id: number
  title: string
  start_timeline_id: number
  end_timeline_id: number
  progress: number
  mindset_note: string
  created_at: string
}

export interface RoadmapPhase {
  id: number
  label: string
  start_timeline_id: number
  end_timeline_id: number
  note: string
  created_at: string
}

export interface PersonalNote {
  id: number
  content: string
  updated_at: string
}

export interface CareerStatus {
  id: number
  role: string
  company: string
  work_type: string
  year_start: string
  year_end: string
  status_label: string
  status_visible: number
  skills_json: string
  building_toward: string
  updated_at: string
}

export interface JournalEntry {
  id: number
  type: 'daily' | 'weekly'
  entry_date: string
  content: string
  coach_feedback: string | null
  polish_output: string | null
  reflect_output: string | null
  pulse_output: string | null
  created_at: string
  updated_at: string
}

export interface CoachSettings {
  id: number
  profile: string
  llm_provider: string
  api_key: string
  ollama_model: string
  updated_at: string
}

declare global {
  interface Window {
    db: {
      northStar: {
        get: () => Promise<NorthStar | undefined>
        upsert: (statement: string, optimizing_for: string) => Promise<void>
      }
      goals: {
        getAll: () => Promise<Goal[]>
        create: (data: Partial<Goal>) => Promise<void>
        update: (id: number, data: Partial<Goal>) => Promise<void>
        delete: (id: number) => Promise<void>
        reorder: (ids: number[]) => Promise<void>
      }
      habits: {
        getAll: () => Promise<Habit[]>
        create: (data: Partial<Habit>) => Promise<void>
        update: (id: number, data: Partial<Habit>) => Promise<void>
        delete: (id: number) => Promise<void>
        getLogs: (days?: number) => Promise<HabitLog[]>
        log: (habit_id: number, logged_date: string) => Promise<void>
        unlog: (habit_id: number, logged_date: string) => Promise<void>
      }
      inspirations: {
        getAll: () => Promise<Inspiration[]>
        create: (data: Partial<Inspiration>) => Promise<void>
        update: (id: number, data: Partial<Inspiration>) => Promise<void>
        delete: (id: number) => Promise<void>
        togglePin: (id: number) => Promise<Inspiration>
      }
      books: {
        getAll: () => Promise<Book[]>
        create: (data: Partial<Book>) => Promise<void>
        update: (id: number, data: Partial<Book>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      projects: {
        getAll: () => Promise<Project[]>
        create: (data: Partial<Project>) => Promise<void>
        update: (id: number, data: Partial<Project>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      family: {
        getAll: () => Promise<FamilyEntry[]>
        create: (data: Partial<FamilyEntry>) => Promise<void>
        update: (id: number, data: Partial<FamilyEntry>) => Promise<void>
        delete: (id: number) => Promise<void>
        rituals: {
          getAll: () => Promise<FamilyRitual[]>
          create: (data: Partial<FamilyRitual>) => Promise<void>
          update: (id: number, data: Partial<FamilyRitual>) => Promise<void>
          delete: (id: number) => Promise<void>
          getLogs: (days?: number) => Promise<FamilyRitualLog[]>
          log: (ritual_id: number, logged_date: string) => Promise<void>
          unlog: (ritual_id: number, logged_date: string) => Promise<void>
        }
      }
      health: {
        getAll: () => Promise<HealthCheckin[]>
        upsert: (data: Partial<HealthCheckin>) => Promise<void>
        exercise: {
          getLogs: (start: string, end: string) => Promise<ExerciseLog[]>
          upsert: (data: Partial<ExerciseLog>) => Promise<void>
          delete: (log_date: string, type: string) => Promise<void>
        }
        mood: {
          getLogs: (start: string, end: string) => Promise<MoodLog[]>
          upsert: (data: Partial<MoodLog>) => Promise<void>
          delete: (log_date: string) => Promise<void>
        }
      }
      career: {
        getAll: () => Promise<CareerEntry[]>
        create: (data: Partial<CareerEntry>) => Promise<void>
        update: (id: number, data: Partial<CareerEntry>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      sectionOrder: {
        get: () => Promise<string[]>
        set: (order: string[]) => Promise<void>
      }
      personalNote: {
        get: () => Promise<PersonalNote | undefined>
        set: (content: string) => Promise<PersonalNote>
      }
      careerStatus: {
        get: () => Promise<CareerStatus | undefined>
        set: (data: Partial<CareerStatus>) => Promise<CareerStatus>
      }
      roadmapTimelines: {
        getAll: () => Promise<RoadmapTimeline[]>
        create: (data: Partial<RoadmapTimeline>) => Promise<void>
        update: (id: number, data: Partial<RoadmapTimeline>) => Promise<void>
        delete: (id: number) => Promise<{ blocked: true } | { blocked: false }>
      }
      roadmapItems: {
        getAll: () => Promise<RoadmapItem[]>
        create: (data: Partial<RoadmapItem>) => Promise<void>
        update: (id: number, data: Partial<RoadmapItem>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      roadmapPhases: {
        getAll: () => Promise<RoadmapPhase[]>
        create: (data: Partial<RoadmapPhase>) => Promise<void>
        update: (id: number, data: Partial<RoadmapPhase>) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      journal: {
        getAll: () => Promise<JournalEntry[]>
        upsert: (type: string, entry_date: string, content: string) => Promise<JournalEntry>
        getCoachFeedback: (type: string, entry_date: string, content: string) => Promise<{ feedback?: string; error?: string }>
        questionOfDay: (entry_date: string) => Promise<{ question?: string; error?: string }>
        reflect: (entry_date: string) => Promise<{ reflect?: string; error?: string }>
        goalCheckPulse: (entry_date: string) => Promise<{ pulse?: string; error?: string }>
        polish: (type: string, entry_date: string, content: string) => Promise<{ polished?: string; error?: string }>
      }
      coachSettings: {
        get: () => Promise<CoachSettings | undefined>
        set: (data: Partial<CoachSettings>) => Promise<CoachSettings>
      }
    }
  }
}
