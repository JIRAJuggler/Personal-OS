import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { useAppStore } from '../store/useAppStore'
import SlideOver from '../components/SlideOver'
import RoadmapView from '../components/RoadmapView'
import type { Project, CareerEntry } from '../types'

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ label, visible }: { label: string; visible: number }) {
  if (!visible) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'monospace', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '3px 10px', borderRadius: '999px' }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
      {label}
    </span>
  )
}

// ── Project status badge ──────────────────────────────────────────────────────
function ProjectBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string }> = {
    active: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
    exploring: { color: '#888580', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
    idea: { color: '#888580', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)' },
    'on hold': { color: '#b8b014', bg: 'rgba(184,176,20,0.06)', border: 'rgba(184,176,20,0.2)' },
    done: { color: '#4a4845', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  }
  const s = map[status] ?? map['idea']
  return (
    <span style={{ fontSize: '10px', fontFamily: 'monospace', textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '2px 7px', borderRadius: '4px' }}>
      {status}
    </span>
  )
}

export default function CareerPage() {
  const { careerStatus, careerEntries, projects, refreshCareerStatus, refreshCareer, refreshProjects } = useAppStore()

  // Career status slide-over
  const [statusSlide, setStatusSlide] = useState(false)
  const [statusForm, setStatusForm] = useState({
    role: '', company: '', work_type: '', year_start: '', year_end: '',
    status_label: '', status_visible: 1, skills: '', building_toward: '',
  })

  function openStatusEdit() {
    if (!careerStatus) return
    const skills = (() => { try { return (JSON.parse(careerStatus.skills_json) as string[]).join(', ') } catch { return '' } })()
    setStatusForm({
      role: careerStatus.role,
      company: careerStatus.company,
      work_type: careerStatus.work_type,
      year_start: careerStatus.year_start,
      year_end: careerStatus.year_end,
      status_label: careerStatus.status_label,
      status_visible: careerStatus.status_visible,
      skills,
      building_toward: careerStatus.building_toward,
    })
    setStatusSlide(true)
  }

  async function saveStatus() {
    const skills_json = JSON.stringify(statusForm.skills.split(',').map(s => s.trim()).filter(Boolean))
    await window.db.careerStatus.set({
      role: statusForm.role,
      company: statusForm.company,
      work_type: statusForm.work_type,
      year_start: statusForm.year_start,
      year_end: statusForm.year_end,
      status_label: statusForm.status_label,
      status_visible: statusForm.status_visible,
      skills_json,
      building_toward: statusForm.building_toward,
    })
    await refreshCareerStatus()
    setStatusSlide(false)
  }

  // Project slide-over
  const [projectSlide, setProjectSlide] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState<number | null>(null)
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'idea', progress: 0, links: '', notes: '' })

  function openAddProject() {
    setEditingProject(null)
    setProjectForm({ name: '', description: '', status: 'idea', progress: 0, links: '', notes: '' })
    setProjectSlide(true)
  }

  function openEditProject(p: Project) {
    setEditingProject(p)
    setProjectForm({ name: p.name, description: p.description ?? '', status: p.status, progress: p.progress, links: p.links ?? '', notes: p.notes ?? '' })
    setProjectSlide(true)
  }

  function closeProjectSlide() {
    setProjectSlide(false)
    setEditingProject(null)
    setConfirmDeleteProject(null)
  }

  async function saveProject() {
    if (!projectForm.name.trim()) return
    if (editingProject) {
      await window.db.projects.update(editingProject.id, { ...projectForm })
    } else {
      await window.db.projects.create({ ...projectForm })
    }
    await refreshProjects()
    closeProjectSlide()
  }

  async function deleteProject(id: number) {
    await window.db.projects.delete(id)
    await refreshProjects()
    closeProjectSlide()
  }

  // Career entry slide-over
  const [entrySlide, setEntrySlide] = useState(false)
  const [editingEntry, setEditingEntry] = useState<CareerEntry | null>(null)
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<number | null>(null)
  const [entryForm, setEntryForm] = useState({ type: 'win', title: '', description: '', entry_date: '' })

  function openAddEntry() {
    setEditingEntry(null)
    setEntryForm({ type: 'win', title: '', description: '', entry_date: format(new Date(), 'yyyy-MM-dd') })
    setEntrySlide(true)
  }
  function openEditEntry(e: CareerEntry) {
    setEditingEntry(e)
    setEntryForm({ type: e.type, title: e.title, description: e.description ?? '', entry_date: e.entry_date ?? '' })
    setEntrySlide(true)
  }
  function closeEntrySlide() {
    setEntrySlide(false)
    setEditingEntry(null)
    setConfirmDeleteEntry(null)
  }
  async function saveEntry() {
    if (!entryForm.title.trim()) return
    if (editingEntry) {
      await window.db.career.update(editingEntry.id, { ...entryForm })
    } else {
      await window.db.career.create({ ...entryForm })
    }
    await refreshCareer()
    closeEntrySlide()
  }
  async function deleteEntry(id: number) {
    await window.db.career.delete(id)
    await refreshCareer()
    closeEntrySlide()
  }

  // Show all projects toggle
  const [showAllProjects, setShowAllProjects] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap'>('overview')

  const activeProjects = projects.filter(p => p.status === 'active')
  const otherProjects = projects.filter(p => p.status !== 'active')

  const skills: string[] = (() => {
    try { return JSON.parse(careerStatus?.skills_json ?? '[]') }
    catch { return [] }
  })()

  const sectionLabel = (text: string) => (
    <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '10px' }}>{text}</div>
  )

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', letterSpacing: '0.08em' }}>01 — career & work</span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e8e6e1', marginTop: '4px' }}>Career</h2>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3 }}>
          {(['overview', 'roadmap'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 12,
                fontFamily: 'monospace', letterSpacing: '0.04em', cursor: 'pointer',
                background: activeTab === tab ? '#f97316' : 'transparent',
                color: activeTab === tab ? '#fff' : '#888580',
                textTransform: 'capitalize',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'roadmap' ? (
        <RoadmapView />
      ) : (
        <>
      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '60% 1fr', gap: '32px', alignItems: 'start' }}>

        {/* LEFT: Current status */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            {sectionLabel('CURRENTLY')}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {careerStatus && <StatusBadge label={careerStatus.status_label} visible={careerStatus.status_visible} />}
              <button
                onClick={openStatusEdit}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '11px', fontFamily: 'monospace', padding: 0, transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
              >
                ✎ edit
              </button>
            </div>
          </div>

          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#e8e6e1', marginBottom: '6px', lineHeight: 1.1 }}>
            {careerStatus?.role || '—'}
          </h3>
          <p style={{ fontSize: '12px', fontFamily: 'monospace', color: '#888580', marginBottom: '24px' }}>
            @ {careerStatus?.company || '—'} · {careerStatus?.work_type || '—'} · {careerStatus?.year_start || '—'} → {careerStatus?.year_end || 'now'}
          </p>

          {/* Skills */}
          <div style={{ marginBottom: '24px' }}>
            {sectionLabel('SKILLS')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.length > 0 ? skills.map(skill => (
                <span key={skill} style={{ fontSize: '11px', fontFamily: 'monospace', color: '#888580', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '999px' }}>
                  {skill}
                </span>
              )) : <span style={{ fontSize: '12px', color: '#4a4845' }}>No skills listed yet.</span>}
            </div>
          </div>

          {/* Building toward */}
          <div>
            {sectionLabel('BUILDING TOWARD')}
            <p style={{ fontSize: '13px', color: '#888580', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
              {careerStatus?.building_toward || '—'}
            </p>
          </div>
        </div>

        {/* RIGHT: Active projects */}
        <div>
          <div className="card" style={{ padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {sectionLabel('ACTIVE PROJECTS')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeProjects.length === 0 && (
                <p style={{ fontSize: '12px', color: '#4a4845' }}>No active projects.</p>
              )}
              {activeProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => openEditProject(p)}
                  style={{ cursor: 'pointer', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', transition: 'border-color 0.15s ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(249,115,22,0.2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: p.description ? '4px' : '0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e6e1' }}>{p.name}</span>
                    <ProjectBadge status={p.status} />
                  </div>
                  {p.description && (
                    <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4a4845', margin: 0, lineHeight: 1.5 }}>{p.description}</p>
                  )}
                  {p.progress > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="progress-bar" style={{ height: '2px' }}>
                        <div className="progress-bar-fill" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={openAddProject}
              style={{ marginTop: '14px', width: '100%', padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', color: '#4a4845', fontSize: '12px', fontFamily: 'monospace', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#888580'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#4a4845'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              + Add Project
            </button>

            {otherProjects.length > 0 && (
              <button
                onClick={() => setShowAllProjects(v => !v)}
                style={{ marginTop: '10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '11px', fontFamily: 'monospace', textAlign: 'left', padding: '4px 0', transition: 'color 0.15s ease' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
              >
                {showAllProjects ? '↑ hide other projects' : `→ view all projects (${otherProjects.length} more)`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All projects expanded */}
      {showAllProjects && otherProjects.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', marginBottom: '12px' }}>ALL PROJECTS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {otherProjects.map(p => (
              <div
                key={p.id}
                onClick={() => openEditProject(p)}
                style={{ cursor: 'pointer', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', transition: 'border-color 0.15s ease' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: p.description ? '4px' : '0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#888580' }}>{p.name}</span>
                  <ProjectBadge status={p.status} />
                </div>
                {p.description && <p style={{ fontSize: '11px', fontFamily: 'monospace', color: '#4a4845', margin: 0, lineHeight: 1.4 }}>{p.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career log */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845' }}>CAREER LOG</div>
          <button
            onClick={openAddEntry}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '11px', fontFamily: 'monospace', padding: 0, transition: 'color 0.15s ease' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#888580')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
          >
            ✎ add entry
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {careerEntries.length === 0 && <p style={{ fontSize: '12px', color: '#4a4845' }}>No entries yet.</p>}
          {careerEntries.map(e => (
            <div
              key={e.id}
              onClick={() => openEditEntry(e)}
              style={{ cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', transition: 'border-color 0.15s ease' }}
              onMouseEnter={(e2) => ((e2.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e2) => ((e2.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)')}
            >
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#888580', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', flexShrink: 0, marginTop: '1px', textTransform: 'capitalize' }}>{e.type}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#e8e6e1', fontWeight: 500 }}>{e.title}</div>
                {e.description && <div style={{ fontSize: '12px', color: '#4a4845', marginTop: '2px' }}>{e.description}</div>}
              </div>
              {e.entry_date && <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#4a4845', flexShrink: 0 }}>{format(parseISO(e.entry_date), 'MMM d, yyyy')}</span>}
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* ── Slide-overs ── */}

      {/* Career status edit */}
      <SlideOver open={statusSlide} onClose={() => setStatusSlide(false)} title="Edit Career Status">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label>Role / Title</label><input value={statusForm.role} onChange={e => setStatusForm(f => ({ ...f, role: e.target.value }))} placeholder="AI Product Builder" /></div>
          <div><label>Company</label><input value={statusForm.company} onChange={e => setStatusForm(f => ({ ...f, company: e.target.value }))} placeholder="Independent" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div><label>Work type</label><input value={statusForm.work_type} onChange={e => setStatusForm(f => ({ ...f, work_type: e.target.value }))} placeholder="remote" /></div>
            <div><label>Year start</label><input value={statusForm.year_start} onChange={e => setStatusForm(f => ({ ...f, year_start: e.target.value }))} placeholder="2024" /></div>
            <div><label>Year end</label><input value={statusForm.year_end} onChange={e => setStatusForm(f => ({ ...f, year_end: e.target.value }))} placeholder="now" /></div>
          </div>
          <div><label>Status label</label><input value={statusForm.status_label} onChange={e => setStatusForm(f => ({ ...f, status_label: e.target.value }))} placeholder="open to opportunities" /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="status_visible" checked={statusForm.status_visible === 1} onChange={e => setStatusForm(f => ({ ...f, status_visible: e.target.checked ? 1 : 0 }))} style={{ width: 'auto', accentColor: '#f97316' }} />
            <label htmlFor="status_visible" style={{ cursor: 'pointer', userSelect: 'none' }}>Show status badge</label>
          </div>
          <div><label>Skills (comma-separated)</label><input value={statusForm.skills} onChange={e => setStatusForm(f => ({ ...f, skills: e.target.value }))} placeholder="Product, React, Python, Writing" /></div>
          <div><label>Building toward</label><textarea rows={3} value={statusForm.building_toward} onChange={e => setStatusForm(f => ({ ...f, building_toward: e.target.value }))} placeholder="A short statement about your longer-term direction..." style={{ resize: 'vertical' }} /></div>
          <button onClick={saveStatus} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
        </div>
      </SlideOver>

      {/* Project edit */}
      <SlideOver open={projectSlide} onClose={closeProjectSlide} title={editingProject ? 'Edit Project' : 'New Project'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div><label>Name *</label><input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label>Description</label><textarea rows={3} value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          <div>
            <label>Status</label>
            <select value={projectForm.status} onChange={e => setProjectForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#e8e6e1', fontSize: '13px' }}>
              <option value="idea">idea</option>
              <option value="active">active</option>
              <option value="exploring">exploring</option>
              <option value="on hold">on hold</option>
              <option value="done">done</option>
            </select>
          </div>
          <div>
            <label>Progress (%)</label>
            <input type="number" min={0} max={100} value={projectForm.progress} onChange={e => setProjectForm(f => ({ ...f, progress: Number(e.target.value) }))} />
          </div>
          <div><label>Links</label><input value={projectForm.links} onChange={e => setProjectForm(f => ({ ...f, links: e.target.value }))} placeholder="https://..." /></div>
          <div><label>Notes</label><textarea rows={3} value={projectForm.notes} onChange={e => setProjectForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          <button onClick={saveProject} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
          {editingProject && (
            <>
              {confirmDeleteProject === editingProject.id ? (
                <div style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#888580', marginBottom: '10px' }}>Delete this project?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => deleteProject(editingProject.id)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '12px', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', background: 'none', cursor: 'pointer' }}>Yes, delete</button>
                    <button onClick={() => setConfirmDeleteProject(null)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '12px', color: '#888580', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteProject(editingProject.id)} style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '12px', textAlign: 'left', padding: 0, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
                >Delete project</button>
              )}
            </>
          )}
        </div>
      </SlideOver>

      {/* Career entry edit */}
      <SlideOver open={entrySlide} onClose={closeEntrySlide} title={editingEntry ? 'Edit Entry' : 'New Career Entry'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label>Type</label>
            <select value={entryForm.type} onChange={e => setEntryForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#e8e6e1', fontSize: '13px' }}>
              <option value="win">win</option>
              <option value="learning">learning</option>
              <option value="milestone">milestone</option>
              <option value="note">note</option>
              <option value="goal">goal</option>
            </select>
          </div>
          <div><label>Title *</label><input value={entryForm.title} onChange={e => setEntryForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div><label>Description</label><textarea rows={4} value={entryForm.description} onChange={e => setEntryForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
          <div><label>Date</label><input type="date" value={entryForm.entry_date} onChange={e => setEntryForm(f => ({ ...f, entry_date: e.target.value }))} /></div>
          <button onClick={saveEntry} className="mt-2 w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:opacity-90 transition-opacity">Save</button>
          {editingEntry && (
            <>
              {confirmDeleteEntry === editingEntry.id ? (
                <div style={{ marginTop: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#888580', marginBottom: '10px' }}>Delete this entry?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => deleteEntry(editingEntry.id)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '12px', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', background: 'none', cursor: 'pointer' }}>Yes, delete</button>
                    <button onClick={() => setConfirmDeleteEntry(null)} style={{ flex: 1, padding: '6px', borderRadius: '6px', fontSize: '12px', color: '#888580', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteEntry(editingEntry.id)} style={{ marginTop: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#4a4845', fontSize: '12px', textAlign: 'left', padding: 0, transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#4a4845')}
                >Delete entry</button>
              )}
            </>
          )}
        </div>
      </SlideOver>
    </div>
  )
}
