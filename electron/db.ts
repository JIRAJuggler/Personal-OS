import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const dbPath = path.join(app.getPath('userData'), 'personal-os.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS exercise_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date DATE NOT NULL,
  type TEXT NOT NULL, -- yoga, cardio, walking, etc.
  duration INTEGER NOT NULL, -- minutes
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(log_date, type)
);

CREATE TABLE IF NOT EXISTS mood_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  log_date DATE NOT NULL,
  mood TEXT NOT NULL, -- e.g. happy, sad, calm, etc. (icon key)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(log_date)
);
CREATE TABLE IF NOT EXISTS north_star (
  id INTEGER PRIMARY KEY,
  statement TEXT NOT NULL,
  optimizing_for TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  life_area TEXT,
  why TEXT,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  target_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  frequency TEXT DEFAULT 'daily',
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER REFERENCES habits(id),
  logged_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspirations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  quote TEXT NOT NULL,
  tag TEXT,
  pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT DEFAULT 'want_to_read',
  rating INTEGER,
  notes TEXT,
  date_started DATE,
  date_finished DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'idea',
  progress INTEGER DEFAULT 0,
  links TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entry_date DATE,
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_rituals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS family_ritual_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ritual_id INTEGER NOT NULL REFERENCES family_rituals(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ritual_id, logged_date)
);

CREATE TABLE IF NOT EXISTS health_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_starting DATE NOT NULL UNIQUE,
  energy INTEGER,
  sleep_quality INTEGER,
  exercise_days INTEGER,
  mood INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS career_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entry_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_order (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  order_json TEXT NOT NULL DEFAULT '["goals","inspirations","habits","books","projects","family","health","career"]'
);
INSERT OR IGNORE INTO section_order (id, order_json) VALUES (1, '["goals","inspirations","habits","books","projects","family","health","career"]');

CREATE TABLE IF NOT EXISTS personal_note (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO personal_note (id, content) VALUES (1, 'As an INFJ, I do the things I care about. I build with intention, show up for my family, and tend to my inner world as carefully as the outer one.');

CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('daily','weekly')),
  entry_date TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  coach_feedback TEXT,
  polish_output TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, entry_date)
);

CREATE TABLE IF NOT EXISTS coach_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  profile TEXT NOT NULL DEFAULT '',
  llm_provider TEXT NOT NULL DEFAULT 'ollama',
  api_key TEXT NOT NULL DEFAULT '',
  ollama_model TEXT NOT NULL DEFAULT 'llama3.2',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO coach_settings (id, profile, llm_provider, api_key, ollama_model) VALUES (1, '', 'ollama', '', 'llama3.2');

