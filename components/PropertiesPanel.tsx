'use client'
import { useState, useRef } from 'react'
import { Sparkles, Loader, Send, Copy, RotateCcw, Wand2, Type, Layout, Zap, Link, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { useStore } from '@/lib/store'
import type { Block, BlockStyle } from '@/lib/types'

// ─── Composants de style ──────────────────────────────────────────────────

function ColorInput({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const val = value || ''
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <div className="color-swatch" style={{ background: val || 'transparent' }} onClick={() => ref.current?.click()} />
        <input ref={ref} type="color" value={val || '#000000'} onChange={e => onChange(e.target.value)} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
        <input className="input input-sm" value={val} onChange={e => onChange(e.target.value)} placeholder="transparent" />
      </div>
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max, unit }: { label: string; value?: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}{unit && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> ({unit})</span>}</div>
      <input className="input input-sm" type="number" value={value ?? ''} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))} placeholder="—" />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {title} <span style={{ opacity: 0.5, fontSize: 12 }}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ padding: '6px 14px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>}
    </div>
  )
}

// ─── Panel propriétés ─────────────────────────────────────────────────────

export default function PropertiesPanel() {
  const { blocks, selectedIds, messages, addMessage, clearMessages, claudeLoading, setClaudeLoading, updateBlock, updateBlockStyle } = useStore()
  const [input, setInput] = useState('')

  // Trouver le bloc sélectionné (top-level ou enfant)
  let block: Block | undefined
  let parentId: string | undefined
  if (selectedIds.length === 1) {
    const id = selectedIds[0]
    block = blocks.find(b => b.id === id)
    if (!block) {
      for (const b of blocks) {
        const child = b.children?.find(c => c.id === id)
        if (child) { block = child; parentId = b.id; break }
      }
    }
  }

  const upStyle = (style: Partial<BlockStyle>) => {
    if (!block) return
    updateBlockStyle(block.id, style, parentId)
  }
  const upBlock = (changes: Partial<Block>) => {
    if (!block) return
    updateBlock(block.id, changes, parentId)
  }

  // ─── Claude ──────────────────────────────────────────────────────────────
  const send = async (prompt: string, mode = 'chat') => {
    if (!prompt.trim()) return
    const msg = { role: 'user' as const, content: prompt }
    addMessage(msg); setInput(''); setClaudeLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, msg], block: block || null, mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addMessage({ role: 'assistant', content: data.text })
    } catch (e: unknown) {
      addMessage({ role: 'assistant', content: `Erreur : ${e instanceof Error ? e.message : 'inconnue'}` })
    } finally { setClaudeLoading(false) }
  }

  const isMulti = selectedIds.length > 1

  return (
    <div style={{ width: 260, background: 'var(--panel)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

      {/* Header */}
      <div className="panel-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={12} style={{ color: 'var(--accent)' }} />
          <span className="panel-label">Propriétés</span>
        </div>
        {messages.length > 0 && <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }} onClick={clearMessages}><RotateCcw size={10}/> Reset</button>}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isMulti ? (
          <div style={{ padding: '16px 14px', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
            {selectedIds.length} blocs sélectionnés
          </div>
        ) : !block ? (
          <div style={{ padding: '16px 14px', color: 'var(--muted)', fontSize: 12, textAlign: 'center' }}>
            Sélectionne un bloc
          </div>
        ) : (
          <>
            {/* Position & taille */}
            <Section title="Disposition">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['x','y','width','height'] as const).map(k => (
                  <NumberInput key={k} label={k.toUpperCase()} value={Math.round(block![k] as number)}
                    onChange={v => upBlock({ [k]: v })} min={k === 'width' || k === 'height' ? 1 : undefined} />
                ))}
              </div>
            </Section>

            {/* Typographie */}
            {['heading','text','button','cta'].includes(block.kind) && (
              <Section title="Typographie">
                {/* Texte éditable */}
                <div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contenu</div>
                  <textarea className="input" rows={3} value={block.text || ''} onChange={e => upBlock({ text: e.target.value })} style={{ fontSize: 12 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <NumberInput label="Taille" value={block.style.fontSize} onChange={v => upStyle({ fontSize: v })} min={8} max={200} unit="px" />
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Graisse</div>
                    <select className="input input-sm" value={block.style.fontWeight || '400'} onChange={e => upStyle({ fontWeight: e.target.value })}>
                      {['300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
                <NumberInput label="Interligne" value={block.style.lineHeight} onChange={v => upStyle({ lineHeight: v })} min={1} max={3} />
                <ColorInput label="Couleur texte" value={block.style.color} onChange={v => upStyle({ color: v })} />
                {/* Alignement */}
                <div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alignement</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['left','center','right'] as const).map(a => (
                      <button key={a} onClick={() => upStyle({ textAlign: a })}
                        style={{ flex: 1, padding: '4px', borderRadius: 5, cursor: 'pointer', border: '1px solid', background: block!.style.textAlign === a ? 'var(--accent)' : 'transparent', color: block!.style.textAlign === a ? '#fff' : 'var(--muted)', borderColor: block!.style.textAlign === a ? 'transparent' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a === 'left' ? <AlignLeft size={12}/> : a === 'center' ? <AlignCenter size={12}/> : <AlignRight size={12}/>}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* Image */}
            {block.kind === 'image' && (
              <Section title="Image">
                <div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source URL</div>
                  <input className="input input-sm" placeholder="https://... ou double-clic sur le bloc" value={block.src || ''} onChange={e => upBlock({ src: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Alt text</div>
                  <input className="input input-sm" value={block.alt || ''} onChange={e => upBlock({ alt: e.target.value })} />
                </div>
                <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => {
                  const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'
                  i.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return
                    const r = new FileReader(); r.onload = ev => upBlock({ src: ev.target?.result as string }); r.readAsDataURL(f)
                  }; i.click()
                }}>📁 Uploader une image</button>
              </Section>
            )}

            {/* Apparence */}
            <Section title="Apparence">
              <ColorInput label="Fond" value={block.style.backgroundColor} onChange={v => upStyle({ backgroundColor: v })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput label="Radius" value={block.style.borderRadius} onChange={v => upStyle({ borderRadius: v })} min={0} max={100} unit="px" />
                <NumberInput label="Opacité" value={block.style.opacity} onChange={v => upStyle({ opacity: Math.min(1, Math.max(0, v)) })} min={0} max={1} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput label="Bordure" value={block.style.borderWidth} onChange={v => upStyle({ borderWidth: v })} min={0} max={20} unit="px" />
                <ColorInput label="Couleur bordure" value={block.style.borderColor} onChange={v => upStyle({ borderColor: v })} />
              </div>
            </Section>

            {/* Espacement */}
            <Section title="Espacement">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                {(['paddingTop','paddingRight','paddingBottom','paddingLeft'] as const).map((k, i) => (
                  <div key={k}>
                    <div style={{ fontSize: 9, color: 'var(--muted)', marginBottom: 3, textAlign: 'center' }}>{['↑','→','↓','←'][i]}</div>
                    <input className="input input-sm" type="number" min={0} value={block!.style[k] ?? ''}
                      onChange={e => upStyle({ [k]: Number(e.target.value) })} placeholder="0" style={{ textAlign: 'center', padding: '4px 4px' }} />
                  </div>
                ))}
              </div>
            </Section>

            {/* Lien (pour boutons) */}
            {block.kind === 'button' && (
              <Section title="Lien">
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Link size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <input className="input input-sm" placeholder="https://..." value={block.href || ''} onChange={e => upBlock({ href: e.target.value })} />
                </div>
              </Section>
            )}
          </>
        )}

        {/* ── Claude ── */}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
          <div style={{ padding: '8px 14px 6px', fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} style={{ color: 'var(--accent)' }} /> Claude
          </div>

          {/* Actions rapides */}
          {block && (
            <div style={{ padding: '0 10px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {[
                { icon: <Wand2 size={10}/>, label: 'Améliorer', mode: 'improve', p: 'Améliore ce bloc pour maximiser son impact.' },
                { icon: <Type size={10}/>, label: 'Réécrire', mode: 'copy', p: 'Réécris le texte pour le rendre plus percutant.' },
                { icon: <Layout size={10}/>, label: 'Layout', mode: 'layout', p: 'Propose une meilleure organisation visuelle.' },
                { icon: <Zap size={10}/>, label: '3 CTA', mode: 'copy', p: 'Propose 3 variantes de CTA percutantes.' },
              ].map(q => (
                <button key={q.label} className="btn btn-ghost" style={{ fontSize: 10, padding: '4px 8px', justifyContent: 'flex-start' }}
                  onClick={() => send(q.p, q.mode)} disabled={claudeLoading}>
                  {q.icon} {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center', padding: '8px 0', opacity: 0.6 }}>
                {block ? 'Pose une question sur ce bloc' : 'Sélectionne un bloc'}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className="fadein" style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '96%' }}>
                <div style={{
                  padding: '7px 10px', fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  borderRadius: m.role === 'user' ? '9px 9px 2px 9px' : '2px 9px 9px 9px',
                  background: m.role === 'user' ? 'var(--accent)' : 'var(--card)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                }}>
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <button onClick={() => navigator.clipboard.writeText(m.content)}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 9, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                    <Copy size={8}/> Copier
                  </button>
                )}
              </div>
            ))}
            {claudeLoading && (
              <div className="fadein" style={{ alignSelf: 'flex-start' }}>
                <div style={{ padding: '7px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '2px 9px 9px 9px', display: 'flex', gap: 4 }}>
                  {[0, 0.2, 0.4].map((d, i) => <div key={i} className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animationDelay: `${d}s` }} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Claude */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <input className="input" style={{ fontSize: 12 }}
          placeholder={block ? `Question sur ${block.kind}…` : 'Sélectionne un bloc…'}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          disabled={claudeLoading}
        />
        <button className="btn btn-primary" style={{ padding: '6px 10px', flexShrink: 0 }}
          onClick={() => send(input)} disabled={!input.trim() || claudeLoading}>
          {claudeLoading ? <Loader size={12} className="spin"/> : <Send size={12}/>}
        </button>
      </div>
    </div>
  )
}
