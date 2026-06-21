'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { useStore } from '@/lib/store'
import type { Section, Block } from '@/lib/types'

const BLOCK_COLORS: Record<string, string> = {
  heading: '#7c6af7', text: '#60a5fa', cta: '#f59e0b',
  image: '#f472b6', form: '#34d399', unknown: '#6b7280',
  navbar: '#22d3a0', footer: '#6b7280', section: '#94a3b8',
}

interface Drag {
  type: 'section'|'block'
  sectionId: string; blockId?: string
  startMX: number; startMY: number
  startX: number; startY: number
}
interface Resize {
  type: 'section'|'block'
  sectionId: string; blockId?: string
  startMX: number; startMY: number
  startW: number; startH: number
}

export default function Canvas() {
  const ref = useRef<HTMLDivElement>(null)
  const {
    inspection, selectedSectionId, selectedBlockId, hoveredBlockId, zoom, panX, panY, showBlocks,
    updateSection, updateBlock, selectSection, selectBlock, hoverBlock, setZoom, setPan,
  } = useStore()

  const drag = useRef<Drag | null>(null)
  const resize = useRef<Resize | null>(null)
  const pan = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null)
  const editing = useRef<{ sectionId: string; blockId: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Zoom molette
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = ref.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top
    const f = e.deltaY > 0 ? 0.91 : 1.1
    const nz = Math.min(2, Math.max(0.1, zoom * f))
    setPan(cx - (cx - panX) * (nz / zoom), cy - (cy - panY) * (nz / zoom))
    setZoom(nz)
  }, [zoom, panX, panY, setPan, setZoom])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // Mouse move / up globaux
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (pan.current) {
        setPan(e.clientX - pan.current.sx + pan.current.spx, e.clientY - pan.current.sy + pan.current.spy)
        return
      }
      if (drag.current) {
        const dx = (e.clientX - drag.current.startMX) / zoom
        const dy = (e.clientY - drag.current.startMY) / zoom
        if (drag.current.type === 'section') {
          updateSection(drag.current.sectionId, { x: drag.current.startX + dx, y: drag.current.startY + dy })
        } else if (drag.current.blockId) {
          updateBlock(drag.current.sectionId, drag.current.blockId, {
            x: drag.current.startX + dx, y: drag.current.startY + dy
          })
        }
        return
      }
      if (resize.current) {
        const dx = (e.clientX - resize.current.startMX) / zoom
        const dy = (e.clientY - resize.current.startMY) / zoom
        if (resize.current.type === 'section') {
          updateSection(resize.current.sectionId, {
            width: Math.max(200, resize.current.startW + dx),
            height: Math.max(40, resize.current.startH + dy),
          })
        } else if (resize.current.blockId) {
          updateBlock(resize.current.sectionId, resize.current.blockId, {
            width: Math.max(40, resize.current.startW + dx),
            height: Math.max(16, resize.current.startH + dy),
          })
        }
      }
    }
    const up = () => { drag.current = null; resize.current = null; pan.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [zoom, updateSection, updateBlock, setPan])

  const startSectionDrag = (e: React.MouseEvent, sec: Section) => {
    e.stopPropagation()
    if (sec.locked || editingId) return
    drag.current = { type: 'section', sectionId: sec.id, startMX: e.clientX, startMY: e.clientY, startX: sec.x, startY: sec.y }
  }
  const startBlockDrag = (e: React.MouseEvent, sec: Section, blk: Block) => {
    e.stopPropagation()
    if (editingId) return
    drag.current = { type: 'block', sectionId: sec.id, blockId: blk.id, startMX: e.clientX, startMY: e.clientY, startX: blk.x, startY: blk.y }
  }
  const startSectionResize = (e: React.MouseEvent, sec: Section) => {
    e.stopPropagation()
    resize.current = { type: 'section', sectionId: sec.id, startMX: e.clientX, startMY: e.clientY, startW: sec.width, startH: sec.height }
  }
  const startBlockResize = (e: React.MouseEvent, sec: Section, blk: Block) => {
    e.stopPropagation()
    resize.current = { type: 'block', sectionId: sec.id, blockId: blk.id, startMX: e.clientX, startMY: e.clientY, startW: blk.width, startH: blk.height }
  }

  const startEdit = (e: React.MouseEvent, sec: Section, blk: Block) => {
    e.stopPropagation()
    if (!blk.text && blk.type === 'image') return
    setEditingId(blk.id)
    setEditText(blk.editedText ?? blk.text)
    editing.current = { sectionId: sec.id, blockId: blk.id }
  }
  const commitEdit = () => {
    if (editing.current) {
      updateBlock(editing.current.sectionId, editing.current.blockId, { editedText: editText })
    }
    setEditingId(null)
    editing.current = null
  }

  const sections = inspection?.sections?.filter(s => s.visible !== false) || []

  return (
    <div ref={ref} style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--bg)', userSelect: editingId ? 'text' : 'none' }}
      onMouseDown={(e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
          pan.current = { sx: e.clientX, sy: e.clientY, spx: panX, spy: panY }
          e.preventDefault()
        } else {
          if (editingId) commitEdit()
          selectSection(null)
        }
      }}
    >
      {/* Grille */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="g" width={24*zoom} height={24*zoom} patternUnits="userSpaceOnUse" x={panX%(24*zoom)} y={panY%(24*zoom)}>
            <circle cx={0} cy={0} r={0.6} fill="#252535" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      {/* Empty / loading */}
      {!inspection && <Hint>Entre une URL pour commencer</Hint>}
      {inspection?.status === 'capturing' && <Spin label="Capture du screenshot…" />}
      {inspection?.status === 'analyzing' && <Spin label="Claude analyse les éléments…" />}

      {/* Canvas world */}
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${panX}px,${panY}px) scale(${zoom})` }}>
        {sections.map(sec => {
          const isSel = sec.id === selectedSectionId && !selectedBlockId
          const color = sec.color

          return (
            <div key={sec.id} style={{ position: 'absolute', left: sec.x, top: sec.y, width: sec.width, height: sec.height }}>

              {/* Screenshot clippé en fond */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4 }}
                onMouseDown={(e) => { e.stopPropagation(); selectSection(sec.id); startSectionDrag(e, sec) }}
              >
                <div
                  onMouseDown={(e) => { e.stopPropagation(); selectSection(sec.id); startSectionDrag(e, sec) }}
                  style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4, cursor: sec.locked ? 'default' : 'move' }}
                >
                  <img src={inspection!.fullScreenshot} draggable={false}
                    style={{
                      position: 'absolute',
                      top: -(sec.srcY * (sec.width / sec.srcWidth)),
                      left: 0, width: sec.width, height: 'auto',
                      display: 'block', pointerEvents: 'none',
                      opacity: showBlocks ? 0.35 : 1,
                    }}
                  />
                </div>

                {/* Outline section */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 4,
                  outline: isSel ? `2px solid ${color}` : `1px solid ${color}33`,
                  outlineOffset: isSel ? 2 : 0,
                  boxShadow: isSel ? `0 0 0 4px ${color}15` : undefined,
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Label section */}
              <div style={{
                position: 'absolute', top: -22, left: 0,
                background: color, color: '#000',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '4px 4px 0 0',
                letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                opacity: isSel || sec.id === selectedSectionId ? 1 : 0.6,
                cursor: 'move',
              }}
                onMouseDown={(e) => { e.stopPropagation(); selectSection(sec.id); startSectionDrag(e, sec) }}
              >
                {sec.label}
              </div>

              {/* ── Blocs DOM ── */}
              {showBlocks && sec.blocks?.map(blk => {
                if (!blk.visible) return null
                const isSelBlk = blk.id === selectedBlockId
                const isHov = blk.id === hoveredBlockId
                const isEditing = blk.id === editingId
                const bColor = BLOCK_COLORS[blk.type] || BLOCK_COLORS.unknown
                const displayText = blk.editedText ?? blk.text

                return (
                  <div key={blk.id}
                    onMouseEnter={() => hoverBlock(blk.id)}
                    onMouseLeave={() => hoverBlock(null)}
                    onMouseDown={(e) => { e.stopPropagation(); selectBlock(sec.id, blk.id); startBlockDrag(e, sec, blk) }}
                    onDoubleClick={(e) => startEdit(e, sec, blk)}
                    style={{
                      position: 'absolute',
                      left: blk.x, top: blk.y,
                      width: blk.width, height: blk.height,
                      cursor: isEditing ? 'text' : 'move',
                      outline: isSelBlk ? `2px solid ${bColor}` : isHov ? `1px solid ${bColor}88` : '1px solid transparent',
                      outlineOffset: isSelBlk ? 1 : 0,
                      borderRadius: 3,
                      boxShadow: isSelBlk ? `0 0 0 3px ${bColor}20` : undefined,
                      background: isSelBlk ? `${bColor}12` : isHov ? `${bColor}08` : 'transparent',
                      zIndex: isSelBlk ? 10 : 1,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Contenu du bloc */}
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Escape') { setEditingId(null); editing.current = null } }}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          background: 'rgba(12,12,24,0.9)', color: '#e2e2f0',
                          border: 'none', outline: 'none', resize: 'none',
                          fontFamily: 'inherit', padding: 4,
                          fontSize: Math.min(blk.styles?.fontSize || 14, 24),
                          fontWeight: blk.styles?.fontWeight || '400',
                          lineHeight: 1.4, zIndex: 20,
                        }}
                      />
                    ) : (
                      displayText && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center',
                          padding: '2px 6px',
                          fontSize: Math.min(blk.styles?.fontSize || 14, 20),
                          fontWeight: blk.styles?.fontWeight || '400',
                          color: isSelBlk || isHov ? '#e2e2f0' : 'transparent',
                          overflow: 'hidden',
                          whiteSpace: blk.type === 'heading' ? 'nowrap' : 'normal',
                          transition: 'color 0.1s',
                        }}>
                          {displayText}
                        </div>
                      )
                    )}

                    {/* Badge type */}
                    {(isSelBlk || isHov) && !isEditing && (
                      <div style={{
                        position: 'absolute', top: 2, left: 2,
                        background: bColor, color: '#000',
                        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        {blk.tag}{blk.editedText ? ' ✏' : ''}
                      </div>
                    )}

                    {/* Handle resize bloc */}
                    {isSelBlk && !isEditing && (
                      <div onMouseDown={(e) => { e.stopPropagation(); startBlockResize(e, sec, blk) }}
                        style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, background: bColor, cursor: 'nwse-resize', borderRadius: '2px 0 2px 0' }} />
                    )}
                  </div>
                )
              })}

              {/* Handle resize section */}
              {isSel && !sec.locked && (
                <div onMouseDown={(e) => { e.stopPropagation(); startSectionResize(e, sec) }}
                  style={{ position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, background: color, cursor: 'nwse-resize', borderRadius: '0 0 4px 0', zIndex: 20 }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Zoom bar */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 11, color: 'var(--muted)' }}>
        <span>{Math.round(zoom * 100)}%</span>
        <button style={btnStyle} onClick={() => setZoom(Math.max(0.1, zoom * 0.85))}>−</button>
        <button style={btnStyle} onClick={() => setZoom(Math.min(2, zoom * 1.18))}>+</button>
        <button style={{ ...btnStyle, fontSize: 10 }} onClick={() => { setZoom(0.55); setPan(60, 40) }}>Reset</button>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'var(--muted)', fontSize: 10, opacity: 0.45 }}>
        Scroll = zoom · Alt+drag = pan · Double-clic = éditer texte
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = { background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1 }

function Hint({ children }: { children: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none' }}>
      <div style={{ fontSize: 44, opacity: 0.07 }}>⊞</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{children}</div>
    </div>
  )
}
function Spin({ label }: { label: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%' }} className="spin" />
      <div style={{ color: 'var(--dim)', fontSize: 12 }}>{label}</div>
    </div>
  )
}
