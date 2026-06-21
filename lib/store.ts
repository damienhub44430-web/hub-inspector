import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Block, ImportMode, LeftTab, Message, BlockStyle, Screen } from './types'

const rid = (p = 'id') => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ─── Helpers document ──────────────────────────────────────────────────────

export function makeScreen(name: string, blocks: Block[] = [], partial?: Partial<Screen>): Screen {
  return { id: rid('scr'), name, width: 1440, height: 1024, background: '#0d0d12', blocks, ...partial }
}

function cloneBlock(b: Block): Block {
  return {
    ...b,
    id: rid('b'),
    style: { ...b.style },
    children: b.children?.map(cloneBlock),
  }
}

// Trouver un bloc (top-level ou enfant) dans une liste
function findBlock(blocks: Block[], id: string): { block: Block; parentId?: string } | null {
  for (const b of blocks) {
    if (b.id === id) return { block: b }
    const child = b.children?.find(c => c.id === id)
    if (child) return { block: child, parentId: b.id }
  }
  return null
}

// Mettre à jour un bloc (top-level ou enfant) immutablement
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

type DocSnapshot = { screens: Screen[]; currentScreenId: string }

interface AppState {
  // Projet
  projectName: string

  // Document multi-écrans
  screens: Screen[]
  currentScreenId: string

  // Historique (session uniquement, non persisté)
  past: DocSnapshot[]
  future: DocSnapshot[]

  // Sélection / édition
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

  // ── Lecture ──
  getBlocks: () => Block[]
  getCurrentScreen: () => Screen | undefined

  // ── Historique ──
  pushHistory: (label?: string) => void
  undo: () => void
  redo: () => void

  // ── Projet ──
  setProjectName: (n: string) => void
  newProject: () => void
  loadProject: (projectName: string, screens: Screen[]) => void

  // ── Écrans ──
  addScreen: () => void
  addScreenWithBlocks: (name: string, blocks: Block[], size?: { width: number; height: number }) => void
  deleteScreen: (id: string) => void
  renameScreen: (id: string, name: string) => void
  duplicateScreen: (id: string) => void
  setCurrentScreen: (id: string) => void
  moveScreen: (id: string, toIndex: number) => void
  updateScreen: (id: string, changes: Partial<Screen>) => void

  // ── Blocs ──
  addBlock: (b: Block) => void
  addBlocks: (bs: Block[]) => void
  updateBlock: (id: string, changes: Partial<Block>, parentId?: string) => void
  updateBlockStyle: (id: string, style: Partial<BlockStyle>, parentId?: string) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  moveBlock: (id: string, dx: number, dy: number, parentId?: string) => void

  // ── Sélection ──
  select: (id: string, multi?: boolean) => void
  selectAll: () => void
  clearSelection: () => void
  setEditing: (id: string | null) => void

  // ── Ordre Z ──
  bringForward: (id: string) => void
  sendBackward: (id: string) => void

  // ── Alignement ──
  alignBlocks: (axis: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void

  // ── Vue ──
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  zoomToFit: () => void

  // ── UI ──
  setLeftTab: (t: LeftTab) => void
  setImportMode: (m: ImportMode) => void
  setStatus: (s: 'idle' | 'loading' | 'error', err?: string) => void

  // ── Claude ──
  addMessage: (m: Message) => void
  clearMessages: () => void
  setClaudeLoading: (v: boolean) => void
}

// Coalescing de l'historique : regroupe les éditions rapides du même type
let lastHistoryLabel = ''
let lastHistoryTime = 0

// Met à jour les blocs de l'écran courant immutablement
function patchScreens(s: AppState, fn: (blocks: Block[]) => Block[]): Pick<AppState, 'screens'> {
  return {
    screens: s.screens.map(scr =>
      scr.id === s.currentScreenId ? { ...scr, blocks: fn(scr.blocks) } : scr
    ),
  }
}

const initialScreen = makeScreen('Écran 1')

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      projectName: 'Nouveau projet',
      screens: [initialScreen],
      currentScreenId: initialScreen.id,
      past: [],
      future: [],
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

