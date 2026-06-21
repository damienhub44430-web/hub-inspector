'use client'
import { useStore } from '@/lib/store'
import PresenterView from './PresenterView'

export default function Presenter() {
  const { screens, currentScreenId, tokens, setPresenting } = useStore()
  return (
    <PresenterView
      screens={screens}
      tokens={tokens}
      startId={currentScreenId}
      onExit={() => setPresenting(false)}
    />
  )
}
