'use client'
import TopBar from '@/components/TopBar'
import LibraryPanel from '@/components/LibraryPanel'
import Canvas from '@/components/Canvas'
import PropertiesPanel from '@/components/PropertiesPanel'

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LibraryPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}