      // ── Lecture ──
      getBlocks: () => {
        const s = get()
        return s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []
      },
      getCurrentScreen: () => {
        const s = get()
        return s.screens.find(scr => scr.id === s.currentScreenId)
      },

      // ── Historique ──
      pushHistory: (label) => set(s => {
        const now = Date.now()
        // Coalesce les éditions rapides de même nature (drag, frappe clavier…)
        if (label && label === lastHistoryLabel && now - lastHistoryTime < 600) {
          lastHistoryTime = now
          return s
        }
        lastHistoryLabel = label || ''
        lastHistoryTime = now
        const snap: DocSnapshot = { screens: s.screens, currentScreenId: s.currentScreenId }
        return { past: [...s.past, snap].slice(-60), future: [] }
      }),

      undo: () => set(s => {
        if (!s.past.length) return s
        const prev = s.past[s.past.length - 1]
        const cur: DocSnapshot = { screens: s.screens, currentScreenId: s.currentScreenId }
        lastHistoryLabel = ''
        return {
          screens: prev.screens,
          currentScreenId: prev.screens.some(x => x.id === prev.currentScreenId) ? prev.currentScreenId : prev.screens[0]?.id,
          past: s.past.slice(0, -1),
          future: [cur, ...s.future].slice(0, 60),
          selectedIds: [],
          editingId: null,
        }
      }),

      redo: () => set(s => {
        if (!s.future.length) return s
        const next = s.future[0]
        const cur: DocSnapshot = { screens: s.screens, currentScreenId: s.currentScreenId }
        lastHistoryLabel = ''
        return {
          screens: next.screens,
          currentScreenId: next.currentScreenId,
          past: [...s.past, cur].slice(-60),
          future: s.future.slice(1),
          selectedIds: [],
          editingId: null,
        }
      }),

      // ── Projet ──
      setProjectName: (n) => set({ projectName: n }),

      newProject: () => {
        const scr = makeScreen('Écran 1')
        set({
          screens: [scr], currentScreenId: scr.id,
          past: [], future: [],
          selectedIds: [], editingId: null,
          zoom: 0.6, panX: 60, panY: 40,
          status: 'idle', error: null, messages: [],
          projectName: 'Nouveau projet', leftTab: 'library',
        })
      },

      loadProject: (projectName, screens) => {
        // Normalise : garantit des ids et des champs valides
        const norm: Screen[] = (screens || []).map((s, i) => ({
          id: s.id || rid('scr'),
          name: s.name || `Écran ${i + 1}`,
          width: s.width || 1440,
          height: s.height || 1024,
          background: s.background || '#0d0d12',
          blocks: Array.isArray(s.blocks) ? s.blocks : [],
        }))
        const safe = norm.length ? norm : [makeScreen('Écran 1')]
        set({
          projectName: projectName || 'Projet importé',
          screens: safe, currentScreenId: safe[0].id,
          past: [], future: [],
          selectedIds: [], editingId: null,
          status: 'idle', error: null, leftTab: 'layers',
        })
      },

      // ── Écrans ──
      addScreen: () => {
        get().pushHistory()
        const s = get()
        const scr = makeScreen(`Écran ${s.screens.length + 1}`)
        set({ screens: [...s.screens, scr], currentScreenId: scr.id, selectedIds: [], editingId: null })
      },

      addScreenWithBlocks: (name, blocks, size) => {
        get().pushHistory()
        const s = get()
        const scr = makeScreen(name || `Écran ${s.screens.length + 1}`, blocks, size)
        set({ screens: [...s.screens, scr], currentScreenId: scr.id, selectedIds: blocks.map(b => b.id), editingId: null, leftTab: 'layers' })
      },

      deleteScreen: (id) => {
        const s = get()
        if (s.screens.length <= 1) return
        get().pushHistory()
        const idx = s.screens.findIndex(x => x.id === id)
        const screens = s.screens.filter(x => x.id !== id)
        const currentScreenId = s.currentScreenId === id
          ? screens[Math.max(0, idx - 1)].id
          : s.currentScreenId
        set({ screens, currentScreenId, selectedIds: [], editingId: null })
      },

      renameScreen: (id, name) => {
        get().pushHistory('rename')
        set(s => ({ screens: s.screens.map(x => x.id === id ? { ...x, name } : x) }))
      },

