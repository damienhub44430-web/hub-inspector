'use client'
import { useRef, useState } from 'react'
import { Sparkles, ChevronDown, Download, Loader, FileText, Globe, Code, ImageIcon, Terminal, Plus, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical, LayoutGrid, Play, Share2, Check } from 'lucide-react'
import { useStore } from '@/lib/store'
import { parseHTMLToBlocks, makeFullPageDemo, importedToScreen } from '@/lib/blocks-library'

export default function TopBar() {
  const { projectName, setProjectName, screens, currentScreenId, tokens, components, selectedIds, zoom, setZoom, setPan,
    zoomToFit, newProject, deleteSelected, duplicateSelected, alignBlocks,
    addBlocks, addScreenWithBlocks, loadProject, undo, redo, past, future,
    goToDashboard, setPresenting,
    setStatus, status, error, importMode, setImportMode } = useStore()
  const currentScreen = screens.find(s => s.id === currentScreenId)
  const blocks = currentScreen?.blocks ?? []

  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [urlVal, setUrlVal] = useState('')
  const [htmlVal, setHtmlVal] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const loading = status === 'loading'

  // ─── Import URL ──────────────────────────────────────────────────────────
  const importURL = async () => {
    if (!urlVal) return
    let url = urlVal.trim()
    if (!url.startsWith('http')) url = `https://${url}`
    setImportMode(null); setStatus('loading')
    try {
      const res = await fetch('/api/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Convertir les sections extraites en blocs éditables (types, styles réels, images)
      const { blocks: imported, width, height } = importedToScreen(data.sections || [])
      let host = url
      try { host = new URL(url).hostname.replace(/^www\./, '') } catch {}
      if (imported.length) addScreenWithBlocks(host, imported, { width, height })
      else addScreenWithBlocks(host, [{ id: 'imp-img', kind: 'image', x: 60, y: 60, width: 900, height: 500, src: data.fullScreenshot || '', alt: url, style: { borderRadius: 8 }, visible: true, locked: false }], { width: 1020, height: 620 })
      setStatus('idle')
    } catch (e: unknown) { setStatus('error', e instanceof Error ? e.message : 'Erreur') }
  }

  // ─── Import HTML texte ───────────────────────────────────────────────────
  const importHTML = () => {
    if (!htmlVal) return
    const blocks = parseHTMLToBlocks(htmlVal)
    if (blocks.length) addBlocks(blocks)
    setImportMode(null)
  }

  // ─── Import fichier HTML ─────────────────────────────────────────────────
  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const html = ev.target?.result as string
      const blocks = parseHTMLToBlocks(html)
      if (blocks.length) addBlocks(blocks)
    }
    reader.readAsText(file)
    setImportMode(null)
  }

  // ─── Import image ────────────────────────────────────────────────────────
  const importImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      addBlocks([{ id: `img-${Date.now()}`, kind: 'image', x: 60, y: 60, width: 800, height: 500, src, alt: file.name, style: { borderRadius: 8 }, visible: true, locked: false }])
    }
    reader.readAsDataURL(file)
    setImportMode(null)
  }

  // ─── Export JSON ─────────────────────────────────────────────────────────
  const exportJSON = () => {
    const data = JSON.stringify({ projectName, screens, tokens, components, version: 2, exportedAt: new Date().toISOString() }, null, 2)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    setExportOpen(false)
  }

  // ─── Export PNG ──────────────────────────────────────────────────────────
  const exportPNG = async () => {
    setExportOpen(false)
    const canvas = document.getElementById('canvas-world')
    if (!canvas) return
    const { toPng } = await import('html-to-image')
    const url = await toPng(canvas as HTMLElement)
    const a = document.createElement('a')
    a.href = url; a.download = `${projectName.replace(/\s+/g, '-')}.png`; a.click()
  }

  // ─── Export HTML ─────────────────────────────────────────────────────────
  const exportHTML = async () => {
    setExportOpen(false)
    const res = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, projectName, tokens, background: currentScreen?.background }) })
    const { html } = await res.json()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = `${projectName.replace(/\s+/g, '-')}.html`; a.click()
  }

  // ─── Partage (lien prototype lecture seule) ──────────────────────────────
  const share = async () => {
    setSharing(true)
    try {
      const res = await fetch('/api/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectName, screens, tokens }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const url = `${window.location.origin}/p/${data.sessionId}`
      setShareUrl(url)
      try { await navigator.clipboard.writeText(url) } catch {}
    } catch (e: unknown) { setStatus('error', e instanceof Error ? e.message : 'Partage impossible') }
    finally { setSharing(false) }
  }

  // ─── Import JSON ─────────────────────────────────────────────────────────
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (Array.isArray(data.screens)) loadProject(data.projectName, data.screens)
        else if (Array.isArray(data.blocks)) addBlocks(data.blocks) // rétro-compat ancien format
        else setStatus('error', 'Fichier JSON non reconnu')
      } catch { setStatus('error', 'Fichier JSON invalide') }
    }
    reader.readAsText(file); setImportMode(null)
  }

  const hasSel = selectedIds.length > 0
  const hasMulti = selectedIds.length > 1

  return (
    <div style={{ height: 48, background: 'var(--panel)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', flexShrink: 0, zIndex: 100, position: 'relative' }}>

      {/* Logo + projets */}
      <button className="btn-icon" title="Mes projets" onClick={goToDashboard} style={{ marginRight: 2, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #7c6af7, #a855f7)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={13} color="#fff" />
        </div>
      </button>
      <button className="btn btn-ghost" onClick={goToDashboard} title="Mes projets" style={{ flexShrink: 0 }}>
        <LayoutGrid size={13} /> Projets
      </button>

      {/* Nom du projet */}
      <input ref={nameRef} className="input" style={{ width: 140, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid transparent', cursor: 'text' }}
        value={projectName} onChange={e => setProjectName(e.target.value)}
        onFocus={e => (e.target as HTMLInputElement).select()}
      />

      <div className="divider" />

      {/* ── Undo / Redo ── */}
      <button className="btn-icon" title="Annuler (Ctrl+Z)" onClick={undo} disabled={!past.length} style={{ opacity: past.length ? 1 : 0.3 }}><Undo2 size={14} /></button>
      <button className="btn-icon" title="Rétablir (Ctrl+Shift+Z)" onClick={redo} disabled={!future.length} style={{ opacity: future.length ? 1 : 0.3 }}><Redo2 size={14} /></button>

      <div className="divider" />

      {/* ── Import ── */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost" onClick={() => { setImportOpen(!importOpen); setExportOpen(false) }}>
          <Plus size={13} /> Importer <ChevronDown size={11} />
        </button>
        {importOpen && (
          <div className="fadein" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 220, zIndex: 300, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {[
              { icon: <Plus size={12}/>, label: 'Canevas vierge', action: () => { newProject(); setImportOpen(false) } },
              { icon: <Sparkles size={12}/>, label: 'Page de démo', action: () => { newProject(); addBlocks(makeFullPageDemo()); setImportOpen(false) } },
              null,
              { icon: <Globe size={12}/>, label: 'Depuis une URL', action: () => { setImportMode('url'); setImportOpen(false) } },
              { icon: <Code size={12}/>, label: 'Coller du HTML', action: () => { setImportMode('html'); setImportOpen(false) } },
              { icon: <FileText size={12}/>, label: 'Fichier .html', action: () => { fileRef.current?.click(); setImportOpen(false) } },
              { icon: <FileText size={12}/>, label: 'Session JSON', action: () => { const i = document.createElement('input'); i.type='file'; i.accept='.json'; i.onchange=(e)=>importJSON(e as unknown as React.ChangeEvent<HTMLInputElement>); i.click(); setImportOpen(false) } },
              { icon: <ImageIcon size={12}/>, label: 'Image', action: () => { imgRef.current?.click(); setImportOpen(false) } },
              null,
              { icon: <Terminal size={12}/>, label: 'Via CLI', action: () => { setImportMode('cli'); setImportOpen(false) } },
            ].map((item, i) =>
              item === null ? <div key={i} style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} /> : (
                <button key={item.label} onClick={item.action}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--card2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--muted)' }}>{item.icon}</span> {item.label}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Import panels ── */}
      {importMode === 'url' && (
        <div className="fadein" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Globe size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input className="input" style={{ width: 280 }} placeholder="https://votre-site.com" value={urlVal} onChange={e => setUrlVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && importURL()} autoFocus />
          <button className="btn btn-primary" onClick={importURL} disabled={loading}>{loading ? <Loader size={12} className="spin"/> : 'Importer'}</button>
          <button className="btn-icon" onClick={() => setImportMode(null)}>✕</button>
        </div>
      )}

      {importMode === 'html' && (
        <div className="fadein" style={{ position: 'absolute', top: 52, left: 12, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, zIndex: 200, width: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 8 }}>Colle ton HTML ici</div>
          <textarea className="input" rows={8} style={{ fontFamily: 'monospace', fontSize: 11 }} placeholder="<section>...</section>" value={htmlVal} onChange={e => setHtmlVal(e.target.value)} autoFocus />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary" onClick={importHTML}>Convertir en blocs</button>
            <button className="btn btn-ghost" onClick={() => setImportMode(null)}>Annuler</button>
          </div>
        </div>
      )}

      {importMode === 'cli' && (
        <div className="fadein" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px' }}>
          <Terminal size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <code style={{ fontSize: 11, color: 'var(--dim)' }}>hub-inspector scan --url http://localhost:3000 --app-dir ./app</code>
          <button className="btn-icon" onClick={() => setImportMode(null)}>✕</button>
        </div>
      )}

      {/* Inputs cachés */}
      <input ref={fileRef} type="file" accept=".html" style={{ display: 'none' }} onChange={importFile} />
      <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={importImage} />

      {/* Status */}
      {status === 'loading' && <div style={{ color: 'var(--muted)', fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}><div className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }}/>Analyse…</div>}
      {status === 'error' && <div style={{ color: 'var(--error)', fontSize: 11 }}>⚠ {error}</div>}

      <div style={{ flex: 1 }} />

      {/* ── Outils sélection ── */}
      {hasSel && (
        <>
          <button className="btn-icon" title="Dupliquer" onClick={duplicateSelected}><Copy size={13}/></button>
          <button className="btn-icon" title="Supprimer" onClick={deleteSelected} style={{ color: 'var(--error)' }}><Trash2 size={13}/></button>
          <div className="divider" />
        </>
      )}
      {hasMulti && (
        <>
          {[
            ['left', <AlignLeft size={13}/>,'Aligner à gauche'],
            ['center', <AlignCenter size={13}/>,'Centrer horizontalement'],
            ['right', <AlignRight size={13}/>,'Aligner à droite'],
            ['top', <AlignStartVertical size={13}/>,'Aligner en haut'],
            ['middle', <AlignCenterVertical size={13}/>,'Centrer verticalement'],
            ['bottom', <AlignEndVertical size={13}/>,'Aligner en bas'],
          ].map(([axis, icon, title]) => (
            <button key={axis as string} className="btn-icon" title={title as string} onClick={() => alignBlocks(axis as 'left'|'center'|'right'|'top'|'middle'|'bottom')}>{icon}</button>
          ))}
          <div className="divider" />
        </>
      )}

      {/* ── Zoom ── */}
      <button className="btn-icon" onClick={() => setZoom(Math.max(0.1, zoom * 0.85))}><ZoomOut size={13}/></button>
      <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', width: 40, textAlign: 'center', fontFamily: 'inherit' }}
        onClick={() => { setZoom(1); setPan(60, 40) }}>{Math.round(zoom * 100)}%</button>
      <button className="btn-icon" onClick={() => setZoom(Math.min(3, zoom * 1.18))}><ZoomIn size={13}/></button>
      <button className="btn-icon" title="Ajuster à l'écran" onClick={zoomToFit}><Maximize2 size={13}/></button>

      <div className="divider" />

      {/* ── Présenter ── */}
      <button className="btn btn-ghost" title="Mode présentation" onClick={() => setPresenting(true)}>
        <Play size={13} /> Présenter
      </button>

      {/* ── Partager ── */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-ghost" title="Lien de prototype partageable" onClick={share} disabled={sharing}>
          {sharing ? <Loader size={13} className="spin" /> : <Share2 size={13} />} Partager
        </button>
        {shareUrl && (
          <div className="fadein" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, zIndex: 300, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Check size={12} style={{ color: 'var(--success)' }} /> Lien copié — prototype en lecture seule
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="input input-sm" readOnly value={shareUrl} onFocus={e => (e.target as HTMLInputElement).select()} style={{ fontSize: 10 }} />
              <button className="btn-icon" title="Copier" onClick={() => navigator.clipboard.writeText(shareUrl)}><Copy size={12} /></button>
              <button className="btn-icon" title="Fermer" onClick={() => setShareUrl(null)}>✕</button>
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 7, opacity: 0.75 }}>Valable tant que le serveur reste actif (proto).</div>
          </div>
        )}
      </div>

      <div className="divider" />

      {/* ── Export ── */}
      <div style={{ position: 'relative' }}>
        <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => { setExportOpen(!exportOpen); setImportOpen(false) }}>
          <Download size={13} /> Exporter <ChevronDown size={11} />
        </button>
        {exportOpen && (
          <div className="fadein" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, minWidth: 180, zIndex: 300, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            {[
              { icon: <FileText size={12}/>, label: 'JSON (session)', action: exportJSON },
              { icon: <ImageIcon size={12}/>, label: 'PNG (capture)', action: exportPNG },
              { icon: <Code size={12}/>, label: 'HTML (code)', action: exportHTML },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px', background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--card2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >{item.icon} {item.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
