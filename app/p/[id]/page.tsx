'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import PresenterView from '@/components/PresenterView'
import { normalizeTokens } from '@/lib/storage'
import type { Screen, DesignTokens } from '@/lib/types'

export default function SharedPrototype() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<{ screens: Screen[]; tokens: DesignTokens; projectName?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch(`/api/push?id=${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Prototype introuvable ou expiré')))
      .then(d => { if (alive) setData({ screens: d.screens || [], tokens: normalizeTokens(d.tokens), projectName: d.projectName }) })
      .catch(e => { if (alive) setError(e.message) })
    return () => { alive = false }
  }, [params.id])

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#08080c', color: 'var(--muted)', gap: 10 }}>
        <div style={{ fontSize: 32, opacity: 0.3 }}>🔗</div>
        <div style={{ fontSize: 14 }}>{error}</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Le lien de partage est valable tant que le serveur reste actif.</div>
      </div>
    )
  }

  if (!data || !data.screens.length) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080c', color: 'var(--muted)', fontSize: 13, gap: 8 }}>
        <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        Chargement du prototype…
      </div>
    )
  }

  return <PresenterView screens={data.screens} tokens={data.tokens} startId={data.screens[0].id} />
}
