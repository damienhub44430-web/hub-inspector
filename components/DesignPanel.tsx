'use client'
import { useRef } from 'react'
import { Plus, Trash2, Type, Component, Download, Ruler, Square } from 'lucide-react'
import { useStore } from '@/lib/store'

function ColorTokenRow({ id, name, value }: { id: string; name: string; value: string }) {
  const { updateColorToken, deleteColorToken } = useStore()
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="color-swatch" style={{ background: value }} onClick={() => ref.current?.click()} />
      <input ref={ref} type="color" value={/^#/.test(value) ? value : '#000000'} onChange={e => updateColorToken(id, { value: e.target.value })} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }} />
      <input className="input input-sm" style={{ flex: 1 }} value={name} onChange={e => updateColorToken(id, { name: e.target.value })} />
      <button className="btn-icon" style={{ color: 'var(--error)' }} title="Supprimer" onClick={() => deleteColorToken(id)}><Trash2 size={11} /></button>
    </div>
  )
}

export default function DesignPanel() {
  const { tokens, addColorToken, selectedIds, getBlocks,
    addTextStyle, applyTextStyle, deleteTextStyle,
    addSpacingToken, updateSpacingToken, deleteSpacingToken,
    addShadowToken, updateShadowToken, deleteShadowToken,
    components, saveSelectionAsComponent, insertComponent, deleteComponent, renameComponent } = useStore()

  const hasSel = selectedIds.length > 0
  const selBlock = selectedIds.length === 1 ? getBlocks().find(b => b.id === selectedIds[0]) : undefined

  const createTextStyleFromSelection = () => {
    if (!selBlock) { addTextStyle({ name: 'Nouveau style', fontSize: 16, fontWeight: '400', lineHeight: 1.5, color: '#e2e2f0' }); return }
    const s = selBlock.style
    addTextStyle({ name: selBlock.text?.slice(0, 16) || 'Style', fontSize: s.fontSize || 16, fontWeight: s.fontWeight || '400', lineHeight: s.lineHeight, color: s.color, fontFamily: s.fontFamily })
  }

  const saveComponent = () => {
    const name = prompt('Nom du composant ?', 'Mon composant')
    if (name) saveSelectionAsComponent(name)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Couleurs */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="panel-label">Couleurs</span>
          <div style={{ flex: 1 }} />
          <button className="btn-icon" title="Ajouter une couleur" onClick={() => addColorToken('Couleur', '#7c6af7')}><Plus size={13} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tokens.colors.map(c => <ColorTokenRow key={c.id} id={c.id} name={c.name} value={c.value} />)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
          Applique une couleur depuis le panneau de droite (pastilles « Tokens »). Modifier un token met à jour tous les blocs liés.
        </div>
      </div>

      {/* Styles de texte */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="panel-label">Styles de texte</span>
          <div style={{ flex: 1 }} />
          <button className="btn-icon" title={selBlock ? 'Créer depuis la sélection' : 'Ajouter un style'} onClick={createTextStyleFromSelection}><Plus size={13} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tokens.textStyles.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Type size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                <div style={{ fontSize: 9, color: 'var(--muted)' }}>{t.fontSize}px · {t.fontWeight}</div>
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 7px' }} disabled={!selBlock} title={selBlock ? 'Appliquer à la sélection' : 'Sélectionne un bloc'}
                onClick={() => selBlock && applyTextStyle(selBlock.id, t.id)}>Appliquer</button>
              <button className="btn-icon" style={{ color: 'var(--error)', padding: 3 }} onClick={() => deleteTextStyle(t.id)}><Trash2 size={10} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Espacements */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="panel-label"><Ruler size={10} style={{ verticalAlign: '-1px', marginRight: 4 }} />Espacements</span>
          <div style={{ flex: 1 }} />
          <button className="btn-icon" title="Ajouter un espacement" onClick={() => addSpacingToken('Espace', 16)}><Plus size={13} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tokens.spacing.map(sp => (
            <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input className="input input-sm" style={{ flex: 1 }} value={sp.name} onChange={e => updateSpacingToken(sp.id, { name: e.target.value })} />
              <input className="input input-sm" type="number" style={{ width: 58 }} value={sp.value} onChange={e => updateSpacingToken(sp.id, { value: Number(e.target.value) })} />
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>px</span>
              <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => deleteSpacingToken(sp.id)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
          Applique une valeur d'un clic dans la section « Espacement » du panneau de droite.
        </div>
      </div>

      {/* Ombres */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="panel-label"><Square size={10} style={{ verticalAlign: '-1px', marginRight: 4 }} />Ombres</span>
          <div style={{ flex: 1 }} />
          <button className="btn-icon" title="Ajouter une ombre" onClick={() => addShadowToken('Ombre', '0 4px 12px rgba(0,0,0,0.3)')}><Plus size={13} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tokens.shadows.map(sh => (
            <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--card2)', boxShadow: sh.value, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <input className="input input-sm" value={sh.name} onChange={e => updateShadowToken(sh.id, { name: e.target.value })} />
                <input className="input input-sm" style={{ fontSize: 10, fontFamily: 'monospace' }} value={sh.value} onChange={e => updateShadowToken(sh.id, { value: e.target.value })} />
              </div>
              <button className="btn-icon" style={{ color: 'var(--error)' }} onClick={() => deleteShadowToken(sh.id)}><Trash2 size={11} /></button>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, opacity: 0.7 }}>
          Applique une ombre depuis la section « Ombre » du panneau de droite ; la modifier met à jour tous les blocs liés.
        </div>
      </div>

      {/* Composants */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <span className="panel-label">Composants</span>
          <div style={{ flex: 1 }} />
        </div>
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginBottom: 8 }} disabled={!hasSel} onClick={saveComponent}>
          <Download size={12} /> Enregistrer la sélection
        </button>
        {components.length === 0 ? (
          <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', padding: '8px 0', opacity: 0.7 }}>
            Sélectionne un ou plusieurs blocs puis « Enregistrer » pour créer un composant réutilisable.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {components.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 7px', borderRadius: 6, background: 'var(--card)', border: '1px solid var(--border)' }}>
                <Component size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <input className="input input-sm" style={{ flex: 1, background: 'transparent', border: '1px solid transparent', padding: '2px 4px' }}
                  value={c.name} onChange={e => renameComponent(c.id, e.target.value)} />
                <button className="btn btn-ghost" style={{ fontSize: 10, padding: '2px 7px' }} title="Insérer" onClick={() => insertComponent(c.id)}>Insérer</button>
                <button className="btn-icon" style={{ color: 'var(--error)', padding: 3 }} onClick={() => deleteComponent(c.id)}><Trash2 size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
