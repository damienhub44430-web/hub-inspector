'use client'
import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/lib/store'
import type { Block, BlockStyle } from '@/lib/types'

// ─── Rendu d'un bloc individuel ───────────────────────────────────────────
function styleToCSS(s: BlockStyle, extra?: React.CSSProperties): React.CSSProperties {
  return {
    fontSize: s.fontSize,
    fontWeight: s.fontWeight,
    color: s.color,
    textAlign: s.textAlign as React.CSSProperties['textAlign'],
    lineHeight: s.lineHeight,
    fontFamily: s.fontFamily,
    backgroundColor: s.backgroundColor,
    borderRadius: s.borderRadius,
    borderWidth: s.borderWidth,
    borderColor: s.borderColor,
    borderStyle: s.borderWidth ? 'solid' : undefined,
    paddingTop: s.paddingTop,
    paddingRight: s.paddingRight,
    paddingBottom: s.paddingBottom,
    paddingLeft: s.paddingLeft,
    opacity: s.opacity,
    boxShadow: s.boxShadow,
    gap: s.gap,
    display: s.display,
    flexDirection: s.flexDirection as React.CSSProperties['flexDirection'],
    alignItems: s.alignItems,
    justifyContent: s.justifyContent,
    ...extra,
  }
}

function BlockContent({ block, isEditing, onTextChange }: {
  block: Block
  isEditing: boolean
  onTextChange: (text: string) => void
}) {
  const css = styleToCSS(block.style)

  if (block.kind === 'image') {
    return block.src
      ? <img src={block.src} alt={block.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: block.style.borderRadius, display: 'block' }} draggable={false} />
      : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--card2)', borderRadius: block.style.borderRadius || 8, border: '2px dashed var(--border2)', color: 'var(--muted)' }}>
          <span style={{ fontSize: 28, opacity: 0.4 }}>🖼</span>
          <span style={{ fontSize: 11 }}>Double-clic pour ajouter une image</span>
        </div>
      )
  }

  if (block.kind === 'divider') {
    return <div style={{ width: '100%', height: '100%', backgroundColor: block.style.backgroundColor || 'var(--border2)' }} />
  }

  if (block.kind === 'spacer') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>ESPACEUR</span>
      </div>
    )
  }

  const text = block.text || ''

  if (isEditing) {
    return (
      <div
        contentEditable suppressContentEditableWarning
        onInput={e => onTextChange((e.target as HTMLElement).innerText)}
        style={{ ...css, width: '100%', height: '100%', outline: 'none', cursor: 'text', userSelect: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br>') }}
      />
    )
  }

  return (
    <div style={{ ...css, width: '100%', height: '100%', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden' }}>
      {block.kind === 'button' ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{text}</div>
      ) : text || <span style={{ color: 'var(--muted)', opacity: 0.5 }}>{block.placeholder || 'Double-clic pour éditer'}</span>}
    </div>
  )
}

// ─── Handles de resize ───────────────────────────────────────────────────
const HANDLES = [
  { id: 'nw', cx: 0,   cy: 0,   cursor: 'nwse-resize' },
  { id: 'n',  cx: 0.5, cy: 0,   cursor: 'ns-resize' },
  { id: 'ne', cx: 1,   cy: 0,   cursor: 'nesw-resize' },
  { id: 'e',  cx: 1,   cy: 0.5, cursor: 'ew-resize' },
  { id: 'se', cx: 1,   cy: 1,   cursor: 'nwse-resize' },
  { id: 's',  cx: 0.5, cy: 1,   cursor: 'ns-resize' },
  { id: 'sw', cx: 0,   cy: 1,   cursor: 'nesw-resize' },
  { id: 'w',  cx: 0,   cy: 0.5, cursor: 'ew-resize' },
] as const

// ─── Canvas principal ─────────────────────────────────────────────────────
export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { screens, currentScreenId, tokens, components, selectedIds, editingId, zoom, panX, panY,
    select, clearSelection, setEditing, setZoom, setPan,
    updateBlock } = useStore()
  const screen = screens.find(s => s.id === currentScreenId)
  const blocks = screen?.blocks ?? []
  const tokenVars = Object.fromEntries(tokens.colors.map(c => [`--tok-${c.id}`, c.value])) as React.CSSProperties

  const dragRef = useRef<{
    type: 'move' | 'resize'
    blockId: string; parentId?: string
    startMX: number; startMY: number
    startX: number; startY: number
    startW: number; startH: number
    handle?: string
    multi?: { id: string; x: number; y: number }[]
  } | null>(null)

  const panRef = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null)
  const selRectRef = useRef<{ sx: number; sy: number; x: number; y: number; w: number; h: number } | null>(null)
  const [selRect, setSelRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  // Zoom molette
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top
    const f = e.deltaY > 0 ? 0.91 : 1.1
    const nz = Math.min(3, Math.max(0.08, zoom * f))
    setPan(cx - (cx - panX) * (nz / zoom), cy - (cy - panY) * (nz / zoom))
    setZoom(nz)
  }, [zoom, panX, panY, setPan, setZoom])

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { deleteSelected, duplicateSelected, selectAll, selectedIds: sids, zoom: z, setZoom: sz, undo, redo, presenting } = useStore.getState()
      const k = e.key.toLowerCase()
      if (presenting) return
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if ((e.ctrlKey || e.metaKey) && k === 'z' && e.shiftKey) { e.preventDefault(); redo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sids.length) { e.preventDefault(); deleteSelected() }
      if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); duplicateSelected() }
      if ((e.ctrlKey || e.metaKey) && k === 'a') { e.preventDefault(); selectAll() }
      if (e.key === 'Escape') { useStore.getState().clearSelection(); useStore.getState().setEditing(null) }
      if (e.key === '+' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sz(Math.min(3, z * 1.2)) }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sz(Math.max(0.1, z * 0.8)) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Souris global
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (panRef.current) {
        setPan(e.clientX - panRef.current.sx + panRef.current.spx, e.clientY - panRef.current.sy + panRef.current.spy)
        return
      }
      if (dragRef.current) {
        const d = dragRef.current
        const dx = (e.clientX - d.startMX) / zoom
        const dy = (e.clientY - d.startMY) / zoom
        if (d.type === 'move') {
          if (d.multi) {
            d.multi.forEach(({ id, x, y }) => updateBlock(id, { x: x + dx, y: y + dy }))
          } else {
            updateBlock(d.blockId, { x: d.startX + dx, y: d.startY + dy }, d.parentId)
          }
        } else {
          const h = d.handle || 'se'
          const newW = h.includes('e') ? Math.max(40, d.startW + dx) : h.includes('w') ? Math.max(40, d.startW - dx) : d.startW
          const newH = h.includes('s') ? Math.max(20, d.startH + dy) : h.includes('n') ? Math.max(20, d.startH - dy) : d.startH
          const newX = h.includes('w') ? d.startX + dx : d.startX
          const newY = h.includes('n') ? d.startY + dy : d.startY
          updateBlock(d.blockId, { width: newW, height: newH, x: newX, y: newY }, d.parentId)
        }
        return
      }
      if (selRectRef.current) {
        const r = containerRef.current!.getBoundingClientRect()
        const cx = e.clientX - r.left, cy = e.clientY - r.top
        const dx = cx - selRectRef.current.sx, dy = cy - selRectRef.current.sy
        selRectRef.current = { ...selRectRef.current, x: dx < 0 ? cx : selRectRef.current.sx, y: dy < 0 ? cy : selRectRef.current.sy, w: Math.abs(dx), h: Math.abs(dy) }
        setSelRect({ ...selRectRef.current })
      }
    }

    const up = (e: MouseEvent) => {
      if (selRectRef.current && (selRectRef.current.w > 4 || selRectRef.current.h > 4)) {
        const { x, y, w, h } = selRectRef.current
        // Convertir en coordonnées monde
        const wx = (x - panX) / zoom, wy = (y - panY) / zoom
        const ww = w / zoom, wh = h / zoom
        const bs = useStore.getState().getBlocks()
        const sel = useStore.getState().select
        let first = true
        bs.forEach(b => {
          const overlap = b.x < wx + ww && b.x + b.width > wx && b.y < wy + wh && b.y + b.height > wy
          if (overlap) { sel(b.id, !first); first = false }
        })
        setSelRect(null); selRectRef.current = null
      }
      dragRef.current = null; panRef.current = null
      selRectRef.current = null; setSelRect(null)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [zoom, panX, panY, updateBlock, setPan, select])

  // Drop depuis la bibliothèque
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData('block-kind')
    const { LIBRARY } = require('@/lib/blocks-library')
    const item = LIBRARY.find((l: { kind: string }) => l.kind === kind)
    if (!item) return
    const rect = containerRef.current!.getBoundingClientRect()
    const wx = (e.clientX - rect.left - panX) / zoom
    const wy = (e.clientY - rect.top - panY) / zoom
    const block = item.factory(Math.round(wx - 100), Math.round(wy - 40))
    useStore.getState().addBlock(block)
  }

  // Upload image sur double-clic d'un bloc image vide
  const handleImageUpload = (blockId: string, parentId?: string) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      const reader = new FileReader()
      reader.onload = ev => updateBlock(blockId, { src: ev.target?.result as string }, parentId)
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const renderBlock = (block: Block, parentId?: string, offsetX = 0, offsetY = 0) => {
    if (!block.visible) return null
    const isSel = selectedIds.includes(block.id)
    const isEdit = block.id === editingId
    const isContainer = !!block.children?.length

    const baseStyle = styleToCSS(block.style)
    const containerStyle: React.CSSProperties = {
      ...baseStyle,
      position: 'absolute',
      left: block.x,
      top: block.y,
      width: block.width,
      height: block.height,
      outline: isSel ? '2px solid var(--accent)' : 'none',
      outlineOffset: isSel ? 1 : 0,
      boxShadow: isSel ? '0 0 0 4px rgba(124,106,247,0.15)' : undefined,
      overflow: isContainer ? 'visible' : 'hidden',
      cursor: block.locked ? 'default' : isEdit ? 'text' : 'move',
      userSelect: isEdit ? 'text' : 'none',
      zIndex: isSel ? 10 : 1,
    }

    return (
      <div
        key={block.id}
        style={containerStyle}
        onMouseDown={(e) => {
          if (isEdit) return
          e.stopPropagation()
          if (!block.locked) {
            select(block.id, e.shiftKey)
            useStore.getState().pushHistory('move')
            const sids = useStore.getState().selectedIds
            const bs = useStore.getState().getBlocks()
            const isMulti = sids.length > 1 && sids.includes(block.id)
            dragRef.current = {
              type: 'move',
              blockId: block.id, parentId,
              startMX: e.clientX, startMY: e.clientY,
              startX: block.x, startY: block.y,
              startW: block.width, startH: block.height,
              multi: isMulti ? bs.filter(b => sids.includes(b.id)).map(b => ({ id: b.id, x: b.x, y: b.y })) : undefined,
            }
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          if (block.kind === 'image' && !block.src) { handleImageUpload(block.id, parentId); return }
          if (!block.locked) setEditing(block.id)
        }}
      >
        {/* Contenu */}
        {isContainer ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', ...styleToCSS(block.style) }}>
            {block.children!.map(child => renderBlock(child, block.id, block.x, block.y))}
          </div>
        ) : (
          <BlockContent
            block={block}
            isEditing={isEdit}
            onTextChange={(text) => updateBlock(block.id, { text }, parentId)}
          />
        )}

        {/* Label discret */}
        {isSel && !isEdit && (
          <div style={{ position: 'absolute', top: -20, left: 0, background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: '4px 4px 0 0', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            {block.componentId ? `◇ ${components.find(c => c.id === block.componentId)?.name || 'instance'}` : block.kind}{block.locked ? ' 🔒' : ''}
          </div>
        )}

        {/* Handles resize */}
        {isSel && !isEdit && !block.locked && HANDLES.map(h => (
          <div key={h.id}
            style={{
              position: 'absolute',
              left: `calc(${h.cx * 100}% - 5px)`,
              top: `calc(${h.cy * 100}% - 5px)`,
              width: 10, height: 10,
              background: '#fff',
              border: '2px solid var(--accent)',
              borderRadius: 2,
              cursor: h.cursor,
              zIndex: 20,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              useStore.getState().pushHistory('resize')
              dragRef.current = {
                type: 'resize',
                blockId: block.id, parentId,
                startMX: e.clientX, startMY: e.clientY,
                startX: block.x, startY: block.y,
                startW: block.width, startH: block.height,
                handle: h.id,
              }
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}
      onMouseDown={(e) => {
        if (e.altKey || e.button === 1) {
          panRef.current = { sx: e.clientX, sy: e.clientY, spx: panX, spy: panY }
          e.preventDefault(); return
        }
        if (e.target === containerRef.current) {
          clearSelection()
          useStore.getState().setEditing(null)
          const rect = containerRef.current!.getBoundingClientRect()
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top
          selRectRef.current = { sx, sy, x: sx, y: sy, w: 0, h: 0 }
        }
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Grille points */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="dots" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse" x={panX % (24 * zoom)} y={panY % (24 * zoom)}>
            <circle cx={0} cy={0} r={0.7} fill="var(--border)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Empty state */}
      {!blocks.length && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
          <div style={{ fontSize: 52, opacity: 0.06 }}>✦</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Glisse un composant depuis la bibliothèque</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, opacity: 0.6 }}>ou importe une page via le menu</div>
        </div>
      )}

      {/* Monde canvas */}
      <div
        id="canvas-world"
        style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${panX}px,${panY}px) scale(${zoom})`, ...tokenVars }}
      >
        {/* Frame de l'écran courant (artboard) */}
        {screen && (
          <>
            <div style={{ position: 'absolute', left: 0, top: -28, fontSize: 13, fontWeight: 600, color: 'var(--dim)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              {screen.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {screen.width}×{screen.height}</span>
            </div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: screen.width, height: screen.height, background: screen.background, borderRadius: 3, boxShadow: '0 0 0 1px var(--border2), 0 24px 60px rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
          </>
        )}
        {blocks.map(b => renderBlock(b))}
      </div>

      {/* Rectangle de sélection */}
      {selRect && (
        <div style={{ position: 'absolute', left: selRect.x, top: selRect.y, width: selRect.w, height: selRect.h, background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.5)', pointerEvents: 'none', zIndex: 50 }} />
      )}

      {/* Zoom + raccourcis */}
      <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'var(--muted)' }}>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, color: 'var(--muted)', fontSize: 10, opacity: 0.4 }}>
        Alt+glisser = pan · Scroll = zoom · Del = supprimer · Ctrl+D = dupliquer
      </div>
    </div>
  )
}
