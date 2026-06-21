'use client'
import { useState } from 'react'
import { Globe, Loader, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'

export default function UrlBar() {
  const [url, setUrl] = useState('')
  const { inspection, updateInspection, setInspection, reset } = useStore()
  const loading = inspection?.status === 'capturing' || inspection?.status === 'analyzing'

  const launch = async () => {
    if (!url || loading) return
    let clean = url.trim()
    if (!clean.startsWith('http')) clean = `https://${clean}`

    reset()
    setInspection({
      id: Date.now().toString(),
      url: clean,
      projectName: new URL(clean).hostname,
      fullScreenshot: '',
      pageWidth: 1280,
      pageHeight: 3000,
      sections: [],
      createdAt: new Date().toISOString(),
      status: 'capturing',
    })

    try {
      updateInspection({ status: 'capturing' })
      const res = await fetch('/api/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      updateInspection({
        fullScreenshot: data.fullScreenshot,
        pageWidth: data.pageWidth,
        pageHeight: data.pageHeight,
        sections: data.sections,
        status: 'done',
      })
    } catch (err: unknown) {
      updateInspection({ status: 'error', error: err instanceof Error ? err.message : 'Erreur' })
    }
  }

  const statusMap: Record<string, string> = {
    capturing: 'Capture du screenshot…',
    analyzing: 'Claude analyse les sections…',
    error: inspection?.error || 'Erreur',
    done: `${inspection?.sections?.length || 0} sections détectées`,
  }
  const statusText = inspection?.status ? (statusMap[inspection.status] ?? '') : ''

  return (
    <div style={{
      height: 52, background: 'var(--panel)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', flexShrink: 0, zIndex: 50
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #7c6af7, #a855f7)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={13} color="white" />
        </div>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>Hub Inspector</span>
      </div>

      <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

      {/* URL input */}
      <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', maxWidth: 640 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Globe size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="https://votre-site.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && launch()}
          />
        </div>
        <button className="btn btn-primary" onClick={launch} disabled={!url || loading} style={{ flexShrink: 0 }}>
          {loading ? <Loader size={13} className="spin" /> : <Sparkles size={13} />}
          {loading ? 'Analyse…' : 'Inspecter'}
        </button>
      </div>

      {/* Status */}
      {statusText && (
        <div style={{
          fontSize: 11, color: inspection?.status === 'error' ? 'var(--error)' : inspection?.status === 'done' ? 'var(--success)' : 'var(--muted)',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          {loading && <div className="pulse" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)' }} />}
          {statusText}
        </div>
      )}
    </div>
  )
}