      duplicateScreen: (id) => {
        get().pushHistory()
        const s = get()
        const src = s.screens.find(x => x.id === id)
        if (!src) return
        const copy = makeScreen(`${src.name} copie`, src.blocks.map(cloneBlock), { width: src.width, height: src.height, background: src.background })
        const idx = s.screens.findIndex(x => x.id === id)
        const screens = [...s.screens.slice(0, idx + 1), copy, ...s.screens.slice(idx + 1)]
        set({ screens, currentScreenId: copy.id, selectedIds: [], editingId: null })
      },

      setCurrentScreen: (id) => set({ currentScreenId: id, selectedIds: [], editingId: null }),

      moveScreen: (id, toIndex) => set(s => {
        const from = s.screens.findIndex(x => x.id === id)
        if (from < 0) return s
        const screens = [...s.screens]
        const [moved] = screens.splice(from, 1)
        screens.splice(Math.max(0, Math.min(screens.length, toIndex)), 0, moved)
        return { screens }
      }),

      updateScreen: (id, changes) => {
        get().pushHistory('screen-prop')
        set(s => ({ screens: s.screens.map(x => x.id === id ? { ...x, ...changes } : x) }))
      },

      // ── Blocs ──
      addBlock: (b) => {
        get().pushHistory()
        set(s => ({ ...patchScreens(s, bs => [...bs, b]), selectedIds: [b.id], leftTab: 'layers' }))
      },

      addBlocks: (bs) => {
        get().pushHistory()
        set(s => ({ ...patchScreens(s, prev => [...prev, ...bs]), selectedIds: bs.map(b => b.id), leftTab: 'layers' }))
      },

      updateBlock: (id, changes, parentId) =>
        set(s => patchScreens(s, bs => updateInTree(bs, id, changes, parentId))),

      updateBlockStyle: (id, style, parentId) =>
        set(s => {
          const blocks = s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []
          const found = findBlock(blocks, id)
          const merged = { ...(found?.block.style || {}), ...style }
          return patchScreens(s, bs => updateInTree(bs, id, { style: merged }, parentId))
        }),

      deleteSelected: () => {
        const s = get()
        if (!s.selectedIds.length) return
        get().pushHistory()
        set(st => ({
          ...patchScreens(st, bs => bs
            .filter(b => !st.selectedIds.includes(b.id))
            .map(b => b.children ? { ...b, children: b.children.filter(c => !st.selectedIds.includes(c.id)) } : b)
          ),
          selectedIds: [],
        }))
      },

      duplicateSelected: () => {
        const s = get()
        if (!s.selectedIds.length) return
        get().pushHistory()
        set(st => {
          const blocks = st.screens.find(scr => scr.id === st.currentScreenId)?.blocks ?? []
          const clones = st.selectedIds.flatMap(id => {
            const b = blocks.find(x => x.id === id)
            if (!b) return []
            const c = cloneBlock(b)
            c.x += 20; c.y += 20
            return [c]
          })
          return { ...patchScreens(st, bs => [...bs, ...clones]), selectedIds: clones.map(c => c.id) }
        })
      },

      moveBlock: (id, dx, dy, parentId) =>
        set(s => {
          const blocks = s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []
          const found = parentId
            ? blocks.find(b => b.id === parentId)?.children?.find(c => c.id === id)
            : blocks.find(b => b.id === id)
          if (!found) return s
          return patchScreens(s, bs => updateInTree(bs, id, { x: found.x + dx, y: found.y + dy }, parentId))
        }),

