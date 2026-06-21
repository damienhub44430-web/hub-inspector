'use client'
import { useStore } from '@/lib/store'
import { Eye, EyeOff, Lock, Unlock, GripVertical, ChevronRight } from 'lucide-react'
import type { Section } from '@/lib/types'

const TYPE_ICONS: Record<string, string> = {
  navbar: '≡', hero: '◈', features: '⊞', cta: '▶', testimonials: '❝',
  pricing: '◎', faq: '?', footer: '▬', content: '¶', gallery: '⊡', form: '▥', unknown: '◻',
}

export default function LayersPanel() {
  const { inspection, selectedId, selectSection, updateSection } = useStore()
  const sections = inspection?.sections || []

  const toggle = (section: Section, field: 'visible' | 'locked', e: React.MouseEvent) => {
    e.stopPropagation()
    updateSection(section.id, { [field]: !section[field] })
  }

  return (
    <div style={{ width: 220, background: 'var(--panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 10, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Calques · {sections.length}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {!sections.length && (
          <div style={{ padding: '40px 20px', color: 'var(--muted)', fontSize: 12, textAlign: 'center', opacity: 0.6 }}>
            Les sections détectées apparaîtront ici
          </div>
        )}

        {sections.map((section) => {
          const isSelected = section.id === selectedId
          const color = section.color || '#6b7280'

          return (
            <div
              key={section.id}
              onClick={() => selectSection(isSelected ? null : section.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px 6px 8px',
                cursor: 'pointer', margin: '1px 4px', borderRadius: 6,
                background: isSelected ? `${color}18` : 'transparent',
                border: isSelected ? `1px solid ${color}40` : '1px solid transparent',
                transition: 'all 0.1s',
                opacity: section.visible === false ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--card)' }}
              onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {/* Icône type */}
              <div style={{ width: 22, height: 22, borderRadius: 5, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color }}>
                {TYPE_ICONS[section.type] || '◻'}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {section.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {section.width}×{section.height}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button onClick={(e) => toggle(section, 'visible', e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 3, borderRadius: 3, display: 'flex' }}
                  title={section.visible === false ? 'Afficher' : 'Masquer'}>
                  {section.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
                <button onClick={(e) => toggle(section, 'locked', e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 3, borderRadius: 3, display: 'flex' }}
                  title={section.locked ? 'Déverrouiller' : 'Verrouiller'}>
                  {section.locked ? <Lock size={12} /> : <Unlock size={12} />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
