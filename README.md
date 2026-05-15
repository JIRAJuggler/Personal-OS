# Personal OS

A private, offline-first desktop life dashboard built with Electron + React. All data is stored locally on your machine - nothing is sent to any server unless you opt into an AI coach feature.

## Features

- **Home Dashboard** — Customizable overview with drag-and-drop section ordering and a personal note
- **Goals** — Track life goals with progress, status, and target dates
- **Habits** — Daily habit tracking with a 90-day log history
- **Journal** — Daily and weekly reflections with auto-save and an optional AI coach
- **Books** — Reading list and book tracker
- **Career** — Career entries, job search status tracking, and a visual roadmap
- **Family** — Family memory entries and recurring ritual tracking
- **Health** — Check-ins, exercise logs, and mood tracking
- **Inspirations** — Pinnable quotes and ideas

### AI Coach (optional)

The journal supports AI coaching powered by your choice of:
- **Ollama** (local, fully offline) — recommended default
- **OpenAI** (GPT-4o)
- **Anthropic** (Claude)

Coach features include: feedback on reflections, a daily question, pattern analysis across entries, goal alignment pulse checks, and entry polishing. Configure in **Settings → Coach**.

## Tech Stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React 18](https://react.dev/) + TypeScript
- [SQLite](https://www.sqlite.org/) via `better-sqlite3` (local database)
- [Tailwind CSS](https://tailwindcss.com/)
- [@dnd-kit](https://dndkit.com/) for drag-and-drop

## Getting Started

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build
