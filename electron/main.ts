import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import {
  getNorthStar, upsertNorthStar,
  getGoals, createGoal, updateGoal, deleteGoal, reorderGoals,
  getHabits, createHabit, updateHabit, deleteHabit,
  getHabitLogs, logHabit, unlogHabit,
  getInspirations, createInspiration, updateInspiration, deleteInspiration,
  getBooks, createBook, updateBook, deleteBook,
  getProjects, createProject, updateProject, deleteProject,
  getFamilyEntries, createFamilyEntry, updateFamilyEntry, deleteFamilyEntry,
  getHealthCheckins, upsertHealthCheckin,
  getCareerEntries, createCareerEntry, updateCareerEntry, deleteCareerEntry,
  getSectionOrder, setSectionOrder,
  getPersonalNote, setPersonalNote,
  toggleInspirationsPin,
  getCareerStatus, setCareerStatus,
  getJournalEntries, upsertJournalEntry, saveJournalCoachFeedback,
  saveReflectOutput, savePulseOutput, savePolishOutput,
  getCoachSettings, setCoachSettings,
  getRituals, createRitual, updateRitual, deleteRitual,
  getRitualLogs, logRitual, unlogRitual,
  getExerciseLogs, upsertExerciseLog, deleteExerciseLog,
  getMoodLogs, upsertMoodLog, deleteMoodLog,
  getRoadmapTimelines, createRoadmapTimeline, updateRoadmapTimeline, deleteRoadmapTimeline,
  getRoadmapItems, createRoadmapItem, updateRoadmapItem, deleteRoadmapItem,
  getRoadmapPhases, createRoadmapPhase, updateRoadmapPhase, deleteRoadmapPhase,
} from './db'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0d0d0d',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('northStar:get', () => getNorthStar())
ipcMain.handle('northStar:upsert', (_e, statement, optimizing_for) => upsertNorthStar(statement, optimizing_for))

ipcMain.handle('goals:getAll', () => getGoals())
ipcMain.handle('goals:create', (_e, data) => createGoal(data))
ipcMain.handle('goals:update', (_e, id, data) => updateGoal(id, data))
ipcMain.handle('goals:delete', (_e, id) => deleteGoal(id))
ipcMain.handle('goals:reorder', (_e, ids) => reorderGoals(ids))

ipcMain.handle('habits:getAll', () => getHabits())
ipcMain.handle('habits:create', (_e, data) => createHabit(data))
ipcMain.handle('habits:update', (_e, id, data) => updateHabit(id, data))
ipcMain.handle('habits:delete', (_e, id) => deleteHabit(id))
ipcMain.handle('habits:getLogs', (_e, days) => getHabitLogs(days))
ipcMain.handle('habits:log', (_e, habit_id, logged_date) => logHabit(habit_id, logged_date))
ipcMain.handle('habits:unlog', (_e, habit_id, logged_date) => unlogHabit(habit_id, logged_date))

ipcMain.handle('inspirations:getAll', () => getInspirations())
ipcMain.handle('inspirations:create', (_e, data) => createInspiration(data))
ipcMain.handle('inspirations:update', (_e, id, data) => updateInspiration(id, data))
ipcMain.handle('inspirations:delete', (_e, id) => deleteInspiration(id))
ipcMain.handle('inspirations:togglePin', (_e, id) => toggleInspirationsPin(id))

ipcMain.handle('books:getAll', () => getBooks())
ipcMain.handle('books:create', (_e, data) => createBook(data))
ipcMain.handle('books:update', (_e, id, data) => updateBook(id, data))
ipcMain.handle('books:delete', (_e, id) => deleteBook(id))

ipcMain.handle('projects:getAll', () => getProjects())
ipcMain.handle('projects:create', (_e, data) => createProject(data))
ipcMain.handle('projects:update', (_e, id, data) => updateProject(id, data))
ipcMain.handle('projects:delete', (_e, id) => deleteProject(id))

