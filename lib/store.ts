import { create } from 'zustand'
import type { Block, ImportMode, LeftTab, Message, BlockStyle } from './types'

interface AppState {
  // Projet
  projectName: string

  // Canvas
  blocks: Block[]
  selectedIds: string[]
  editingId: string | null

  // Vue
  zoom: number
  panX: number
  panY: number

  // UI
  leftTab: LeftTab
  importMode: ImportMode
  status: 'idle' | 'loading' | 'error'
  error: string | null

  // Claude
  messages: Message[]
  claudeLoading: boolean

  // Actions projet
  setProjectName: (n: string) => void
  newProject: () => void

  // Actions blocs
  addBlock: (b: Block) => void
  addBlocks: (bs: Block[]) => void
  updateBlock: (id: string, changes: Partial<Block>, parentId?: string) => void
  updateBlockStyle: (id: string, style: Partial<BlockStyle>, parentId?: string) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  moveBlock: (id: string, dx: number, dy: number, parentId?: string) => void

  // Sélection
  select: (id: string, multi?: boolean) => void
  selectAll: () => void
  clearSelection: () => void
  setEditing: (id: string | null) => void

  // Ordre Z
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // Alignement (multi-sélection)
  alignBlocks: (axis: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void

  // Vue
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  zoomToFit: () => void

  // UI
  setLeftTab: (t: LeftTab) => void
  setImportMode: (m: ImportMode) => void
  setStatus: (s: 'idle' | 'loading' | 'error', err?: string) => void

  // Claude
  addMessage: (m: Message) => void
  clearMessages: () => void
  setClaudeLoading: (v: boolean) => void
}

// Helper : trouver et mettre à jour un bloc (top-level ou enfant)
function updateInTree(blocks: Block[], id: string, changes: Partial<Block>, parentId?: string): Block[] {
  return blocks.map(b => {
    if (parentId) {
      if (b.id !== parentId) return b
      return { ...b, children: (b.children || []).map(c => c.id === id ? { ...c, ...changes } : c) }
    }
    if (b.id === id) return { ...b, ...changes }
    if (b.children?.length) {
      const updated = updateInTree(b.children, id, changes)
      if (updated !== b.children) return { ...b, children: updated }
    }
    return b
  })
}

export const useStore = create<AppState>((set, get) => ({
  projectName: 'Nouveau projet',
  blocks: [],
  selectedIds: [],
  editingId: null,
  zoom: 0.6,
  panX: 60,
  panY: 40,
  leftTab: 'library',
  importMode: null,
  status: 'idle',
  error: null,
  messages: [],
  claudeLoading: false,

  setProjectName: (n) => set({ projectName: n }),

  newProject: () => set({
    blocks: [], selectedIds: [], editingId: null,
    zoom: 0.6, panX: 60, panY: 40,
    status: 'idle', error: null, messages: [],
    projectName: 'Nouveau projet', leftTab: 'library',
  }),

  addBlock: (b) => set(s => ({ blocks: [...s.blocks, b], selectedIds: [b.id], leftTab: 'layers' })),
  addBlocks: (bs) => set(s => ({ blocks: [...s.blocks, ...bs], selectedIds: bs.map(b => b.id), leftTab: 'layers' })),

  updateBlock: (id, changes, parentId) =>
    set(s => ({ blocks: updateInTree(s.blocks, id, changes, parentId) })),

  updateBlockStyle: (id, style, parentId) =>
    set(s => ({
      blocks: updateInTree(s.blocks, id, {
        style: { ...(s.blocks.find(b => b.id === id)?.style || {}), ...style }
      }, parentId)
    })),

  deleteSelected: () =>
    set(s => ({
      blocks: s.blocks.filter(b => !s.selectedIds.includes(b.id)).map(b =>
        b.children ? { ...b, children: b.children.filter(c => !s.selectedIds.includes(c.id)) } : b
      ),
      selectedIds: [],
    })),

  duplicateSelected: () =>
    set(s => {
      const newBlocks = s.selectedIds.flatMap(id => {
        const block = s.blocks.find(b => b.id === id)
        if (!block) return []
        const clone = JSON.parse(JSON.stringify(block))
        clone.id = `b-${Date.now()}-${Math.random().toString(36).slice(2)}`
        clone.x += 20; clone.y += 20
        if (clone.children) clone.children = clone.children.map((c: Block) => ({
          ...c, id: `b-${Date.now()}-${Math.random().toString(36).slice(2)}`
        }))
        return [clone]
      })
      return { blocks: [...s.blocks, ...newBlocks], selectedIds: newBlocks.map(b => b.id) }
    }),

  moveBlock: (id, dx, dy, parentId) =>
    set(s => {
      const block = parentId
        ? s.blocks.find(b => b.id === parentId)?.children?.find(c => c.id === id)
        : s.blocks.find(b => b.id === id)
      if (!block) return s
      return { blocks: updateInTree(s.blocks, id, { x: block.x + dx, y: block.y + dy }, parentId) }
    }),

  select: (id, multi = false) =>
    set(s => ({
      selectedIds: multi
        ? s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]
        : [id],
      editingId: null,
    })),

  selectAll: () => set(s => ({ selectedIds: s.blocks.map(b => b.id) })),
  clearSelection: () => set({ selectedIds: [], editingId: null }),
  setEditing: (id) => set({ editingId: id, selectedIds: id ? [id] : [] }),

  bringForward: (id) => set(s => {
    const i = s.blocks.findIndex(b => b.id === id)
    if (i < 0 || i >= s.blocks.length - 1) return s
    const bs = [...s.blocks]
    ;[bs[i], bs[i+1]] = [bs[i+1], bs[i]]
    return { blocks: bs }
  }),

  sendBackward: (id) => set(s => {
    const i = s.blocks.findIndex(b => b.id === id)
    if (i <= 0) return s
    const bs = [...s.blocks]
    ;[bs[i-1], bs[i]] = [bs[i], bs[i-1]]
    return { blocks: bs }
  }),

  alignBlocks: (axis) => set(s => {
    if (s.selectedIds.length < 2) return s
    const selected = s.blocks.filter(b => s.selectedIds.includes(b.id))
    const minX = Math.min(...selected.map(b => b.x))
    const maxX = Math.max(...selected.map(b => b.x + b.width))
    const minY = Math.min(...selected.map(b => b.y))
    const maxY = Math.max(...selected.map(b => b.y + b.height))
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    return {
      blocks: s.blocks.map(b => {
        if (!s.selectedIds.includes(b.id)) return b
        switch (axis) {
          case 'left':   return { ...b, x: minX }
          case 'center': return { ...b, x: centerX - b.width / 2 }
          case 'right':  return { ...b, x: maxX - b.width }
          case 'top':    return { ...b, y: minY }
          case 'middle': return { ...b, y: centerY - b.height / 2 }
          case 'bottom': return { ...b, y: maxY - b.height }
          default: return b
        }
      })
    }
  }),

  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  zoomToFit: () => set(s => {
    if (!s.blocks.length) return { zoom: 0.6, panX: 60, panY: 40 }
    const allBlocks = s.blocks.flatMap(b => b.children ? [b, ...b.children.map(c => ({ ...c, x: b.x + c.x, y: b.y + c.y }))] : [b])
    const minX = Math.min(...allBlocks.map(b => b.x))
    const maxX = Math.max(...allBlocks.map(b => b.x + b.width))
    const minY = Math.min(...allBlocks.map(b => b.y))
    const maxY = Math.max(...allBlocks.map(b => b.y + b.height))
    const contentW = maxX - minX + 80
    const contentH = maxY - minY + 80
    const viewW = 900, viewH = 700
    const zoom = Math.min(0.95, Math.min(viewW / contentW, viewH / contentH))
    return { zoom, panX: (viewW - contentW * zoom) / 2 - minX * zoom + 40, panY: 40 - minY * zoom + 40 }
  }),

  setLeftTab: (leftTab) => set({ leftTab }),
  setImportMode: (importMode) => set({ importMode }),
  setStatus: (status, err) => set({ status, error: err || null }),

  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  setClaudeLoading: (claudeLoading) => set({ claudeLoading }),
}))
