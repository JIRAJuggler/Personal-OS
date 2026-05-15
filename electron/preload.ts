import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('db', {
  northStar: {
    get: () => ipcRenderer.invoke('northStar:get'),
    upsert: (statement: string, optimizing_for: string) => ipcRenderer.invoke('northStar:upsert', statement, optimizing_for),
  },
  goals: {
    getAll: () => ipcRenderer.invoke('goals:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('goals:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('goals:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('goals:delete', id),
    reorder: (ids: number[]) => ipcRenderer.invoke('goals:reorder', ids),
  },
  habits: {
    getAll: () => ipcRenderer.invoke('habits:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('habits:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('habits:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('habits:delete', id),
    getLogs: (days?: number) => ipcRenderer.invoke('habits:getLogs', days),
    log: (habit_id: number, logged_date: string) => ipcRenderer.invoke('habits:log', habit_id, logged_date),
    unlog: (habit_id: number, logged_date: string) => ipcRenderer.invoke('habits:unlog', habit_id, logged_date),
  },
  inspirations: {
    getAll: () => ipcRenderer.invoke('inspirations:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('inspirations:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('inspirations:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('inspirations:delete', id),
    togglePin: (id: number) => ipcRenderer.invoke('inspirations:togglePin', id),
  },
  books: {
    getAll: () => ipcRenderer.invoke('books:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('books:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('books:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('books:delete', id),
  },
  projects: {
    getAll: () => ipcRenderer.invoke('projects:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('projects:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('projects:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('projects:delete', id),
  },
  family: {
    getAll: () => ipcRenderer.invoke('family:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('family:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('family:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('family:delete', id),
    rituals: {
      getAll: () => ipcRenderer.invoke('family:rituals:getAll'),
      create: (data: unknown) => ipcRenderer.invoke('family:rituals:create', data),
      update: (id: number, data: unknown) => ipcRenderer.invoke('family:rituals:update', id, data),
      delete: (id: number) => ipcRenderer.invoke('family:rituals:delete', id),
      getLogs: (days?: number) => ipcRenderer.invoke('family:rituals:getLogs', days),
      log: (ritual_id: number, logged_date: string) => ipcRenderer.invoke('family:rituals:log', ritual_id, logged_date),
      unlog: (ritual_id: number, logged_date: string) => ipcRenderer.invoke('family:rituals:unlog', ritual_id, logged_date),
    },
  },
  health: {
    getAll: () => ipcRenderer.invoke('health:getAll'),
    upsert: (data: unknown) => ipcRenderer.invoke('health:upsert', data),
    exercise: {
      getLogs: (start: string, end: string) => ipcRenderer.invoke('health:exercise:getLogs', start, end),
      upsert: (data: unknown) => ipcRenderer.invoke('health:exercise:upsert', data),
      delete: (log_date: string, type: string) => ipcRenderer.invoke('health:exercise:delete', log_date, type),
    },
    mood: {
      getLogs: (start: string, end: string) => ipcRenderer.invoke('health:mood:getLogs', start, end),
      upsert: (data: unknown) => ipcRenderer.invoke('health:mood:upsert', data),
      delete: (log_date: string) => ipcRenderer.invoke('health:mood:delete', log_date),
    },
  },
  career: {
    getAll: () => ipcRenderer.invoke('career:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('career:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('career:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('career:delete', id),
  },
  roadmapTimelines: {
    getAll: () => ipcRenderer.invoke('roadmapTimelines:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('roadmapTimelines:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('roadmapTimelines:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('roadmapTimelines:delete', id),
  },
  roadmapItems: {
    getAll: () => ipcRenderer.invoke('roadmapItems:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('roadmapItems:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('roadmapItems:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('roadmapItems:delete', id),
  },
  roadmapPhases: {
    getAll: () => ipcRenderer.invoke('roadmapPhases:getAll'),
    create: (data: unknown) => ipcRenderer.invoke('roadmapPhases:create', data),
    update: (id: number, data: unknown) => ipcRenderer.invoke('roadmapPhases:update', id, data),
    delete: (id: number) => ipcRenderer.invoke('roadmapPhases:delete', id),
  },
  sectionOrder: {
    get: () => ipcRenderer.invoke('sectionOrder:get'),
    set: (order: string[]) => ipcRenderer.invoke('sectionOrder:set', order),
  },
  personalNote: {
    get: () => ipcRenderer.invoke('personalNote:get'),
    set: (content: string) => ipcRenderer.invoke('personalNote:set', content),
  },
  careerStatus: {
    get: () => ipcRenderer.invoke('careerStatus:get'),
    set: (data: unknown) => ipcRenderer.invoke('careerStatus:set', data),
  },
  journal: {
    getAll: () => ipcRenderer.invoke('journal:getAll'),
    upsert: (type: string, entry_date: string, content: string) => ipcRenderer.invoke('journal:upsert', type, entry_date, content),
    getCoachFeedback: (type: string, entry_date: string, content: string) => ipcRenderer.invoke('journal:getCoachFeedback', type, entry_date, content),
    questionOfDay: (entry_date: string) => ipcRenderer.invoke('journal:questionOfDay', entry_date),
    reflect: (entry_date: string) => ipcRenderer.invoke('journal:reflect', entry_date),
    goalCheckPulse: (entry_date: string) => ipcRenderer.invoke('journal:goalCheckPulse', entry_date),
    polish: (type: string, entry_date: string, content: string) => ipcRenderer.invoke('journal:polish', type, entry_date, content),
  },
  coachSettings: {
    get: () => ipcRenderer.invoke('coachSettings:get'),
    set: (data: unknown) => ipcRenderer.invoke('coachSettings:set', data),
  },
})