ipcMain.handle('family:getAll', () => getFamilyEntries())
ipcMain.handle('family:create', (_e, data) => createFamilyEntry(data))
ipcMain.handle('family:update', (_e, id, data) => updateFamilyEntry(id, data))
ipcMain.handle('family:delete', (_e, id) => deleteFamilyEntry(id))

ipcMain.handle('family:rituals:getAll', () => getRituals())
ipcMain.handle('family:rituals:create', (_e, data) => createRitual(data))
ipcMain.handle('family:rituals:update', (_e, id, data) => updateRitual(id, data))
ipcMain.handle('family:rituals:delete', (_e, id) => deleteRitual(id))
ipcMain.handle('family:rituals:getLogs', (_e, days) => getRitualLogs(days))
ipcMain.handle('family:rituals:log', (_e, ritual_id, logged_date) => logRitual(ritual_id, logged_date))
ipcMain.handle('family:rituals:unlog', (_e, ritual_id, logged_date) => unlogRitual(ritual_id, logged_date))

ipcMain.handle('health:getAll', () => getHealthCheckins())
ipcMain.handle('health:upsert', (_e, data) => upsertHealthCheckin(data))

ipcMain.handle('health:exercise:getLogs', (_e, start, end) => getExerciseLogs(start, end))
ipcMain.handle('health:exercise:upsert', (_e, data) => upsertExerciseLog(data))
ipcMain.handle('health:exercise:delete', (_e, log_date, type) => deleteExerciseLog(log_date, type))

ipcMain.handle('health:mood:getLogs', (_e, start, end) => getMoodLogs(start, end))
ipcMain.handle('health:mood:upsert', (_e, data) => upsertMoodLog(data))
ipcMain.handle('health:mood:delete', (_e, log_date) => deleteMoodLog(log_date))

ipcMain.handle('career:getAll', () => getCareerEntries())
ipcMain.handle('career:create', (_e, data) => createCareerEntry(data))
ipcMain.handle('career:update', (_e, id, data) => updateCareerEntry(id, data))
ipcMain.handle('career:delete', (_e, id) => deleteCareerEntry(id))

ipcMain.handle('roadmapTimelines:getAll', () => getRoadmapTimelines())
ipcMain.handle('roadmapTimelines:create', (_e, data) => createRoadmapTimeline(data))
ipcMain.handle('roadmapTimelines:update', (_e, id, data) => updateRoadmapTimeline(id, data))
ipcMain.handle('roadmapTimelines:delete', (_e, id) => deleteRoadmapTimeline(id))

ipcMain.handle('roadmapItems:getAll', () => getRoadmapItems())
ipcMain.handle('roadmapItems:create', (_e, data) => createRoadmapItem(data))
ipcMain.handle('roadmapItems:update', (_e, id, data) => updateRoadmapItem(id, data))
ipcMain.handle('roadmapItems:delete', (_e, id) => deleteRoadmapItem(id))

ipcMain.handle('roadmapPhases:getAll', () => getRoadmapPhases())
ipcMain.handle('roadmapPhases:create', (_e, data) => createRoadmapPhase(data))
ipcMain.handle('roadmapPhases:update', (_e, id, data) => updateRoadmapPhase(id, data))
ipcMain.handle('roadmapPhases:delete', (_e, id) => deleteRoadmapPhase(id))

ipcMain.handle('sectionOrder:get', () => getSectionOrder())
ipcMain.handle('sectionOrder:set', (_e, order) => setSectionOrder(order))

ipcMain.handle('personalNote:get', () => getPersonalNote())
ipcMain.handle('personalNote:set', (_e, content) => setPersonalNote(content))

ipcMain.handle('careerStatus:get', () => getCareerStatus())
ipcMain.handle('careerStatus:set', (_e, data) => setCareerStatus(data))

