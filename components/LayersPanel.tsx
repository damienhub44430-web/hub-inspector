'use client'
import { useStore } from '@/lib/store'
import { Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown, Layers } from 'lucide-react'
import type { Section, Block } from '@/lib/types'
import { useState } from 'react'

const TYPE_ICON: Record<string, string> = {
  heading:'H', text:'¶', cta:'▶', image:'⊡', form:'▥',
  navbar:'≡', footer:'▬', section:'◻', unknown:'·',
}
const SEC_ICON: Record<string, string> = {
  navbar:'≡', hero:'◈', features:'⊞', cta:'▶', testimonials:'❝',
  pricing:'◎', faq:'?', footer:'▬', content:'¶', section:'◻', unknown:'·',
}

function BlockRow({ sec, blk }: { sec: Section; blk: Block }) {
  const { selectedBlockId, selectBlock, updateBlock } = useStore()
  const isSel = blk.id === selectedBlockId
  const color = ({ heading:'#7c6af7', text:'#60a5fa', cta:'#f59e0b', image:'#f472b6', form:'#34d399' } as Record<string,string>)[blk.type] || '#6b7280'
  const label = blk.editedText || blk.text || blk.type

  return (
    <div onClick={() => selectBlock(sec.id, blk.id)}
      style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px 4px 28px', cursor:'pointer', borderRadius:5, margin:'0 4px', background: isSel ? `${color}18` : 'transparent', border: `1px solid ${isSel ? color+'44' : 'transparent'}` }}
      onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='var(--card)' }}
      onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='transparent' }}
    >
      <div style={{ width:18, height:18, borderRadius:4, background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color, flexShrink:0, fontWeight:700 }}>
        {TYPE_ICON[blk.type]||'·'}
      </div>
      <span style={{ fontSize:11, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', opacity: blk.visible ? 1 : 0.4 }}>
        {label.slice(0,30) || blk.tag}
      </span>
      {blk.editedText && <span style={{ fontSize:9, color:'var(--accent)' }}>✏</span>}
      <button onClick={e => { e.stopPropagation(); updateBlock(sec.id, blk.id, { visible: !blk.visible }) }}
        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:2, display:'flex', opacity:0.6 }}>
        {blk.visible ? <Eye size={10}/> : <EyeOff size={10}/>}
      </button>
    </div>
  )
}

function SectionRow({ sec }: { sec: Section }) {
  const { selectedSectionId, selectedBlockId, selectSection, updateSection } = useStore()
  const [open, setOpen] = useState(true)
  const isSel = sec.id === selectedSectionId && !selectedBlockId
  const hasBlocks = sec.blocks?.length > 0

  return (
    <div>
      <div onClick={() => selectSection(sec.id)}
        style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 10px 6px 8px', cursor:'pointer', borderRadius:6, margin:'1px 4px', background: isSel ? `${sec.color}18` : 'transparent', border:`1px solid ${isSel ? sec.color+'44' : 'transparent'}` }}
        onMouseEnter={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='var(--card)' }}
        onMouseLeave={e => { if(!isSel)(e.currentTarget as HTMLElement).style.background='transparent' }}
      >
        {hasBlocks ? (
          <button onClick={e => { e.stopPropagation(); setOpen(!open) }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:0, display:'flex' }}>
            {open ? <ChevronDown size={11}/> : <ChevronRight size={11}/>}
          </button>
        ) : <span style={{ width:11 }}/>}

        <div style={{ width:22, height:22, borderRadius:5, background:`${sec.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:sec.color, flexShrink:0 }}>
          {SEC_ICON[sec.type]||'◻'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>{sec.label}</div>
          <div style={{ fontSize:10, color:'var(--muted)' }}>{sec.blocks?.length||0} blocs</div>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          <button onClick={e => { e.stopPropagation(); updateSection(sec.id, { visible: !sec.visible }) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:3, display:'flex' }}>
            {sec.visible !== false ? <Eye size={12}/> : <EyeOff size={12}/>}
          </button>
          <button onClick={e => { e.stopPropagation(); updateSection(sec.id, { locked: !sec.locked }) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', padding:3, display:'flex' }}>
            {sec.locked ? <Lock size={12}/> : <Unlock size={12}/>}
          </button>
        </div>
      </div>
      {open && hasBlocks && sec.blocks.map(blk => <BlockRow key={blk.id} sec={sec} blk={blk}/>)}
    </div>
  )
}

export default function LayersPanel() {
  const { inspection, showBlocks, toggleBlocks } = useStore()
  const sections = inspection?.sections || []
  const totalBlocks = sections.reduce((n, s) => n + (s.blocks?.length||0), 0)

  return (
    <div style={{ width:230, background:'var(--panel)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Layers size={12} style={{ color:'var(--muted)' }}/>
          <span style={{ fontSize:10, fontWeight:600, color:'var(--muted)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            Calques
          </span>
          {totalBlocks > 0 && <span style={{ fontSize:10, color:'var(--muted)', opacity:0.6 }}>· {totalBlocks} blocs</span>}
        </div>
        <button onClick={toggleBlocks} title={showBlocks ? 'Masquer les blocs' : 'Afficher les blocs'}
          style={{ background: showBlocks ? 'var(--accent)' : 'var(--card)', border:`1px solid ${showBlocks ? 'transparent' : 'var(--border)'}`, color: showBlocks ? '#fff' : 'var(--muted)', borderRadius:5, padding:'2px 8px', cursor:'pointer', fontSize:10, fontFamily:'inherit' }}>
          Blocs
        </button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'4px 0' }}>
        {!sections.length ? (
          <div style={{ padding:'40px 20px', color:'var(--muted)', fontSize:12, textAlign:'center', opacity:0.5 }}>
            Les sections et blocs apparaîtront ici
          </div>
        ) : sections.map(sec => <SectionRow key={sec.id} sec={sec}/>)}
      </div>
    </div>
  )
}