CREATE TABLE IF NOT EXISTS career_status (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  role TEXT DEFAULT '',
  company TEXT DEFAULT '',
  work_type TEXT DEFAULT 'remote',
  year_start TEXT DEFAULT '',
  year_end TEXT DEFAULT 'now',
  status_label TEXT DEFAULT 'open to opportunities',
  status_visible INTEGER DEFAULT 1,
  skills_json TEXT DEFAULT '[]',
  building_toward TEXT DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO career_status (id, role, company, work_type, year_start, year_end, status_label, status_visible, skills_json, building_toward) VALUES (1, 'AI Product Builder', 'Independent', 'remote', '2024', 'now', 'open to opportunities', 1, '["Product","AI/LLM","React","Python","Strategy","Writing"]', 'Building calm, useful software products at the intersection of AI and everyday life.');

CREATE TABLE IF NOT EXISTS roadmap_timelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f97316',
  position INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_timeline_id INTEGER NOT NULL REFERENCES roadmap_timelines(id),
  end_timeline_id INTEGER NOT NULL REFERENCES roadmap_timelines(id),
  progress INTEGER NOT NULL DEFAULT 0,
  mindset_note TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roadmap_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  start_timeline_id INTEGER NOT NULL REFERENCES roadmap_timelines(id),
  end_timeline_id INTEGER NOT NULL REFERENCES roadmap_timelines(id),
  note TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`)

// ── Migrations ────────────────────────────────────────────────────────────────
try { db.exec(`ALTER TABLE journal_entries ADD COLUMN reflect_output TEXT`) } catch { /* already exists */ }
try { db.exec(`ALTER TABLE journal_entries ADD COLUMN pulse_output TEXT`) } catch { /* already exists */ }
try { db.exec(`ALTER TABLE journal_entries ADD COLUMN polish_output TEXT`) } catch { /* already exists */ }
try { db.exec(`ALTER TABLE books ADD COLUMN target_finish DATE`) } catch { /* already exists */ }

// ── Seed ─────────────────────────────────────────────────────────────────────
function seed() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM goals').get() as { c: number }).c
  if (count > 0) return

  db.prepare(`INSERT OR IGNORE INTO north_star (id, statement, optimizing_for) VALUES (1, 'Build a life of depth, not breadth — prioritise presence, craft, and slow compounding.', 'intentionality')`).run()

  const insertGoal = db.prepare(`INSERT INTO goals (title, life_area, why, status, progress, target_date) VALUES (?,?,?,?,?,?)`)
  insertGoal.run('Ship personal.os v1', 'projects', 'Build in public, learn in depth', 'active', 72, '2026-06-30')
  insertGoal.run('Read 24 books this year', 'learning', 'Knowledge compounds slowly', 'active', 42, '2026-12-31')
  insertGoal.run('Run a half marathon', 'health', 'Physical discipline bleeds into mental discipline', 'active', 55, '2026-09-01')
  insertGoal.run('Write 50 newsletter issues', 'career', 'Build an audience through consistency', 'active', 20, '2026-12-31')
  insertGoal.run('Meditate 200 days', 'health', 'Cultivate stillness as a practice', 'completed', 100, '2026-05-01')

  const insertInspiration = db.prepare(`INSERT INTO inspirations (author, quote, tag) VALUES (?,?,?)`)
  insertInspiration.run('Naval Ravikant', 'Seek wealth, not money or status. Wealth is having assets that earn while you sleep.', 'wealth')
  insertInspiration.run('Marcus Aurelius', 'You have power over your mind, not outside events. Realize this, and you will find strength.', 'stoicism')
  insertInspiration.run('Paul Graham', 'Do things that don\'t scale. The best startups almost always start with a small number of users they make very happy.', 'startups')
  insertInspiration.run('Morgan Housel', 'The highest form of wealth is the ability to wake up every morning and say "I can do whatever I want today."', 'freedom')
  insertInspiration.run('Cal Newport', 'Clarity about what matters provides clarity about what does not.', 'focus')
  insertInspiration.run('Derek Sivers', 'If it\'s not a hell yes, it\'s a no.', 'decisions')
  insertInspiration.run('Seneca', 'It is not that I\'m so smart. But I stay with the questions much longer.', 'persistence')
  insertInspiration.run('Richard Feynman', 'The first principle is that you must not fool yourself — and you are the easiest person to fool.', 'thinking')

  const insertHabit = db.prepare(`INSERT INTO habits (name, category, frequency) VALUES (?,?,?)`)
  insertHabit.run('Morning pages', 'mindset', 'daily')
  insertHabit.run('Exercise', 'health', 'daily')
  insertHabit.run('Read 30 min', 'learning', 'daily')

  const insertBook = db.prepare(`INSERT INTO books (title, author, status, rating, date_started) VALUES (?,?,?,?,?)`)
  insertBook.run('The Almanack of Naval Ravikant', 'Eric Jorgenson', 'reading', null, '2026-04-15')
  insertBook.run('Thinking in Systems', 'Donella Meadows', 'finished', 5, '2026-03-01')

  const insertProject = db.prepare(`INSERT INTO projects (name, description, status, progress) VALUES (?,?,?,?)`)
  insertProject.run('personal.os', 'A private desktop life dashboard built with Electron + SQLite', 'active', 70)
  insertProject.run('Newsletter CRM', 'Lightweight tool to manage newsletter subscribers and analytics', 'active', 30)

  const insertFamily = db.prepare(`INSERT INTO family_entries (type, title, description, entry_date) VALUES (?,?,?,?)`)
  insertFamily.run('activity', 'Weekend hike with family', 'Blue Mountains trail — everyone loved it', '2026-05-10')
  insertFamily.run('memory', 'First school play', 'Maya was incredible as the narrator', '2026-04-22')
  insertFamily.run('activity', 'Monthly family dinner', 'Cook together, eat together', '2026-05-15')

  const insertHealth = db.prepare(`INSERT INTO health_checkins (week_starting, energy, sleep_quality, exercise_days, mood, notes) VALUES (?,?,?,?,?,?)`)
  insertHealth.run('2026-04-28', 7, 8, 4, 8, 'Good week, shipped features')
}

seed()

// ── Migrations ────────────────────────────────────────────────────────────────
const goalCols = (db.prepare(`PRAGMA table_info(goals)`).all() as { name: string }[]).map(c => c.name)
if (!goalCols.includes('priority')) {
  db.exec(`ALTER TABLE goals ADD COLUMN priority INTEGER DEFAULT 5`)
}

// ── North Star ────────────────────────────────────────────────────────────────
export function getNorthStar() {
  return db.prepare('SELECT * FROM north_star WHERE id = 1').get()
}
export function upsertNorthStar(statement: string, optimizing_for: string) {
  db.prepare(`INSERT INTO north_star (id, statement, optimizing_for, updated_at) VALUES (1,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET statement=excluded.statement, optimizing_for=excluded.optimizing_for, updated_at=CURRENT_TIMESTAMP`).run(statement, optimizing_for)
}

// ── Goals ────────────────────────────────────────────────────────────────────
export function getGoals() {
  return db.prepare('SELECT * FROM goals ORDER BY priority ASC, created_at DESC').all()
}
export function createGoal(data: { title: string; life_area?: string; why?: string; progress?: number; priority?: number; target_date?: string }) {
  const maxRow = db.prepare('SELECT MAX(priority) as maxP FROM goals').get() as { maxP: number | null }
  const newPriority = data.priority ?? (maxRow.maxP != null ? maxRow.maxP + 1 : 0)
  return db.prepare(`INSERT INTO goals (title, life_area, why, progress, priority, target_date) VALUES (?,?,?,?,?,?)`).run(data.title, data.life_area ?? null, data.why ?? null, data.progress ?? 0, newPriority, data.target_date ?? null)
}
export function reorderGoals(ids: number[]) {
  const update = db.prepare('UPDATE goals SET priority = ? WHERE id = ?')
  const tx = db.transaction((orderedIds: number[]) => {
    orderedIds.forEach((id, index) => update.run(index, id))
  })
  tx(ids)
}
export function updateGoal(id: number, data: { title?: string; life_area?: string; why?: string; status?: string; progress?: number; priority?: number; target_date?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  const values = Object.values(data)
  db.prepare(`UPDATE goals SET ${fields}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...values, id)
}
export function deleteGoal(id: number) {
  db.prepare('DELETE FROM goals WHERE id=?').run(id)
}