ipcMain.handle('journal:getAll', () => getJournalEntries())
ipcMain.handle('journal:upsert', (_e, type, entry_date, content) => upsertJournalEntry(type, entry_date, content))
ipcMain.handle('journal:getCoachFeedback', async (_e, type: string, entry_date: string, content: string) => {
  // Ensure the entry is saved before calling the coach
  upsertJournalEntry(type, entry_date, content)

  const settings = getCoachSettings() as { profile: string; llm_provider: string; api_key: string; ollama_model: string } | undefined
  if (!settings) return { error: 'Coach settings not found.' }

  // Build rich context
  const goals = getGoals() as { title: string; status: string; progress: number; target_date: string | null }[]
  const habits = getHabits() as { id: number; name: string; frequency: string }[]
  const habitLogs = getHabitLogs(90) as { habit_id: number }[]
  const allEntries = getJournalEntries() as { type: string; entry_date: string; content: string }[]

  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .slice(0, 10)
    .map((g) => `- ${g.title} (${g.progress}% complete${g.target_date ? ', due ' + g.target_date : ''})`)
    .join('\n')

  const habitSummary = habits
    .map((h) => {
      const count = habitLogs.filter((l) => l.habit_id === h.id).length
      return `- ${h.name} (${h.frequency}): ${count} logs in last 90 days`
    })
    .join('\n')

  const recentDaily = allEntries
    .filter((e) => e.type === 'daily' && e.content.trim())
    .slice(0, 7)
    .map((e) => `${e.entry_date}:\n${e.content.slice(0, 400)}`)
    .join('\n\n')

  const recentWeekly = allEntries
    .filter((e) => e.type === 'weekly' && e.content.trim())
    .slice(0, 4)
    .map((e) => `Week of ${e.entry_date}:\n${e.content.slice(0, 500)}`)
    .join('\n\n')

  const systemPrompt = [
    'You are a personal growth coach.',
    settings.profile ? `About the person you are coaching:\n${settings.profile}` : '',
    'Be honest, direct, and concise. Avoid platitudes. Keep your response to 3-5 sentences. Ask one good question at the end if relevant.',
  ].filter(Boolean).join('\n\n')

  const userPrompt = `Context:

Active goals:
${activeGoals || 'None set'}

Habit activity (last 90 days):
${habitSummary || 'No habits tracked'}

Recent daily reflections:
${recentDaily || 'None yet'}

Recent weekly reviews:
${recentWeekly || 'None yet'}

---

My ${type} reflection for ${entry_date}:
${content}

Please give me your honest coaching feedback.`

  const result = await callLLM(settings, systemPrompt, userPrompt)

  if (result.feedback) {
    saveJournalCoachFeedback(type, entry_date, result.feedback)
  }
  return result
})

ipcMain.handle('coachSettings:get', () => getCoachSettings())
ipcMain.handle('coachSettings:set', (_e, data) => setCoachSettings(data))

ipcMain.handle('journal:questionOfDay', async (_e, entry_date: string) => {
  const settings = getCoachSettings() as { profile: string; llm_provider: string; api_key: string; ollama_model: string } | undefined
  if (!settings) return { error: 'Coach settings not found.' }

  const allEntries = getJournalEntries() as { type: string; entry_date: string; content: string }[]
  const goals = getGoals() as { title: string; status: string; progress: number }[]

  const yesterday = allEntries
    .filter((e) => e.type === 'daily' && e.entry_date < entry_date && e.content.trim())
    .slice(0, 1)
    .map((e) => e.content.slice(0, 600))
    .join('')

  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .slice(0, 5)
    .map((g) => `- ${g.title} (${g.progress}% complete)`)
    .join('\n')

  const systemPrompt = [
    'You are a personal growth coach.',
    settings.profile ? `About the person you are coaching:\n${settings.profile}` : '',
    'Generate ONE sharp, thought-provoking journaling question for today. No preamble, no explanation — just the question itself. Make it specific to their recent reflection and goals, not generic.',
  ].filter(Boolean).join('\n\n')

  const userPrompt = `Yesterday's reflection:\n${yesterday || 'None yet'}\n\nActive goals:\n${activeGoals || 'None set'}\n\nGenerate one journaling question for today.`

  const result = await callLLM(settings, systemPrompt, userPrompt)
  return result.feedback ? { question: result.feedback } : { error: result.error }
})

