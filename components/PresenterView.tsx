'use client'
import { useEffect, useState } from 'react'
import { X, MousePointerClick, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import type { Block, BlockStyle, Screen, DesignTokens } from '@/lib/types'

function css(s: BlockStyle): React.CSSProperties {
  return {
    fontSize: s.fontSize, fontWeight: s.fontWeight as React.CSSProperties['fontWeight'], color: s.color,
    textAlign: s.textAlign as React.CSSProperties['textAlign'], lineHeight: s.lineHeight, fontFamily: s.fontFamily,
    backgroundColor: s.backgroundColor, borderRadius: s.borderRadius,
    borderWidth: s.borderWidth, borderColor: s.borderColor, borderStyle: s.borderWidth ? 'solid' : undefined,
    paddingTop: s.paddingTop, paddingRight: s.paddingRight, paddingBottom: s.paddingBottom, paddingLeft: s.paddingLeft,
    opacity: s.opacity, boxShadow: s.boxShadow, gap: s.gap, display: s.display,
    flexDirection: s.flexDirection as React.CSSProperties['flexDirection'], alignItems: s.alignItems, justifyContent: s.justifyContent,
  }
}

export default function PresenterView({ screens, tokens, startId, onExit, onEdit }: {
  screens: Screen[]
  tokens: DesignTokens
  startId?: string
  onExit?: () => void
  onEdit?: () => void
}) {
  const [curId, setCurId] = useState(startId || screens[0]?.id)
  const [hint, setHint] = useState(true)
  const screen = screens.find(s => s.id === curId) || screens[0]
  const idx = screens.findIndex(s => s.id === screen?.id)

  const go = (id: string) => { setCurId(id); setHint(true); setTimeout(() => setHint(false), 1400) }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit?.()
      if (e.key === 'ArrowRight' && idx < screens.length - 1) setCurId(screens[idx + 1].id)
      if (e.key === 'ArrowLeft' && idx > 0) setCurId(screens[idx - 1].id)
    }
    window.addEventListener('keydown', onKey)
    const t = setTimeout(() => setHint(false), 2500)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t) }
  }, [idx, screens, onExit])

  if (!screen) return null

  const tokenVars = Object.fromEntries([
    ...tokens.colors.map(c => [`--tok-${c.id}`, c.value]),
    ...tokens.shadows.map(sh => [`--shadow-${sh.id}`, sh.value]),
  ]) as React.CSSProperties
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const scale = Math.min((vw - 80) / screen.width, (vh - 110) / screen.height, 1)

  const renderBlock = (b: Block): React.ReactNode => {
    if (b.visible === false) return null
    const linked = !!b.linkTo && screens.some(s => s.id === b.linkTo)
    const isContainer = !!b.children?.length
    const style: React.CSSProperties = {
      ...css(b.style), position: 'absolute', left: b.x, top: b.y, width: b.width, height: b.height,
      overflow: isContainer ? 'visible' : 'hidden', cursor: linked ? 'pointer' : 'default',
      whiteSpace: 'pre-wrap', wordBreak: 'break-word',
    }
    const onClick = linked ? (e: React.MouseEvent) => { e.stopPropagation(); go(b.linkTo!) } : undefined

    let inner: React.ReactNode = null
    if (b.kind === 'image') {
      inner = b.src ? <img src={b.src} alt={b.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: b.style.borderRadius }} /> : null
    } else if (b.kind === 'divider') {
      inner = <div style={{ width: '100%', height: '100%', background: b.style.backgroundColor || '#ccc' }} />
    } else if (isContainer) {
      inner = <div style={{ position: 'relative', width: '100%', height: '100%' }}>{b.children!.map(c => renderBlock(c))}</div>
    } else if (b.kind === 'button') {
      inner = <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{b.text}</div>
    } else {
      inner = b.text
    }
    return <div key={b.id} style={style} onClick={onClick} className={linked ? 'present-link' : undefined}>{inner}</div>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#08080c', display: 'flex', alignItems: 'center', justifyContent: 'center', ...tokenVars }}
      onClick={() => onExit?.()}>
      <style>{`.present-link { transition: outline 0.1s } .present-link:hover { outline: 2px solid rgba(124,106,247,0.6); outline-offset: 1px }`}</style>

      <div style={{ position: 'relative', width: screen.width * scale, height: screen.height * scale }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: screen.width, height: screen.height, background: screen.background, transformOrigin: '0 0', transform: `scale(${scale})`, borderRadius: 4, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}>
          {screen.blocks.map(b => renderBlock(b))}
        </div>
      </div>

      {/* Barre du présentateur */}
      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px', fontSize: 12, color: 'var(--dim)' }}
        onClick={e => e.stopPropagation()}>
        <button className="btn-icon" title="Précédent (←)" disabled={idx <= 0} onClick={() => idx > 0 && setCurId(screens[idx - 1].id)} style={{ opacity: idx > 0 ? 1 : 0.3 }}><ChevronLeft size={14} /></button>
        <span style={{ fontWeight: 600, color: 'var(--text)', minWidth: 80, textAlign: 'center' }}>{screen.name}</span>
        <span style={{ color: 'var(--muted)', fontSize: 11 }}>{idx + 1}/{screens.length}</span>
        <button className="btn-icon" title="Suivant (→)" disabled={idx >= screens.length - 1} onClick={() => idx < screens.length - 1 && setCurId(screens[idx + 1].id)} style={{ opacity: idx < screens.length - 1 ? 1 : 0.3 }}><ChevronRight size={14} /></button>
        {onEdit && <><div style={{ width: 1, height: 14, background: 'var(--border)' }} /><button className="btn-icon" title="Ouvrir dans l'éditeur" onClick={onEdit}><Pencil size={13} /></button></>}
        {onExit && <><div style={{ width: 1, height: 14, background: 'var(--border)' }} /><button className="btn-icon" title="Quitter (Échap)" onClick={onExit}><X size={14} /></button></>}
      </div>

      {hint && (
        <div className="fadein" style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.4)', borderRadius: 20, padding: '7px 14px', fontSize: 12, color: 'var(--text)' }}>
          <MousePointerClick size={13} /> Clique les éléments liés · ← → pour changer d'écran{onExit ? ' · Échap pour quitter' : ''}
        </div>
      )}
    </div>
  )
}
