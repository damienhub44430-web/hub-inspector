import { create } from 'zustand'
import type { PageInspection, Section } from './types'

interface Store {
  inspection: PageInspection | null
  selectedId: string | null
  hoveredId: string | null
  zoom: number
  panX: number
  panY: number
  claudePanel: boolean
  claudeLoading: boolean
  claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }>

  setInspection: (i: PageInspection) => void
  updateInspection: (p: Partial<PageInspection>) => void
  updateSection: (id: string, p: Partial<Section>) => void
  reorderSections: (sections: Section[]) => void
  selectSection: (id: string | null) => void
  hoverSection: (id: string | null) => void
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  toggleClaudePanel: () => void
  setClaudeLoading: (v: boolean) => void
  addClaudeMessage: (m: { role: 'user' | 'assistant'; content: string }) => void
  clearClaude: () => void
  reset: () => void
}

export const useStore = create<Store>((set) => ({
  inspection: null,
  selectedId: null,
  hoveredId: null,
  zoom: 0.6,
  panX: 40,
  panY: 40,
  claudePanel: false,
  claudeLoading: false,
  claudeMessages: [],

  setInspection: (i) => set({ inspection: i, selectedId: null }),
  updateInspection: (p) => set((s) => ({ inspection: s.inspection ? { ...s.inspection, ...p } : null })),
  updateSection: (id, p) =>
    set((s) => ({
      inspection: s.inspection
        ? { ...s.inspection, sections: s.inspection.sections.map((sec) => sec.id === id ? { ...sec, ...p } : sec) }
        : null,
    })),
  reorderSections: (sections) =>
    set((s) => ({ inspection: s.inspection ? { ...s.inspection, sections } : null })),
  selectSection: (id) => set({ selectedId: id }),
  hoverSection: (id) => set({ hoveredId: id }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleClaudePanel: () => set((s) => ({ claudePanel: !s.claudePanel })),
  setClaudeLoading: (claudeLoading) => set({ claudeLoading }),
  addClaudeMessage: (m) => set((s) => ({ claudeMessages: [...s.claudeMessages, m] })),
  clearClaude: () => set({ claudeMessages: [], claudePanel: false }),
  reset: () => set({ inspection: null, selectedId: null, claudeMessages: [], zoom: 0.6, panX: 40, panY: 40 }),
}))