ipcMain.handle('journal:reflect', async (_e, entry_date: string) => {
  const settings = getCoachSettings() as { profile: string; llm_provider: string; api_key: string; ollama_model: string } | undefined
  if (!settings) return { error: 'Coach settings not found.' }

  const allEntries = getJournalEntries() as { type: string; entry_date: string; content: string }[]

  const recentDaily = allEntries
    .filter((e) => e.type === 'daily' && e.content.trim())
    .slice(0, 7)
    .map((e) => `${e.entry_date}:\n${e.content.slice(0, 600)}`)
    .join('\n\n')

  const systemPrompt = [
    'You are a pattern-recognition coach.',
    settings.profile ? `About the person you are coaching:\n${settings.profile}` : '',
    'Find themes, recurring emotions, blind spots, and momentum shifts across the entries. Be specific and direct, not generic. Format your response as 3-5 bullet points starting with "•", followed by one honest observation on a new line starting with "→".',
  ].filter(Boolean).join('\n\n')

  const userPrompt = `Here are the last 7 daily reflections:\n\n${recentDaily || 'No daily entries yet.'}\n\nFind the patterns.`

  const result = await callLLM(settings, systemPrompt, userPrompt)
  if (result.feedback) {
    saveReflectOutput(entry_date, result.feedback)
    return { reflect: result.feedback }
  }
  return { error: result.error }
})

ipcMain.handle('journal:goalCheckPulse', async (_e, entry_date: string) => {
  const settings = getCoachSettings() as { profile: string; llm_provider: string; api_key: string; ollama_model: string } | undefined
  if (!settings) return { error: 'Coach settings not found.' }

  const allEntries = getJournalEntries() as { type: string; entry_date: string; content: string }[]
  const goals = getGoals() as { title: string; status: string; progress: number; target_date: string | null }[]
  const projects = getProjects() as { name: string; status: string; progress: number }[]
  const habits = getHabits() as { id: number; name: string; frequency: string }[]
  const habitLogs = getHabitLogs(90) as { habit_id: number }[]

  const recentEntries = allEntries
    .filter((e) => e.content.trim())
    .slice(0, 14)
    .map((e) => `[${e.type} ${e.entry_date}]: ${e.content.slice(0, 400)}`)
    .join('\n\n')

  const activeGoals = goals
    .filter((g) => g.status === 'active')
    .map((g) => `- ${g.title} (${g.progress}%${g.target_date ? ', due ' + g.target_date : ''})`)
    .join('\n')

  const activeProjects = projects
    .filter((p) => p.status !== 'done' && p.status !== 'archived')
    .map((p) => `- ${p.name} [${p.status}, ${p.progress}%]`)
    .join('\n')

  const habitSummary = habits
    .map((h) => {
      const count = habitLogs.filter((l) => l.habit_id === h.id).length
      return `- ${h.name} (${h.frequency}): ${count} logs in last 90 days`
    })
    .join('\n')

  const systemPrompt = [
    'You are a strategic accountability coach.',
    settings.profile ? `About the person you are coaching:\n${settings.profile}` : '',
    'Cross-reference the journal entries with their stated goals, projects, and habits. Flag ONLY misalignments, avoidances, or blind spots — not achievements. Be direct and specific. Format as 2-4 bullet points starting with "⚑".',
  ].filter(Boolean).join('\n\n')

  const userPrompt = `Journal (last 14 entries):\n${recentEntries || 'None yet'}\n\nActive goals:\n${activeGoals || 'None'}\n\nActive projects:\n${activeProjects || 'None'}\n\nHabit activity:\n${habitSummary || 'None'}\n\nFlag the misalignments.`

  const result = await callLLM(settings, systemPrompt, userPrompt)
  if (result.feedback) {
    savePulseOutput(entry_date, result.feedback)
    return { pulse: result.feedback }
  }
  return { error: result.error }
})

