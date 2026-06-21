'use client'
import { useState } from 'react'
import { Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown, Layers, BookOpen, Trash2, Copy } from 'lucide-react'
import { useStore } from '@/lib/store'
import { LIBRARY } from '@/lib/blocks-library'
import type { Block } from '@/lib/types'

const KIND_COLORS: Record<string, string> = {
  heading: '#7c6af7', text: '#60a5fa', button: '#f59e0b', image: '#f472b6',
  divider: '#6b7280', spacer: '#4b5563', section: '#94a3b8', card: '#34d399',
  navbar: '#22d3a0', hero: '#7c6af7', features: '#60a5fa', cta: '#f59e0b',
  testimonial: '#f472b6', pricing: '#34d399', footer: '#6b7280', form: '#e879f9',
}

const KIND_ICONS: Record<string, string> = {
  heading:'H', text:'¶', button:'▶', image:'⊡', divider:'—', spacer:'⊠',
  navbar:'≡', hero:'◈', features:'⊞', cta:'▶', testimonial:'❝',
  pricing:'◎', footer:'▬', form:'▥', section:'◻', card:'▣', columns:'⊟',
}

function LayerRow({ block, depth = 0, parentId }: { block: Block; depth?: number; parentId?: string }) {
  const { selectedIds, select, updateBlock } = useStore()
  const [open, setOpen] = useState(true)
  const isSel = selectedIds.includes(block.id)
  const hasChildren = (block.children?.length || 0) > 0
  const color = KIND_COLORS[block.kind] || '#6b7280'

  return (
    <div>
      <div
        onClick={() => select(block.id, false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `5px 8px 5px ${8 + depth * 12}px`,
          cursor: 'pointer', borderRadius: 5, margin: '1px 4px',
          background: isSel ? `${color}18` : 'transparent',
          border: `1px solid ${isSel ? color + '44' : 'transparent'}`,
        }}
        onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--card)' }}
        onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        {hasChildren ? (
          <button onClick={e => { e.stopPropagation(); setOpen(!open) }} className="btn-icon" style={{ padding: 0, width: 14, flexShrink: 0 }}>
            {open ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
          </button>
        ) : <span style={{ width: 14, flexShrink: 0 }} />}

        <div style={{ width: 18, height: 18, borderRadius: 4, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color, flexShrink: 0, fontWeight: 700 }}>
          {KIND_ICONS[block.kind] || '·'}
        </div>

        <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: block.visible !== false ? 'var(--text)' : 'var(--muted)' }}>
          {(block.text?.slice(0, 22)) || block.kind}
        </span>

        <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <button className="btn-icon" style={{ padding: 2 }} onClick={e => { e.stopPropagation(); updateBlock(block.id, { visible: block.visible === false }, parentId) }}>
            {block.visible === false ? <EyeOff size={10}/> : <Eye size={10}/>}
          </button>
          <button className="btn-icon" style={{ padding: 2 }} onClick={e => { e.stopPropagation(); updateBlock(block.id, { locked: !block.locked }, parentId) }}>
            {block.locked ? <Lock size={10}/> : <Unlock size={10}/>}
          </button>
        </div>
      </div>

      {hasChildren && open && block.children!.map(child => (
        <LayerRow key={child.id} block={child} depth={depth + 1} parentId={block.id} />
      ))}
    </div>
  )
}

function LibraryItem({ item }: { item: typeof LIBRARY[0] }) {
  const { addBlock } = useStore()
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('block-kind', item.kind); e.dataTransfer.effectAllowed = 'copy' }}
      onClick={() => addBlock(item.factory(120, 120))}
      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', cursor: 'grab', borderRadius: 6, border: '1px solid var(--border)', margin: '3px 8px', background: 'var(--card)', userSelect: 'none' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--card2)'; el.style.borderColor = item.color + '66' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--card)'; el.style.borderColor = 'var(--border)' }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: item.color, flexShrink: 0, fontWeight: 700 }}>
        {item.icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{item.category}</div>
      </div>
      <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted)', opacity: 0.3 }}>⠿</span>
    </div>
  )
}

export default function LibraryPanel() {
  const { blocks, selectedIds, leftTab, setLeftTab, deleteSelected, duplicateSelected } = useStore()
  const [filter, setFilter] = useState<'tous'|'primitif'|'composant'>('tous')
  const filtered = filter === 'tous' ? LIBRARY : LIBRARY.filter(i => i.category === filter)

  return (
    <div className="panel" style={{ width: 220 }}>
      <div className="panel-header" style={{ gap: 4, flexWrap: 'wrap' }}>
        {(['layers', 'library'] as const).map(tab => (
          <button key={tab} className={`tab ${leftTab === tab ? 'active' : ''}`} onClick={() => setLeftTab(tab)}>
            {tab === 'layers' ? <><Layers size={10}/> Calques</> : <><BookOpen size={10}/> Blocs</>}
          </button>
        ))}
        {leftTab === 'layers' && selectedIds.length > 0 && (
          <>
            <div style={{ flex: 1 }}/>
            <button className="btn-icon" title="Dupliquer" onClick={duplicateSelected}><Copy size={11}/></button>
            <button className="btn-icon" title="Supprimer" onClick={deleteSelected} style={{ color: 'var(--error)' }}><Trash2 size={11}/></button>
          </>
        )}
      </div>

      {leftTab === 'layers' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {!blocks.length ? (
            <div style={{ padding: '40px 16px', color: 'var(--muted)', fontSize: 12, textAlign: 'center', opacity: 0.5 }}>
              Ajoute des blocs depuis la bibliothèque →
            </div>
          ) : [...blocks].reverse().map(block => <LayerRow key={block.id} block={block} />)}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '8px', display: 'flex', gap: 3 }}>
            {(['tous', 'primitif', 'composant'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '4px 0', borderRadius: 5, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: '1px solid', fontFamily: 'inherit', background: filter === f ? 'var(--accent)' : 'transparent', color: filter === f ? '#fff' : 'var(--muted)', borderColor: filter === f ? 'transparent' : 'var(--border)' }}>
                {f === 'tous' ? 'Tous' : f === 'primitif' ? 'Prims' : 'Comp'}
              </button>
            ))}
          </div>
          <div style={{ padding: '4px 0' }}>{filtered.map(item => <LibraryItem key={item.kind} item={item} />)}</div>
          <div style={{ padding: '8px 12px 12px', color: 'var(--muted)', fontSize: 10, textAlign: 'center', opacity: 0.4 }}>Glisser ou cliquer pour ajouter</div>
        </div>
      )}
    </div>
  )
}
