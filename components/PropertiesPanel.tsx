'use client'
import { useState } from 'react'
import { Sparkles, Loader, Send, Copy, RotateCcw, Wand2, Type, Layout, Zap } from 'lucide-react'
import { useStore } from '@/lib/store'

const QUICK: Array<{ icon: React.ReactNode; label: string; mode: string; prompt: string }> = [
  { icon: <Wand2 size={11}/>, label: 'Améliorer', mode: 'improve', prompt: 'Améliore cette section pour maximiser la conversion.' },
  { icon: <Type size={11}/>, label: 'Réécrire', mode: 'copy', prompt: 'Réécris les textes pour qu\'ils soient plus percutants.' },
  { icon: <Layout size={11}/>, label: 'Réorganiser', mode: 'layout', prompt: 'Propose une meilleure organisation pour cette section.' },
  { icon: <Zap size={11}/>, label: 'CTA', mode: 'copy', prompt: 'Propose 3 variantes de CTA plus efficaces.' },
]

export default function PropertiesPanel() {
  const { inspection, selectedSectionId, selectedBlockId, updateSection, updateBlock,
    claudeMessages, addClaudeMessage, clearClaude, claudeLoading, setClaudeLoading } = useStore()
  const [input, setInput] = useState('')

  const section = inspection?.sections?.find(s => s.id === selectedSectionId)
  const block = section?.blocks?.find(b => b.id === selectedBlockId)
  const selected = block || section

  const send = async (prompt: string, mode = 'chat') => {
    if (!prompt.trim()) return
    const msg = { role: 'user' as const, content: prompt }
    addClaudeMessage(msg)
    setInput('')
    setClaudeLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...claudeMessages, msg],
          section: section || null,
          block: block || null,
          pageUrl: inspection?.url,
          mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addClaudeMessage({ role: 'assistant', content: data.text })
    } catch (e: unknown) {
      addClaudeMessage({ role: 'assistant', content: `Erreur : ${e instanceof Error ? e.message : 'inconnue'}` })
    } finally {
      setClaudeLoading(false)
    }
  }

  return (
    <div style={{ width:280, background:'var(--panel)', borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <Sparkles size={13} style={{ color:'var(--accent)' }}/>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Claude</span>
        </div>
        {claudeMessages.length > 0 && (
          <button onClick={clearClaude} className="btn btn-ghost" style={{ padding:'2px 8px', fontSize:10 }}>
            <RotateCcw size={10}/> Reset
          </button>
        )}
      </div>

      {/* Sélection courante */}
      {block ? (
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'#7c6af712' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'var(--muted)', textTransform:'uppercase' }}>Bloc · {block.tag}</span>
          </div>
          {/* Édition texte */}
          <textarea
            value={block.editedText ?? block.text}
            onChange={e => updateBlock(selectedSectionId!, block.id, { editedText: e.target.value })}
            style={{ width:'100%', minHeight:60, background:'var(--card)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', fontFamily:'inherit', fontSize:12, padding:'6px 8px', resize:'vertical', lineHeight:1.5 }}
          />
          {/* Propriétés */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, marginTop:8 }}>
            {(['x','y','width','height'] as const).map(k => (
              <div key={k}>
                <div style={{ fontSize:9, color:'var(--muted)', marginBottom:2 }}>{k.toUpperCase()}</div>
                <input className="input" type="number" style={{ fontSize:11, padding:'4px 7px' }}
                  value={Math.round(block[k])}
                  onChange={e => updateBlock(selectedSectionId!, block.id, { [k]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      ) : section ? (
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:`${section.color}10` }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:section.color }}/>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{section.label}</span>
            <span style={{ fontSize:10, color:'var(--muted)', marginLeft:'auto' }}>{section.blocks?.length||0} blocs</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {(['x','y','width','height'] as const).map(k => (
              <div key={k}>
                <div style={{ fontSize:9, color:'var(--muted)', marginBottom:2 }}>{k.toUpperCase()}</div>
                <input className="input" type="number" style={{ fontSize:11, padding:'4px 7px' }}
                  value={Math.round(section[k])}
                  onChange={e => updateSection(section.id, { [k]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding:'14px', borderBottom:'1px solid var(--border)', color:'var(--muted)', fontSize:12, textAlign:'center' }}>
          Sélectionne une section ou un bloc
        </div>
      )}

      {/* Actions rapides */}
      {selected && (
        <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
          {QUICK.map(q => (
            <button key={q.label} className="btn btn-ghost" style={{ fontSize:11, padding:'5px 8px', justifyContent:'flex-start' }}
              onClick={() => send(q.prompt, q.mode)} disabled={claudeLoading}>
              {q.icon} {q.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {claudeMessages.length === 0 && (
          <div style={{ color:'var(--muted)', fontSize:12, textAlign:'center', marginTop:16, opacity:0.6 }}>
            {selected ? 'Pose une question ou utilise les actions rapides' : 'Sélectionne un élément'}
          </div>
        )}
        {claudeMessages.map((m, i) => (
          <div key={i} className="fadein" style={{ alignSelf: m.role==='user' ? 'flex-end' : 'flex-start', maxWidth:'94%' }}>
            <div style={{ padding:'8px 11px', borderRadius: m.role==='user' ? '10px 10px 2px 10px' : '2px 10px 10px 10px',
              background: m.role==='user' ? 'var(--accent)' : 'var(--card)',
              border: m.role==='assistant' ? '1px solid var(--border)' : 'none',
              fontSize:12, lineHeight:1.5, color: m.role==='user' ? '#fff' : 'var(--text)', whiteSpace:'pre-wrap' }}>
              {m.content}
            </div>
            {m.role==='assistant' && (
              <button onClick={() => navigator.clipboard.writeText(m.content)}
                style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:10, padding:'2px 0', display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                <Copy size={9}/> Copier
              </button>
            )}
          </div>
        ))}
        {claudeLoading && (
          <div className="fadein" style={{ alignSelf:'flex-start' }}>
            <div style={{ padding:'8px 11px', borderRadius:'2px 10px 10px 10px', background:'var(--card)', border:'1px solid var(--border)', display:'flex', gap:4, alignItems:'center' }}>
              {[0,0.2,0.4].map((d,i) => <div key={i} className="pulse" style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent)', animationDelay:`${d}s` }}/>)}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
        <input className="input" style={{ fontSize:12 }}
          placeholder={selected ? (block ? `Question sur ${block.tag}…` : `Question sur "${section?.label}"…`) : 'Sélectionne un élément…'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          disabled={claudeLoading}
        />
        <button className="btn btn-primary" onClick={() => send(input)} disabled={!input.trim() || claudeLoading} style={{ padding:'6px 10px', flexShrink:0 }}>
          {claudeLoading ? <Loader size={12} className="spin"/> : <Send size={12}/>}
        </button>
      </div>
    </div>
  )
}
