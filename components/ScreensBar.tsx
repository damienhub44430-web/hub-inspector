'use client'
import { useState, useRef } from 'react'
import { Plus, Copy, X, Monitor } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function ScreensBar() {
  const { screens, currentScreenId, setCurrentScreen, addScreen, deleteScreen, duplicateScreen, renameScreen, moveScreen } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const dragIdx = useRef<number | null>(null)

  const startRename = (id: string, name: string) => { setEditingId(id); setDraft(name) }
  const commitRename = () => {
    if (editingId && draft.trim()) renameScreen(editingId, draft.trim())
    setEditingId(null)
  }

  return (
    <div style={{ height: 38, background: 'var(--panel)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', flexShrink: 0, overflowX: 'auto', zIndex: 90 }}>
      <Monitor size={13} style={{ color: 'var(--muted)', flexShrink: 0, marginRight: 2 }} />

      {screens.map((s, i) => {
        const active = s.id === currentScreenId
        return (
          <div
            key={s.id}
            draggable={editingId !== s.id}
            onDragStart={() => { dragIdx.current = i }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => { if (dragIdx.current !== null && dragIdx.current !== i) moveScreen(screens[dragIdx.current].id, i); dragIdx.current = null }}
            onClick={() => setCurrentScreen(s.id)}
            onDoubleClick={() => startRename(s.id, s.name)}
            title={`${s.name} (${s.width}×${s.height})`}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '5px 9px', borderRadius: 7, cursor: 'pointer',
              fontSize: 12, fontWeight: active ? 600 : 500,
              background: active ? 'var(--card2)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--muted)',
              border: `1px solid ${active ? 'var(--border2)' : 'transparent'}`,
              maxWidth: 200,
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {editingId === s.id ? (
              <input
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null) }}
                onClick={e => e.stopPropagation()}
                style={{ width: 110, background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 4, color: 'var(--text)', fontSize: 12, padding: '1px 5px', outline: 'none', fontFamily: 'inherit' }}
              />
            ) : (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            )}

            {active && (
              <span style={{ display: 'flex', gap: 1, marginLeft: 2 }}>
                <button className="btn-icon" style={{ padding: 2 }} title="Dupliquer l'écran"
                  onClick={e => { e.stopPropagation(); duplicateScreen(s.id) }}>
                  <Copy size={11} />
                </button>
                {screens.length > 1 && (
                  <button className="btn-icon" style={{ padding: 2 }} title="Supprimer l'écran"
                    onClick={e => { e.stopPropagation(); if (confirm(`Supprimer « ${s.name} » ?`)) deleteScreen(s.id) }}>
                    <X size={11} />
                  </button>
                )}
              </span>
            )}
          </div>
        )
      })}

      <button className="btn-icon" title="Nouvel écran" onClick={addScreen} style={{ flexShrink: 0 }}>
        <Plus size={14} />
      </button>

      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0, paddingRight: 4 }}>
        {screens.length} écran{screens.length > 1 ? 's' : ''}
      </span>
    </div>
  )
}
