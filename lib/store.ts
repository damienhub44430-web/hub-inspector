import { create } from 'zustand'
import type { PageInspection, Section, Block } from './types'

interface Store {
  inspection: PageInspection | null
  selectedSectionId: string | null
  selectedBlockId: string | null
  hoveredBlockId: string | null
  zoom: number; panX: number; panY: number
  showBlocks: boolean
  claudeLoading: boolean
  claudeMessages: Array<{ role: 'user'|'assistant'; content: string }>

  setInspection: (i: PageInspection) => void
  updateInspection: (p: Partial<PageInspection>) => void
  updateSection: (id: string, p: Partial<Section>) => void
  updateBlock: (sectionId: string, blockId: string, p: Partial<Block>) => void
  selectSection: (id: string | null) => void
  selectBlock: (sectionId: string | null, blockId: string | null) => void
  hoverBlock: (id: string | null) => void
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  toggleBlocks: () => void
  setClaudeLoading: (v: boolean) => void
  addClaudeMessage: (m: { role: 'user'|'assistant'; content: string }) => void
  clearClaude: () => void
  reset: () => void
}

export const useStore = create<Store>((set) => ({
  inspection: null,
  selectedSectionId: null,
  selectedBlockId: null,
  hoveredBlockId: null,
  zoom: 0.55, panX: 60, panY: 40,
  showBlocks: true,
  claudeLoading: false,
  claudeMessages: [],

  setInspection: (i) => set({ inspection: i, selectedSectionId: null, selectedBlockId: null }),
  updateInspection: (p) => set((s) => ({ inspection: s.inspection ? { ...s.inspection, ...p } : null })),

  updateSection: (id, p) => set((s) => ({
    inspection: s.inspection ? {
      ...s.inspection,
      sections: s.inspection.sections.map(sec => sec.id === id ? { ...sec, ...p } : sec)
    } : null
  })),

  updateBlock: (sectionId, blockId, p) => set((s) => ({
    inspection: s.inspection ? {
      ...s.inspection,
      sections: s.inspection.sections.map(sec =>
        sec.id === sectionId
          ? { ...sec, blocks: sec.blocks.map(b => b.id === blockId ? { ...b, ...p } : b) }
          : sec
      )
    } : null
  })),

  selectSection: (id) => set({ selectedSectionId: id, selectedBlockId: null }),
  selectBlock: (sectionId, blockId) => set({ selectedSectionId: sectionId, selectedBlockId: blockId }),
  hoverBlock: (id) => set({ hoveredBlockId: id }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  toggleBlocks: () => set((s) => ({ showBlocks: !s.showBlocks })),
  setClaudeLoading: (claudeLoading) => set({ claudeLoading }),
  addClaudeMessage: (m) => set((s) => ({ claudeMessages: [...s.claudeMessages, m] })),
  clearClaude: () => set({ claudeMessages: [] }),
  reset: () => set({ inspection: null, selectedSectionId: null, selectedBlockId: null, claudeMessages: [], zoom: 0.55, panX: 60, panY: 40 }),
}))