ipcMain.handle('journal:polish', async (_e, type: string, entry_date: string, content: string) => {
  upsertJournalEntry(type, entry_date, content)

  const settings = getCoachSettings() as { profile: string; llm_provider: string; api_key: string; ollama_model: string } | undefined
  if (!settings) return { error: 'Coach settings not found.' }

  const systemPrompt = [
    'You are a writing editor focused on polish, not rewriting.',
    settings.profile ? `About the writer:\n${settings.profile}` : '',
    'Preserve the writer\'s meaning, emotional intent, first-person voice, and specific details.',
    'Apply balanced polish: improve clarity, flow, and concision with moderate restructuring only when helpful.',
    'Do not add new facts, remove core ideas, or shift tone away from the original.',
    'CRITICAL: Output ONLY the polished journal entry text. Do not include any preamble, introduction, explanation, or commentary. No lines like "Here\'s the polished..." or similar. Start directly with the polished text.',
  ].filter(Boolean).join('\n\n')

  const userPrompt = [
    `Entry type: ${type}`,
    `Date: ${entry_date}`,
    '',
    'Polish and tighten the journal entry below while keeping the writer\'s voice and intent intact.',
    '',
    content,
  ].join('\n')

  const result = await callLLM(settings, systemPrompt, userPrompt)
  if (result.feedback) {
    savePolishOutput(type, entry_date, result.feedback)
    return { polished: result.feedback }
  }
  return { error: result.error }
})

// ── LLM helpers ──────────────────────────────────────────────────────────────────
async function callLLM(
  settings: { llm_provider: string; api_key: string; ollama_model: string },
  system: string,
  user: string
): Promise<{ feedback?: string; error?: string }> {
  const ollamaAvailable = await checkOllama()
  if (ollamaAvailable) {
    return callOllama(settings.ollama_model || 'llama3.2', system, user)
  } else if (settings.api_key) {
    if (settings.llm_provider === 'openai') return callOpenAI(settings.api_key, system, user)
    if (settings.llm_provider === 'anthropic') return callAnthropic(settings.api_key, system, user)
    return { error: 'Unknown LLM provider. Please check Settings.' }
  }
  return { error: 'No LLM available. Start Ollama locally or add an API key in Settings → Coach.' }
}

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

async function callOllama(model: string, system: string, user: string): Promise<{ feedback?: string; error?: string }> {
  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, system, prompt: user, stream: false }),
      signal: AbortSignal.timeout(120000),
    })
    if (!res.ok) return { error: `Ollama returned ${res.status}. Is the model pulled? Run: ollama pull ${model}` }
    const data = await res.json() as { response?: string }
    return { feedback: data.response ?? '' }
  } catch (e: unknown) {
    return { error: `Ollama error: ${(e as Error).message}` }
  }
}

async function callOpenAI(apiKey: string, system: string, user: string): Promise<{ feedback?: string; error?: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 600 }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { error: `OpenAI error: ${err.error?.message ?? res.status}` }
    }
    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    return { feedback: data.choices?.[0]?.message?.content ?? '' }
  } catch (e: unknown) {
    return { error: `OpenAI error: ${(e as Error).message}` }
  }
}

async function callAnthropic(apiKey: string, system: string, user: string): Promise<{ feedback?: string; error?: string }> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 600, system, messages: [{ role: 'user', content: user }] }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: { message?: string } }
      return { error: `Anthropic error: ${err.error?.message ?? res.status}` }
    }
    const data = await res.json() as { content?: { type: string; text?: string }[] }
    return { feedback: data.content?.[0]?.text ?? '' }
  } catch (e: unknown) {
    return { error: `Anthropic error: ${(e as Error).message}` }
  }
}
