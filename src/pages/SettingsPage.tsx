import { useState, useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { CoachSettings } from '../types'

const DEFAULT_ORDER = ['goals', 'habits', 'books', 'career', 'family', 'health', 'journal']

export default function SettingsPage() {
  const setSectionOrder = useAppStore((s) => s.setSectionOrder)

  const [coach, setCoach]           = useState<CoachSettings | null>(null)
  const [profile, setProfile]       = useState('')
  const [provider, setProvider]     = useState('ollama')
  const [apiKey, setApiKey]         = useState('')
  const [ollamaModel, setOllamaModel] = useState('llama3.2')
  const [coachSaved, setCoachSaved] = useState(false)

  useEffect(() => {
    window.db.coachSettings.get().then((s) => {
      if (!s) return
      setCoach(s)
      setProfile(s.profile)
      setProvider(s.llm_provider)
      setApiKey(s.api_key)
      setOllamaModel(s.ollama_model)
    })
  }, [])

  async function saveCoach() {
    await window.db.coachSettings.set({
      profile,
      llm_provider: provider,
      api_key: apiKey,
      ollama_model: ollamaModel,
    })
    setCoachSaved(true)
    setTimeout(() => setCoachSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '9px 12px',
    color: '#d4d0cb',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: '#888580',
    marginBottom: '6px',
    fontFamily: 'monospace',
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'inline-flex', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', color: '#4a4845', letterSpacing: '0.08em', marginBottom: '12px' }}>
          08 — settings
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#e8e6e1', marginBottom: '8px' }}>Settings</h2>
        <p style={{ color: '#888580', fontSize: '14px' }}>Manage your personal OS preferences.</p>
      </div>

      {/* Dashboard Order */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px', color: '#e8e6e1', fontWeight: 600, fontSize: '14px' }}>Dashboard Order</div>
        <p style={{ color: '#888580', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
          Reset the Home dashboard card order back to the default arrangement.
        </p>
        <button
          onClick={() => setSectionOrder(DEFAULT_ORDER)}
          style={{ padding: '8px 18px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '6px', color: '#f97316', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s ease' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.18)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.1)')}
        >
          Reset Dashboard Order
        </button>
      </div>

      {/* Coach Settings */}
      <div className="card">
        <div style={{ marginBottom: '6px', color: '#e8e6e1', fontWeight: 600, fontSize: '14px' }}>Coach</div>
        <p style={{ color: '#888580', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
          Configure the LLM coach used in Journal. It tries Ollama locally first, then falls back to your API key.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Profile */}
          <div>
            <label style={labelStyle}>About you (sent to every coach prompt)</label>
            <textarea
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder={'e.g. INFJ, values depth over breadth, building software products, father of two, optimising for intentionality and calm focus.'}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '11px', color: '#4a4845', marginTop: '5px' }}>
              The more context you give, the more personalised the coaching. Personality type, values, current focus, life context.
            </p>
          </div>

          {/* Provider */}
          <div>
            <label style={labelStyle}>LLM provider (fallback if Ollama is not running)</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="ollama">Ollama only (no API fallback)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="anthropic">Anthropic (Claude Sonnet)</option>
            </select>
          </div>

          {/* Ollama model */}
          <div>
            <label style={labelStyle}>Ollama model</label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="llama3.2"
              style={inputStyle}
            />
            <p style={{ fontSize: '11px', color: '#4a4845', marginTop: '5px' }}>
              Make sure it's pulled: <code style={{ color: '#888580' }}>ollama pull {ollamaModel || 'llama3.2'}</code>
            </p>
          </div>

          {/* API key (shown only when provider is not ollama-only) */}
          {provider !== 'ollama' && (
            <div>
              <label style={labelStyle}>{provider === 'openai' ? 'OpenAI' : 'Anthropic'} API key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: '#4a4845', marginTop: '5px' }}>
                Stored locally in your SQLite database. Never sent anywhere except the {provider === 'openai' ? 'OpenAI' : 'Anthropic'} API when you explicitly ask for coach feedback.
              </p>
            </div>
          )}

          <button
            onClick={saveCoach}
            style={{
              padding: '9px 20px',
              background: coachSaved ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)',
              border: `1px solid ${coachSaved ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)'}`,
              borderRadius: '6px',
              color: coachSaved ? '#22c55e' : '#f97316',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              alignSelf: 'flex-start',
            }}
          >
            {coachSaved ? 'Saved ✓' : 'Save Coach Settings'}
          </button>
        </div>
      </div>

      {/* Suppress unused variable warning */}
      {coach && null}
    </div>
  )
}