      // ── Sélection ──
      select: (id, multi = false) =>
        set(s => ({
          selectedIds: multi
            ? s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]
            : [id],
          editingId: null,
        })),

      selectAll: () => set(s => ({ selectedIds: (s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []).map(b => b.id) })),
      clearSelection: () => set({ selectedIds: [], editingId: null }),
      setEditing: (id) => set(s => ({ editingId: id, selectedIds: id ? [id] : s.selectedIds })),

      bringForward: (id) => {
        get().pushHistory()
        set(s => {
          const blocks = s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []
          const i = blocks.findIndex(b => b.id === id)
          if (i < 0 || i >= blocks.length - 1) return s
          return patchScreens(s, bs => {
            const arr = [...bs]
            ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
            return arr
          })
        })
      },

      sendBackward: (id) => {
        get().pushHistory()
        set(s => {
          const blocks = s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []
          const i = blocks.findIndex(b => b.id === id)
          if (i <= 0) return s
          return patchScreens(s, bs => {
            const arr = [...bs]
            ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
            return arr
          })
        })
      },

      alignBlocks: (axis) => {
        const s = get()
        if (s.selectedIds.length < 2) return
        get().pushHistory()
        set(st => {
          const blocks = st.screens.find(scr => scr.id === st.currentScreenId)?.blocks ?? []
          const selected = blocks.filter(b => st.selectedIds.includes(b.id))
          const minX = Math.min(...selected.map(b => b.x))
          const maxX = Math.max(...selected.map(b => b.x + b.width))
          const minY = Math.min(...selected.map(b => b.y))
          const maxY = Math.max(...selected.map(b => b.y + b.height))
          const centerX = (minX + maxX) / 2
          const centerY = (minY + maxY) / 2
          return patchScreens(st, bs => bs.map(b => {
            if (!st.selectedIds.includes(b.id)) return b
            switch (axis) {
              case 'left':   return { ...b, x: minX }
              case 'center': return { ...b, x: centerX - b.width / 2 }
              case 'right':  return { ...b, x: maxX - b.width }
              case 'top':    return { ...b, y: minY }
              case 'middle': return { ...b, y: centerY - b.height / 2 }
              case 'bottom': return { ...b, y: maxY - b.height }
              default: return b
            }
          }))
        })
      },

      // ── Vue ──
      setZoom: (zoom) => set({ zoom }),
      setPan: (panX, panY) => set({ panX, panY }),
      zoomToFit: () => set(s => {
        const screen = s.screens.find(scr => scr.id === s.currentScreenId)
        const blocks = screen?.blocks ?? []
        const rects = [
          ...(screen ? [{ x: 0, y: 0, width: screen.width, height: screen.height }] : []),
          ...blocks.flatMap(b => b.children
            ? [b, ...b.children.map(c => ({ ...c, x: b.x + c.x, y: b.y + c.y }))]
            : [b]),
        ]
        if (!rects.length) return { zoom: 0.6, panX: 60, panY: 40 }
        const minX = Math.min(...rects.map(b => b.x))
        const maxX = Math.max(...rects.map(b => b.x + b.width))
        const minY = Math.min(...rects.map(b => b.y))
        const maxY = Math.max(...rects.map(b => b.y + b.height))
        const contentW = maxX - minX + 80
        const contentH = maxY - minY + 80
        const viewW = 900, viewH = 700
        const zoom = Math.min(0.95, Math.min(viewW / contentW, viewH / contentH))
        return { zoom, panX: (viewW - contentW * zoom) / 2 - minX * zoom + 40, panY: 40 - minY * zoom + 40 }
      }),

      // ── UI ──
      setLeftTab: (leftTab) => set({ leftTab }),
      setImportMode: (importMode) => set({ importMode }),
      setStatus: (status, err) => set({ status, error: err || null }),

      // ── Claude ──
      addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
      clearMessages: () => set({ messages: [] }),
      setClaudeLoading: (claudeLoading) => set({ claudeLoading }),
    }),
    {
      name: 'hub-inspector-doc',
      // Stockage tolérant : un quota localStorage dépassé (screenshots base64 lourds)
      // ne doit pas faire planter l'édition — on ignore juste la sauvegarde.
      storage: createJSONStorage(() => ({
        getItem: (n) => localStorage.getItem(n),
        setItem: (n, v) => { try { localStorage.setItem(n, v) } catch (e) { console.warn('Persistance ignorée (quota localStorage ?)', e) } },
        removeItem: (n) => localStorage.removeItem(n),
      })),
      version: 1,
      partialize: (s) => ({
        projectName: s.projectName,
        screens: s.screens,
        currentScreenId: s.currentScreenId,
        zoom: s.zoom,
        panX: s.panX,
        panY: s.panY,
        leftTab: s.leftTab,
      }),
    }
  )
)
