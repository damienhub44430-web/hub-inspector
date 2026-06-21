'use client'
import { useSyncExternalStore, useEffect } from 'react'
import { useStore } from '@/lib/store'
import TopBar from '@/components/TopBar'
import ScreensBar from '@/components/ScreensBar'
import LibraryPanel from '@/components/LibraryPanel'
import Canvas from '@/components/Canvas'
import PropertiesPanel from '@/components/PropertiesPanel'
import Dashboard from '@/components/Dashboard'
import Presenter from '@/components/Presenter'

// Détecte l'hydratation sans setState dans un effet (false SSR/1er rendu → true ensuite)
const emptySubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

export default function Home() {
  const hydrated = useHydrated()
  const ready = useStore(s => s.ready)
  const appView = useStore(s => s.appView)
  const presenting = useStore(s => s.presenting)

  // Bootstrap (chargement depuis localStorage) + autosave debouncé
  useEffect(() => {
    useStore.getState().bootstrap()
    let t: ReturnType<typeof setTimeout>
    const unsub = useStore.subscribe(() => {
      clearTimeout(t)
      t = setTimeout(() => useStore.getState().persistNow(), 400)
    })
    const onUnload = () => useStore.getState().persistNow()
    window.addEventListener('beforeunload', onUnload)
    return () => { clearTimeout(t); unsub(); window.removeEventListener('beforeunload', onUnload) }
  }, [])

  if (!hydrated || !ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: 13, gap: 8 }}>
        <div className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
        {"Chargement de l'éditeur…"}
      </div>
    )
  }

  if (appView === 'dashboard') return <Dashboard />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <ScreensBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LibraryPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
      {presenting && <Presenter />}
    </div>
  )
}
