'use client'
import UrlBar from '@/components/UrlBar'
import LayersPanel from '@/components/LayersPanel'
import Canvas from '@/components/Canvas'
import PropertiesPanel from '@/components/PropertiesPanel'

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <UrlBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LayersPanel />
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  )
}
