'use client'
import { useState } from 'react'
import { Sparkles, Loader, Send, Copy, RotateCcw, Wand2, Type, Layout, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'

const QUICK_ACTIONS = [
  { icon: <Wand2 size={11} />, label: 'Améliorer', mode: 'improve', prompt: 'Améliore cette section pour maximiser la conversion et l\'impact visuel.' },
  { icon: <Type size={11} />, label: 'Reécrire', mode: 'copy', prompt: 'Réécris les textes de cette section pour qu\'ils soient plus percutants et convaincants.' },
  { icon: <Layout size={11} />, label: 'Réorganiser', mode: 'layout', prompt: 'Propose une meilleure organisation visuelle pour cette section.' },
  { icon: <Zap size={11} />, label: 'CTA fort', mode: 'copy', prompt: 'Propose 3 variantes de CTA (call-to-action) plus efficaces pour cette section.' },
]

export default function PropertiesPanel() {
  const { inspection, selectedId, updateSection, claudeMessages, addClaudeMessage, clearClaude, claudeLoading, setClaudeLoading } = useStore()
  const [input, setInput] = useState('')
  const section = inspection?.sections?.find(s => s.id === selectedId)

  const sendMessage = async (promptText: string, mode = 'chat') => {
    if (!promptText.trim()) return
    const userMsg = { role: 'user' as const, content: promptText }
    addClaudeMessage(userMsg)
    setInput('')
    setClaudeLoading(true)

    try {
      const allMessages = [...claudeMessages, userMsg]
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          section: section || null,
          pageUrl: inspection?.url,
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addClaudeMessage({ role: 'assistant', content: data.text })
    } catch (err: unknown) {
      addClaudeMessage({ role: 'assistant', content: `Erreur : ${err instanceof Error ? err.message : 'Inconnue'}` })
    } finally {
      setClaudeLoading(false)
    }
  }

  return (
    <div style={{ width: 280, background: 'var(--panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={13} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Claude</span>
        </div>
        {claudeMessages.length > 0 && (
          <button onClick={clearClaude} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }}>
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>

      {/* Section sélectionnée */}
      {section ? (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: `${section.color}10` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: section.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{section.label}</span>
          </div>

          {/* Propriétés */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[
              { label: 'X', key: 'x' }, { label: 'Y', key: 'y' },
              { label: 'W', key: 'width' }, { label: 'H', key: 'height' },
            ].map(({ label, key }) => (
              <div key={key}>
                <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
                <input
                  className="input"
                  type="number"
                  value={Math.round((section as unknown as Record<string, number>)[key])}
                  onChange={e => updateSection(section.id, { [key]: Number(e.target.value) })}
                  style={{ fontSize: 11, padding: '4px 8px' }}
                />
              </div>
            ))}
          </div>

          {/* Contenu détecté */}
          {section.content?.headline && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: 'var(--card)', borderRadius: 6, fontSize: 11, color: 'var(--dim)', fontStyle: 'italic' }}>
              "{section.content.headline}"
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
          Sélectionne une section pour l'analyser avec Claude
        </div>
      )}

      {/* Actions rapides */}
      {section && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {QUICK_ACTIONS.map(({ icon, label, mode, prompt }) => (
            <button key={label} className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 8px', justifyContent: 'flex-start' }}
              onClick={() => sendMessage(prompt, mode)} disabled={claudeLoading}>
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {claudeMessages.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 20, opacity: 0.6 }}>
            {section ? 'Pose une question sur cette section…' : 'Sélectionne une section et pose une question'}
          </div>
        )}

        {claudeMessages.map((msg, i) => (
          <div key={i} className="fadein" style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '92%',
          }}>
            <div style={{
              padding: '8px 11px',
              borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '2px 10px 10px 10px',
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--card)',
              border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize: 12, lineHeight: 1.5, color: msg.role === 'user' ? '#fff' : 'var(--text)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
            {msg.role === 'assistant' && (
              <button onClick={() => navigator.clipboard.writeText(msg.content)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 10, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <Copy size={9} /> Copier
              </button>
            )}
          </div>
        ))}

        {claudeLoading && (
          <div className="fadein" style={{ alignSelf: 'flex-start' }}>
            <div style={{ padding: '8px 11px', borderRadius: '2px 10px 10px 10px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <div className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />
              <div className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animationDelay: '0.2s' }} />
              <div className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input
          className="input"
          placeholder={section ? `Question sur "${section.label}"…` : 'Sélectionne une section…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          disabled={claudeLoading}
          style={{ fontSize: 12 }}
        />
        <button className="btn btn-primary" onClick={() => sendMessage(input)} disabled={!input.trim() || claudeLoading} style={{ padding: '6px 10px', flexShrink: 0 }}>
          {claudeLoading ? <Loader size={12} className="spin" /> : <Send size={12} />}
        </button>
      </div>
    </div>
  )
}
