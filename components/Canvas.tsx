'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { useStore } from '@/lib/store'
import type { Section } from '@/lib/types'
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'

const SECTION_TYPE_COLOR: Record<string, string> = {
  navbar: '#22d3a0', hero: '#7c6af7', features: '#60a5fa', cta: '#f59e0b',
  testimonials: '#f472b6', pricing: '#34d399', faq: '#a78bfa', footer: '#6b7280',
  content: '#94a3b8', gallery: '#fb923c', form: '#e879f9', unknown: '#4b5563',
}

interface DragState {
  sectionId: string
  startMouseX: number; startMouseY: number
  startSectionX: number; startSectionY: number
}

interface ResizeState {
  sectionId: string
  edge: 'bottom' | 'right' | 'corner'
  startMouseX: number; startMouseY: number
  startW: number; startH: number
}

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { inspection, selectedId, hoveredId, zoom, panX, panY,
    updateSection, selectSection, hoverSection, setZoom, setPan } = useStore()

  const dragRef = useRef<DragState | null>(null)
  const resizeRef = useRef<ResizeState | null>(null)
  const panRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null)
  const [, forceUpdate] = useState(0)

  // Zoom molette
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const newZoom = Math.min(2, Math.max(0.15, zoom * factor))
    setPan(
      cx - (cx - panX) * (newZoom / zoom),
      cy - (cy - panY) * (newZoom / zoom)
    )
    setZoom(newZoom)
  }, [zoom, panX, panY, setPan, setZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // Mouse events
  const onMouseDown = (e: React.MouseEvent, section: Section, type: 'move' | 'resize', edge?: string) => {
    e.stopPropagation()
    if (section.locked) return
    selectSection(section.id)

    if (type === 'move') {
      dragRef.current = {
        sectionId: section.id,
        startMouseX: e.clientX, startMouseY: e.clientY,
        startSectionX: section.x, startSectionY: section.y,
      }
    } else {
      resizeRef.current = {
        sectionId: section.id,
        edge: (edge || 'corner') as 'bottom' | 'right' | 'corner',
        startMouseX: e.clientX, startMouseY: e.clientY,
        startW: section.width, startH: section.height,
      }
    }
  }

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY }
      e.preventDefault()
    } else {
      selectSection(null)
    }
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (panRef.current) {
      const dx = e.clientX - panRef.current.startX
      const dy = e.clientY - panRef.current.startY
      setPan(panRef.current.startPanX + dx, panRef.current.startPanY + dy)
      forceUpdate(n => n + 1)
      return
    }

    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.startMouseX) / zoom
      const dy = (e.clientY - dragRef.current.startMouseY) / zoom
      updateSection(dragRef.current.sectionId, {
        x: Math.round(dragRef.current.startSectionX + dx),
        y: Math.round(dragRef.current.startSectionY + dy),
      })
      return
    }

    if (resizeRef.current) {
      const dx = (e.clientX - resizeRef.current.startMouseX) / zoom
      const dy = (e.clientY - resizeRef.current.startMouseY) / zoom
      const updates: Partial<Section> = {}
      if (resizeRef.current.edge !== 'bottom') updates.width = Math.max(200, Math.round(resizeRef.current.startW + dx))
      if (resizeRef.current.edge !== 'right') updates.height = Math.max(40, Math.round(resizeRef.current.startH + dy))
      updateSection(resizeRef.current.sectionId, updates)
    }
  }, [zoom, updateSection, setPan])

  const onMouseUp = useCallback(() => {
    dragRef.current = null
    resizeRef.current = null
    panRef.current = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [onMouseMove, onMouseUp])

  const isDragging = !!(dragRef.current || resizeRef.current || panRef.current)
  const sections = inspection?.sections?.filter(s => s.visible !== false) || []

  return (
    <div
      ref={containerRef}
      onMouseDown={onCanvasMouseDown}
      style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        background: 'var(--bg)',
        cursor: panRef.current ? 'grabbing' : isDragging ? 'move' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Grille de fond */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="grid" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse"
            x={panX % (24 * zoom)} y={panY % (24 * zoom)}>
            <circle cx={0} cy={0} r={0.7} fill="var(--border)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Empty state */}
      {!inspection && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
          <div style={{ fontSize: 48, opacity: 0.08 }}>⊞</div>
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>Entre une URL pour commencer</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, opacity: 0.6 }}>Claude va détecter et découper chaque section</div>
        </div>
      )}

      {/* Loading */}
      {(inspection?.status === 'capturing' || inspection?.status === 'analyzing') && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%' }} className="spin" />
          <div style={{ color: 'var(--dim)', fontSize: 13 }}>
            {inspection.status === 'capturing' ? 'Capture du screenshot en cours…' : 'Claude analyse les sections…'}
          </div>
        </div>
      )}

      {/* Sections */}
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}>
        {sections.map((section) => {
          const isSelected = section.id === selectedId
          const isHovered = section.id === hoveredId
          const color = SECTION_TYPE_COLOR[section.type] || '#6b7280'

          return (
            <div
              key={section.id}
              onMouseEnter={() => hoverSection(section.id)}
              onMouseLeave={() => hoverSection(null)}
              onMouseDown={(e) => onMouseDown(e, section, 'move')}
              style={{
                position: 'absolute',
                left: section.x, top: section.y,
                width: section.width, height: section.height,
                cursor: section.locked ? 'default' : 'move',
                outline: isSelected ? `2px solid ${color}` : isHovered ? `1px solid ${color}66` : '1px solid transparent',
                outlineOffset: isSelected ? 2 : 0,
                borderRadius: 4,
                overflow: 'hidden',
                boxShadow: isSelected ? `0 0 0 4px ${color}20, 0 8px 32px rgba(0,0,0,0.4)` : isHovered ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'box-shadow 0.1s, outline 0.1s',
              }}
            >
              {/* Image clippée via object-position */}
              <img
                src={inspection!.fullScreenshot}
                alt={section.label}
                draggable={false}
                style={{
                  position: 'absolute',
                  top: -(section.srcY * (section.width / section.srcWidth)),
                  left: 0,
                  width: section.width,
                  height: 'auto',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />

              {/* Overlay sélection */}
              {(isSelected || isHovered) && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isSelected ? `${color}08` : 'transparent',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Label de section */}
              {(isSelected || isHovered) && (
                <div style={{
                  position: 'absolute', top: 8, left: 8,
                  background: color, color: '#000',
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  pointerEvents: 'none', opacity: 0.95,
                }}>
                  {section.label}
                </div>
              )}

              {/* Handles de resize */}
              {isSelected && !section.locked && (
                <>
                  {/* Bas */}
                  <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, section, 'resize', 'bottom') }}
                    style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 60, height: 6, cursor: 'ns-resize', background: color, borderRadius: '3px 3px 0 0', opacity: 0.8 }} />
                  {/* Droite */}
                  <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, section, 'resize', 'right') }}
                    style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: 6, height: 60, cursor: 'ew-resize', background: color, borderRadius: '3px 0 0 3px', opacity: 0.8 }} />
                  {/* Coin bas-droit */}
                  <div onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, section, 'resize', 'corner') }}
                    style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, cursor: 'nwse-resize', background: color, borderRadius: '3px 0 0 0' }} />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Zoom indicator */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>{Math.round(zoom * 100)}%</span>
        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }} onClick={() => setZoom(Math.max(0.15, zoom * 0.85))}>−</button>
        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '0 2px' }} onClick={() => setZoom(Math.min(2, zoom * 1.15))}>+</button>
        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: '0 2px' }} onClick={() => { setZoom(0.6); setPan(40, 40) }}>Reset</button>
      </div>

      {/* Raccourcis */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'var(--muted)', fontSize: 10, opacity: 0.5 }}>
        Scroll = zoom · Alt+drag = pan · Clic = sélectionner
      </div>
    </div>
  )
}
