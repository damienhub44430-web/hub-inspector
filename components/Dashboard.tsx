'use client'
import { useState } from 'react'
import { Sparkles, Plus, Copy, Trash2, Pencil, Layout } from 'lucide-react'
import { useStore } from '@/lib/store'
import { loadDoc } from '@/lib/storage'
import type { Block, Screen } from '@/lib/types'

function timeAgo(ts: number) {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), j = Math.floor(d / 86400000)
  if (j > 0) return `il y a ${j} j`
  if (h > 0) return `il y a ${h} h`
  if (m > 0) return `il y a ${m} min`
  return "à l'instant"
}

// Mini aperçu : rend les blocs top-level (et 1 niveau d'enfants) du 1er écran, scalés
function Preview({ screen }: { screen?: Screen }) {
  const W = 248, H = 150
  if (!screen) return <div style={{ width: '100%', height: H, background: 'var(--card2)' }} />
  const scale = Math.min(W / screen.width, H / screen.height)
  const renderBlock = (b: Block, ox = 0, oy = 0, key?: string) => {
    if (b.visible === false) return null
    const bg = b.style.backgroundColor
    const isText = ['heading', 'text', 'button'].includes(b.kind)
    return (
      <div key={key} style={{
        position: 'absolute',
        left: (ox + b.x) * scale, top: (oy + b.y) * scale,
        width: b.width * scale, height: b.height * scale,
        background: bg || (isText ? 'transparent' : 'rgba(255,255,255,0.04)'),
        borderRadius: Math.min(4, (b.style.borderRadius || 0) * scale),
        outline: b.kind === 'button' ? '1px solid var(--accent)' : 'none',
      }}>
        {isText && (
          <div style={{ width: '70%', height: Math.max(2, Math.min(6, b.height * scale * 0.4)), background: b.kind === 'heading' ? 'rgba(226,226,240,0.55)' : 'rgba(148,148,176,0.4)', borderRadius: 2, margin: '20% 0 0 10%' }} />
        )}
        {b.children?.map((c, i) => renderBlock(c, ox + b.x, oy + b.y, `${key}-${i}`))}
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: H, background: screen.background || 'var(--card2)', overflow: 'hidden' }}>
      {screen.blocks.map((b, i) => renderBlock(b, 0, 0, `b${i}`))}
    </div>
  )
}

export default function Dashboard() {
  const { projects, projectId, createProject, openProject, deleteProject, duplicateProject, renameProject, openEditor } = useStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const commit = () => { if (editing && draft.trim()) renameProject(editing, draft.trim()); setEditing(null) }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--panel)', borderBottom: '1px solid var(--border)', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#7c6af7,#a855f7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Mes projets</div>
        <div style={{ flex: 1 }} />
        {projectId && <button className="btn btn-ghost" onClick={openEditor}><Layout size={13} /> Retour à l'éditeur</button>}
        <button className="btn btn-primary" onClick={() => createProject()}><Plus size={14} /> Nouveau projet</button>
      </div>

      {/* Grille */}
      <div style={{ padding: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {projects.length === 0 && (
          <div style={{ color: 'var(--muted)', fontSize: 13, gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
            Aucun projet. Crée ton premier projet.
          </div>
        )}
        {projects.map(p => {
          const doc = loadDoc(p.id)
          const screen = doc?.screens?.[0]
          const active = p.id === projectId
          return (
            <div key={p.id}
              style={{ background: 'var(--card)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.1s' }}
              onClick={() => openProject(p.id)}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
            >
              <Preview screen={screen} />
              <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)' }}>
                {editing === p.id ? (
                  <input autoFocus className="input input-sm" value={draft}
                    onClick={e => e.stopPropagation()}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null) }} />
                ) : (
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {(doc?.screens?.length || 0)} écran{(doc?.screens?.length || 0) > 1 ? 's' : ''} · {timeAgo(p.updatedAt)}
                  </span>
                  <div style={{ flex: 1 }} />
                  <button className="btn-icon" title="Renommer" onClick={e => { e.stopPropagation(); setEditing(p.id); setDraft(p.name) }}><Pencil size={12} /></button>
                  <button className="btn-icon" title="Dupliquer" onClick={e => { e.stopPropagation(); duplicateProject(p.id) }}><Copy size={12} /></button>
                  <button className="btn-icon" title="Supprimer" style={{ color: 'var(--error)' }}
                    onClick={e => { e.stopPropagation(); if (confirm(`Supprimer le projet « ${p.name} » ? Cette action est irréversible.`)) deleteProject(p.id) }}><Trash2 size={12} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
