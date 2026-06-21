'use client'
import { useSyncExternalStore } from 'react'
import TopBar from '@/components/TopBar'
import ScreensBar from '@/components/ScreensBar'
import LibraryPanel from '@/components/LibraryPanel'
import Canvas from '@/components/Canvas'
import PropertiesPanel from '@/components/PropertiesPanel'

// Détecte l'hydratation sans setState dans un effet :
// false côté serveur / premier rendu client, true ensuite → pas de mismatch
// pendant que le store se réhydrate depuis localStorage.
const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function Home() {
  const hydrated = useHydrated()

  if (!hydrated) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 13, gap: 8 }}>
        <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {"Chargement de l'éditeur…"}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <ScreensBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LibraryPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}