// ── Habits ────────────────────────────────────────────────────────────────────
export function getHabits() {
  return db.prepare('SELECT * FROM habits WHERE active=1 ORDER BY created_at').all()
}
export function createHabit(data: { name: string; category?: string; frequency?: string }) {
  return db.prepare(`INSERT INTO habits (name, category, frequency) VALUES (?,?,?)`).run(data.name, data.category ?? null, data.frequency ?? 'daily')
}
export function updateHabit(id: number, data: { name?: string; category?: string; frequency?: string; active?: number }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE habits SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteHabit(id: number) {
  db.prepare('UPDATE habits SET active=0 WHERE id=?').run(id)
}
export function getHabitLogs(days = 7) {
  const since = new Date(); since.setDate(since.getDate() - days + 1)
  const dateStr = since.toISOString().slice(0, 10)
  return db.prepare('SELECT * FROM habit_logs WHERE logged_date >= ?').all(dateStr)
}
export function logHabit(habit_id: number, logged_date: string) {
  db.prepare(`INSERT OR IGNORE INTO habit_logs (habit_id, logged_date) VALUES (?,?)`).run(habit_id, logged_date)
}
export function unlogHabit(habit_id: number, logged_date: string) {
  db.prepare('DELETE FROM habit_logs WHERE habit_id=? AND logged_date=?').run(habit_id, logged_date)
}

// ── Inspirations ──────────────────────────────────────────────────────────────
export function getInspirations() {
  return db.prepare('SELECT * FROM inspirations ORDER BY pinned DESC, created_at DESC').all()
}
export function createInspiration(data: { author: string; quote: string; tag?: string; pinned?: number }) {
  return db.prepare(`INSERT INTO inspirations (author, quote, tag, pinned) VALUES (?,?,?,?)`).run(data.author, data.quote, data.tag ?? null, data.pinned ?? 0)
}
export function updateInspiration(id: number, data: { author?: string; quote?: string; tag?: string; pinned?: number }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE inspirations SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteInspiration(id: number) {
  db.prepare('DELETE FROM inspirations WHERE id=?').run(id)
}
export function toggleInspirationsPin(id: number) {
  db.prepare('UPDATE inspirations SET pinned = CASE WHEN pinned = 1 THEN 0 ELSE 1 END WHERE id=?').run(id)
  return db.prepare('SELECT * FROM inspirations WHERE id=?').get(id)
}

// ── Books ─────────────────────────────────────────────────────────────────────
export function getBooks() {
  return db.prepare('SELECT * FROM books ORDER BY created_at DESC').all()
}
export function createBook(data: { title: string; author: string; status?: string; notes?: string; date_started?: string; target_finish?: string }) {
  return db.prepare(`INSERT INTO books (title, author, status, notes, date_started, target_finish) VALUES (?,?,?,?,?,?)`).run(data.title, data.author, data.status ?? 'want_to_read', data.notes ?? null, data.date_started ?? null, data.target_finish ?? null)
}
export function updateBook(id: number, data: { title?: string; author?: string; status?: string; rating?: number; notes?: string; date_started?: string; target_finish?: string; date_finished?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE books SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteBook(id: number) {
  db.prepare('DELETE FROM books WHERE id=?').run(id)
}

// ── Projects ──────────────────────────────────────────────────────────────────
export function getProjects() {
  return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
}
export function createProject(data: { name: string; description?: string; status?: string; progress?: number; links?: string; notes?: string }) {
  return db.prepare(`INSERT INTO projects (name, description, status, progress, links, notes) VALUES (?,?,?,?,?,?)`).run(data.name, data.description ?? null, data.status ?? 'idea', data.progress ?? 0, data.links ?? null, data.notes ?? null)
}
export function updateProject(id: number, data: { name?: string; description?: string; status?: string; progress?: number; links?: string; notes?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE projects SET ${fields}, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...Object.values(data), id)
}
export function deleteProject(id: number) {
  db.prepare('DELETE FROM projects WHERE id=?').run(id)
}

// ── Family ────────────────────────────────────────────────────────────────────
export function getFamilyEntries() {
  return db.prepare('SELECT * FROM family_entries ORDER BY entry_date DESC').all()
}
export function createFamilyEntry(data: { type: string; title: string; description?: string; entry_date?: string }) {
  return db.prepare(`INSERT INTO family_entries (type, title, description, entry_date) VALUES (?,?,?,?)`).run(data.type, data.title, data.description ?? null, data.entry_date ?? null)
}
export function updateFamilyEntry(id: number, data: { type?: string; title?: string; description?: string; entry_date?: string; completed?: number }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE family_entries SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteFamilyEntry(id: number) {
  db.prepare('DELETE FROM family_entries WHERE id=?').run(id)
}

// ── Family Rituals ────────────────────────────────────────────────────────────
export function getRituals() {
  return db.prepare('SELECT * FROM family_rituals WHERE active=1 ORDER BY created_at ASC').all()
}
export function createRitual(data: { title: string; description?: string; frequency: string; notes?: string }) {
  return db.prepare(`INSERT INTO family_rituals (title, description, frequency, notes) VALUES (?,?,?,?)`).run(data.title, data.description ?? null, data.frequency, data.notes ?? null)
}
export function updateRitual(id: number, data: { title?: string; description?: string; frequency?: string; notes?: string; active?: number }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE family_rituals SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteRitual(id: number) {
  db.prepare('DELETE FROM family_rituals WHERE id=?').run(id)
}
export function getRitualLogs(days: number = 90) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
  return db.prepare('SELECT * FROM family_ritual_logs WHERE logged_date >= ? ORDER BY logged_date DESC').all(since)
}
export function logRitual(ritual_id: number, logged_date: string) {
  return db.prepare(`INSERT OR IGNORE INTO family_ritual_logs (ritual_id, logged_date) VALUES (?,?)`).run(ritual_id, logged_date)
}
export function unlogRitual(ritual_id: number, logged_date: string) {
  return db.prepare('DELETE FROM family_ritual_logs WHERE ritual_id=? AND logged_date=?').run(ritual_id, logged_date)
}

// ── Health ────────────────────────────────────────────────────────────────────
export function getHealthCheckins() {
  return db.prepare('SELECT * FROM health_checkins ORDER BY week_starting DESC LIMIT 8').all()
}
export function upsertHealthCheckin(data: { week_starting: string; energy: number; sleep_quality: number; exercise_days: number; mood: number; notes?: string }) {
  db.prepare(`INSERT INTO health_checkins (week_starting, energy, sleep_quality, exercise_days, mood, notes) VALUES (?,?,?,?,?,?)
    ON CONFLICT(week_starting) DO UPDATE SET energy=excluded.energy, sleep_quality=excluded.sleep_quality, exercise_days=excluded.exercise_days, mood=excluded.mood, notes=excluded.notes`).run(data.week_starting, data.energy, data.sleep_quality, data.exercise_days, data.mood, data.notes ?? null)
}

// ── Career ────────────────────────────────────────────────────────────────────
export function getCareerEntries() {
  return db.prepare('SELECT * FROM career_entries ORDER BY entry_date DESC').all()
}
export function createCareerEntry(data: { type: string; title: string; description?: string; entry_date?: string }) {
  return db.prepare(`INSERT INTO career_entries (type, title, description, entry_date) VALUES (?,?,?,?)`).run(data.type, data.title, data.description ?? null, data.entry_date ?? null)
}
export function updateCareerEntry(id: number, data: { type?: string; title?: string; description?: string; entry_date?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE career_entries SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteCareerEntry(id: number) {
  db.prepare('DELETE FROM career_entries WHERE id=?').run(id)
}

// ── Section Order ─────────────────────────────────────────────────────────────
const NEW_DEFAULT_ORDER = ['goals', 'habits', 'books', 'career', 'family', 'health', 'journal']
export function getSectionOrder(): string[] {
  const row = db.prepare('SELECT order_json FROM section_order WHERE id=1').get() as { order_json: string } | undefined
  if (!row) return NEW_DEFAULT_ORDER
  const parsed: string[] = JSON.parse(row.order_json)
  // Filter out removed sections (inspirations/projects now handled elsewhere)
  const filtered = parsed.filter(id => NEW_DEFAULT_ORDER.includes(id))
  const base = filtered.length > 0 ? filtered : NEW_DEFAULT_ORDER
  // Append any newly-added sections that aren't in the saved order
  const missing = NEW_DEFAULT_ORDER.filter(id => !base.includes(id))
  return [...base, ...missing]
}
export function setSectionOrder(order: string[]) {
  db.prepare('UPDATE section_order SET order_json=? WHERE id=1').run(JSON.stringify(order))
}

// ── Career Status ─────────────────────────────────────────────────────────────
export function getCareerStatus() {
  return db.prepare('SELECT * FROM career_status WHERE id=1').get()
}
export function setCareerStatus(data: { role?: string; company?: string; work_type?: string; year_start?: string; year_end?: string; status_label?: string; status_visible?: number; skills_json?: string; building_toward?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE career_status SET ${fields}, updated_at=CURRENT_TIMESTAMP WHERE id=1`).run(...Object.values(data))
  return db.prepare('SELECT * FROM career_status WHERE id=1').get()
}

// ── Personal Note ─────────────────────────────────────────────────────────────
export function getPersonalNote() {
  return db.prepare('SELECT * FROM personal_note WHERE id=1').get()
}
export function setPersonalNote(content: string) {
  db.prepare('UPDATE personal_note SET content=?, updated_at=CURRENT_TIMESTAMP WHERE id=1').run(content)
  return db.prepare('SELECT * FROM personal_note WHERE id=1').get()
}

// ── Journal ───────────────────────────────────────────────────────────────────
export function getJournalEntries() {
  return db.prepare('SELECT * FROM journal_entries ORDER BY entry_date DESC').all()
}
export function upsertJournalEntry(type: string, entry_date: string, content: string) {
  db.prepare(`INSERT INTO journal_entries (type, entry_date, content) VALUES (?,?,?)
    ON CONFLICT(type, entry_date) DO UPDATE SET content=excluded.content, updated_at=CURRENT_TIMESTAMP`).run(type, entry_date, content)
  return db.prepare('SELECT * FROM journal_entries WHERE type=? AND entry_date=?').get(type, entry_date)
}
export function saveJournalCoachFeedback(type: string, entry_date: string, coach_feedback: string) {
  db.prepare('UPDATE journal_entries SET coach_feedback=?, updated_at=CURRENT_TIMESTAMP WHERE type=? AND entry_date=?').run(coach_feedback, type, entry_date)
}
export function saveReflectOutput(entry_date: string, reflect_output: string) {
  db.prepare('UPDATE journal_entries SET reflect_output=?, updated_at=CURRENT_TIMESTAMP WHERE type=? AND entry_date=?').run(reflect_output, 'weekly', entry_date)
}
export function savePulseOutput(entry_date: string, pulse_output: string) {
  db.prepare('UPDATE journal_entries SET pulse_output=?, updated_at=CURRENT_TIMESTAMP WHERE type=? AND entry_date=?').run(pulse_output, 'weekly', entry_date)
}
export function savePolishOutput(type: string, entry_date: string, polish_output: string) {
  db.prepare('UPDATE journal_entries SET polish_output=?, updated_at=CURRENT_TIMESTAMP WHERE type=? AND entry_date=?').run(polish_output, type, entry_date)
}

// ── Coach Settings ────────────────────────────────────────────────────────────
export function getCoachSettings() {
  return db.prepare('SELECT * FROM coach_settings WHERE id=1').get()
}
export function setCoachSettings(data: { profile?: string; llm_provider?: string; api_key?: string; ollama_model?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE coach_settings SET ${fields}, updated_at=CURRENT_TIMESTAMP WHERE id=1`).run(...Object.values(data))
  return db.prepare('SELECT * FROM coach_settings WHERE id=1').get()
}

// ── Exercise & Mood Logs ───────────────────────────────────────────────────
export function getExerciseLogs(start: string, end: string) {
  return db.prepare('SELECT * FROM exercise_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date ASC').all(start, end)
}
export function upsertExerciseLog(data: { log_date: string; type: string; duration: number; notes?: string }) {
  db.prepare(`INSERT INTO exercise_logs (log_date, type, duration, notes) VALUES (?,?,?,?)
    ON CONFLICT(log_date, type) DO UPDATE SET duration=excluded.duration, notes=excluded.notes`).run(data.log_date, data.type, data.duration, data.notes ?? null)
}
export function deleteExerciseLog(log_date: string, type: string) {
  db.prepare('DELETE FROM exercise_logs WHERE log_date=? AND type=?').run(log_date, type)
}

export function getMoodLogs(start: string, end: string) {
  return db.prepare('SELECT * FROM mood_logs WHERE log_date BETWEEN ? AND ? ORDER BY log_date ASC').all(start, end)
}
export function upsertMoodLog(data: { log_date: string; mood: string; notes?: string }) {
  db.prepare(`INSERT INTO mood_logs (log_date, mood, notes) VALUES (?,?,?)
    ON CONFLICT(log_date) DO UPDATE SET mood=excluded.mood, notes=excluded.notes`).run(data.log_date, data.mood, data.notes ?? null)
}
export function deleteMoodLog(log_date: string) {
  db.prepare('DELETE FROM mood_logs WHERE log_date=?').run(log_date)
}

// ── Roadmap Timelines ─────────────────────────────────────────────────────────
export function getRoadmapTimelines() {
  return db.prepare('SELECT * FROM roadmap_timelines ORDER BY position ASC, id ASC').all()
}
export function createRoadmapTimeline(data: { label: string; color?: string; position?: number }) {
  const maxRow = db.prepare('SELECT MAX(position) as maxP FROM roadmap_timelines').get() as { maxP: number | null }
  const pos = data.position ?? (maxRow.maxP != null ? maxRow.maxP + 1 : 0)
  return db.prepare('INSERT INTO roadmap_timelines (label, color, position) VALUES (?,?,?)').run(data.label, data.color ?? '#f97316', pos)
}
export function updateRoadmapTimeline(id: number, data: { label?: string; color?: string; position?: number }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE roadmap_timelines SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteRoadmapTimeline(id: number) {
  const usedBy = db.prepare('SELECT COUNT(*) as c FROM roadmap_items WHERE start_timeline_id=? OR end_timeline_id=?').get(id, id) as { c: number }
  if (usedBy.c > 0) return { blocked: true as const }
  db.prepare('DELETE FROM roadmap_timelines WHERE id=?').run(id)
  return { blocked: false as const }
}

// ── Roadmap Items ─────────────────────────────────────────────────────────────
export function getRoadmapItems() {
  return db.prepare('SELECT * FROM roadmap_items ORDER BY created_at ASC').all()
}
export function createRoadmapItem(data: { title: string; start_timeline_id: number; end_timeline_id: number; progress?: number; mindset_note?: string }) {
  return db.prepare('INSERT INTO roadmap_items (title, start_timeline_id, end_timeline_id, progress, mindset_note) VALUES (?,?,?,?,?)').run(data.title, data.start_timeline_id, data.end_timeline_id, data.progress ?? 0, data.mindset_note ?? '')
}
export function updateRoadmapItem(id: number, data: { title?: string; start_timeline_id?: number; end_timeline_id?: number; progress?: number; mindset_note?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE roadmap_items SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteRoadmapItem(id: number) {
  db.prepare('DELETE FROM roadmap_items WHERE id=?').run(id)
}

// ── Roadmap Phases ────────────────────────────────────────────────────────────
export function getRoadmapPhases() {
  return db.prepare('SELECT * FROM roadmap_phases ORDER BY created_at ASC').all()
}
export function createRoadmapPhase(data: { label: string; start_timeline_id: number; end_timeline_id: number; note?: string }) {
  return db.prepare('INSERT INTO roadmap_phases (label, start_timeline_id, end_timeline_id, note) VALUES (?,?,?,?)').run(data.label, data.start_timeline_id, data.end_timeline_id, data.note ?? '')
}
export function updateRoadmapPhase(id: number, data: { label?: string; start_timeline_id?: number; end_timeline_id?: number; note?: string }) {
  const fields = Object.keys(data).map(k => `${k}=?`).join(', ')
  db.prepare(`UPDATE roadmap_phases SET ${fields} WHERE id=?`).run(...Object.values(data), id)
}
export function deleteRoadmapPhase(id: number) {
  db.prepare('DELETE FROM roadmap_phases WHERE id=?').run(id)
}
