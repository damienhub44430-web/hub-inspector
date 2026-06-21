import { create } from 'zustand'
import type {
  Block, ImportMode, LeftTab, Message, BlockStyle, Screen,
  ProjectMeta, ProjectDoc, DesignTokens, ColorToken, TextStyleToken, SpacingToken, ShadowToken, ComponentDef, AppView,
} from './types'
import {
  loadIndex, saveIndex, loadActiveId, saveActiveId, loadDoc, saveDoc, removeDoc,
  defaultTokens, normalizeDoc,
} from './storage'

const rid = (p = 'id') => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ─── Helpers document ──────────────────────────────────────────────────────

export function makeScreen(name: string, blocks: Block[] = [], partial?: Partial<Screen>): Screen {
  return { id: rid('scr'), name, width: 1440, height: 1024, background: '#0d0d12', blocks, ...partial }
}

function cloneBlock(b: Block): Block {
  return { ...b, id: rid('b'), style: { ...b.style }, children: b.children?.map(cloneBlock) }
}

function findBlock(blocks: Block[], id: string): { block: Block; parentId?: string } | null {
  for (const b of blocks) {
    if (b.id === id) return { block: b }
    const child = b.children?.find(c => c.id === id)
    if (child) return { block: child, parentId: b.id }
  }
  return null
}

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
  // App
  appView: AppView
  ready: boolean

  // Projet actif
  projectId: string
  projectName: string
  projects: ProjectMeta[]

  // Document
  screens: Screen[]
  currentScreenId: string
  tokens: DesignTokens
  components: ComponentDef[]

  // Historique (session)
  past: DocSnapshot[]
  future: DocSnapshot[]

  // Sélection / édition
  selectedIds: string[]
  editingId: string | null

  // Vue
  zoom: number
  panX: number
  panY: number

  // Présentation (prototype)
  presenting: boolean

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

  // ── Persistance / projets ──
  bootstrap: () => void
  persistNow: () => void
  goToDashboard: () => void
  openEditor: () => void
  createProject: (name?: string) => void
  openProject: (id: string) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => void
  renameProject: (id: string, name: string) => void

  // ── Historique ──
  pushHistory: (label?: string) => void
  undo: () => void
  redo: () => void

  // ── Projet (document actif) ──
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

  // ── Hiérarchie ──
  reorderSiblings: (draggedId: string, targetId: string) => void
  groupSelected: () => void
  ungroupSelected: () => void

  // ── Design tokens ──
  addColorToken: (name: string, value: string) => void
  updateColorToken: (id: string, changes: Partial<ColorToken>) => void
  deleteColorToken: (id: string) => void
  addTextStyle: (style: Omit<TextStyleToken, 'id'>) => void
  updateTextStyle: (id: string, changes: Partial<TextStyleToken>) => void
  deleteTextStyle: (id: string) => void
  applyTextStyle: (blockId: string, styleId: string, parentId?: string) => void
  addSpacingToken: (name: string, value: number) => void
  updateSpacingToken: (id: string, changes: Partial<SpacingToken>) => void
  deleteSpacingToken: (id: string) => void
  addShadowToken: (name: string, value: string) => void
  updateShadowToken: (id: string, changes: Partial<ShadowToken>) => void
  deleteShadowToken: (id: string) => void

  // ── Composants réutilisables ──
  saveSelectionAsComponent: (name: string) => void
  insertComponent: (id: string) => void
  deleteComponent: (id: string) => void
  renameComponent: (id: string, name: string) => void
  updateComponentFromInstance: (blockId: string) => void
  resetInstance: (blockId: string) => void
  detachInstance: (blockId: string) => void

  // ── Vue ──
  setZoom: (z: number) => void
  setPan: (x: number, y: number) => void
  zoomToFit: () => void

  // ── Présentation ──
  setPresenting: (v: boolean) => void

  // ── UI ──
  setLeftTab: (t: LeftTab) => void
  setImportMode: (m: ImportMode) => void
  setStatus: (s: 'idle' | 'loading' | 'error', err?: string) => void

  // ── Claude ──
  addMessage: (m: Message) => void
  clearMessages: () => void
  setClaudeLoading: (v: boolean) => void
}

let lastHistoryLabel = ''
let lastHistoryTime = 0

const currentBlocks = (s: AppState): Block[] =>
  s.screens.find(scr => scr.id === s.currentScreenId)?.blocks ?? []

function patchScreens(s: AppState, fn: (blocks: Block[]) => Block[]): Pick<AppState, 'screens'> {
  return { screens: s.screens.map(scr => scr.id === s.currentScreenId ? { ...scr, blocks: fn(scr.blocks) } : scr) }
}

function docFrom(s: AppState): ProjectDoc {
  return {
    projectName: s.projectName,
    screens: s.screens,
    currentScreenId: s.currentScreenId,
    tokens: s.tokens,
    components: s.components,
  }
}

function docToState(doc: ProjectDoc): Partial<AppState> {
  const n = normalizeDoc(doc)
  return {
    projectName: n.projectName, screens: n.screens, currentScreenId: n.currentScreenId,
    tokens: n.tokens, components: n.components,
    past: [], future: [], selectedIds: [], editingId: null,
  }
}

const initialScreen = makeScreen('Écran 1')

export const useStore = create<AppState>()((set, get) => ({
  appView: 'editor',
  ready: false,
  projectId: '',
  projectName: 'Nouveau projet',
  projects: [],
  screens: [initialScreen],
  currentScreenId: initialScreen.id,
  tokens: defaultTokens(),
  components: [],
  past: [],
  future: [],
  selectedIds: [],
  editingId: null,
  zoom: 0.6,
  panX: 60,
  panY: 40,
  presenting: false,
  leftTab: 'library',
  importMode: null,
  status: 'idle',
  error: null,
  messages: [],
  claudeLoading: false,

  // ── Lecture ──
  getBlocks: () => currentBlocks(get()),
  getCurrentScreen: () => { const s = get(); return s.screens.find(scr => scr.id === s.currentScreenId) },

  // ── Persistance / projets ──
  bootstrap: () => {
    if (get().ready) return
    const index = loadIndex()
    if (!index.length) {
      // Premier lancement : crée le projet par défaut depuis l'état initial
      const id = rid('proj')
      const meta: ProjectMeta = { id, name: get().projectName, createdAt: Date.now(), updatedAt: Date.now() }
      saveDoc(id, docFrom(get()))
      saveIndex([meta]); saveActiveId(id)
      set({ projectId: id, projects: [meta], ready: true })
      return
    }
    const wanted = loadActiveId()
    const activeId = wanted && index.some(p => p.id === wanted) ? wanted : index[0].id
    const doc = loadDoc(activeId)
    set({ projectId: activeId, projects: index, ready: true, ...(doc ? docToState(doc) : {}) })
    saveActiveId(activeId)
  },

  persistNow: () => {
    const s = get()
    if (!s.ready || !s.projectId) return
    saveDoc(s.projectId, docFrom(s))
    // Met à jour l'index en storage uniquement (pas de set() → évite une boucle autosave)
    const idx = loadIndex()
    const updated = idx.map(p => p.id === s.projectId ? { ...p, name: s.projectName, updatedAt: Date.now() } : p)
    saveIndex(updated.length ? updated : [{ id: s.projectId, name: s.projectName, createdAt: Date.now(), updatedAt: Date.now() }])
    saveActiveId(s.projectId)
  },

  goToDashboard: () => { get().persistNow(); set({ appView: 'dashboard', projects: loadIndex(), presenting: false }) },
  openEditor: () => set({ appView: 'editor' }),

  createProject: (name) => {
    get().persistNow()
    const id = rid('proj')
    const scr = makeScreen('Écran 1')
    const pname = name?.trim() || 'Nouveau projet'
    const meta: ProjectMeta = { id, name: pname, createdAt: Date.now(), updatedAt: Date.now() }
    const doc: ProjectDoc = { projectName: pname, screens: [scr], currentScreenId: scr.id, tokens: defaultTokens(), components: [] }
    saveDoc(id, doc)
    const projects = [meta, ...loadIndex().filter(p => p.id !== id)]
    saveIndex(projects); saveActiveId(id)
    set({
      projectId: id, projects, appView: 'editor',
      projectName: pname, screens: [scr], currentScreenId: scr.id, tokens: doc.tokens, components: [],
      past: [], future: [], selectedIds: [], editingId: null, zoom: 0.6, panX: 60, panY: 40, leftTab: 'library',
    })
  },

  openProject: (id) => {
    get().persistNow()
    const doc = loadDoc(id)
    saveActiveId(id)
    set({ projectId: id, appView: 'editor', zoom: 0.6, panX: 60, panY: 40, ...(doc ? docToState(doc) : {}) })
  },

  deleteProject: (id) => {
    removeDoc(id)
    let projects = loadIndex().filter(p => p.id !== id)
    const s = get()
    if (!projects.length) {
      // Recrée un projet vide
      const nid = rid('proj')
      const scr = makeScreen('Écran 1')
      const meta: ProjectMeta = { id: nid, name: 'Nouveau projet', createdAt: Date.now(), updatedAt: Date.now() }
      saveDoc(nid, { projectName: 'Nouveau projet', screens: [scr], currentScreenId: scr.id, tokens: defaultTokens(), components: [] })
      projects = [meta]; saveIndex(projects); saveActiveId(nid)
      set({ projects, projectId: nid, projectName: 'Nouveau projet', screens: [scr], currentScreenId: scr.id, tokens: defaultTokens(), components: [], past: [], future: [], selectedIds: [], editingId: null })
      return
    }
    saveIndex(projects)
    if (s.projectId === id) {
      const next = projects[0]
      const doc = loadDoc(next.id)
      saveActiveId(next.id)
      set({ projects, projectId: next.id, ...(doc ? docToState(doc) : {}) })
    } else {
      set({ projects })
    }
  },

  duplicateProject: (id) => {
    const doc = normalizeDoc(loadDoc(id))
    const nid = rid('proj')
    const name = `${doc.projectName} copie`
    const copy: ProjectDoc = {
      ...doc, projectName: name,
      screens: doc.screens.map(scr => ({ ...scr, id: rid('scr'), blocks: scr.blocks.map(cloneBlock) })),
      currentScreenId: '',
    }
    copy.currentScreenId = copy.screens[0]?.id || ''
    saveDoc(nid, copy)
    const meta: ProjectMeta = { id: nid, name, createdAt: Date.now(), updatedAt: Date.now() }
    const projects = [meta, ...loadIndex()]
    saveIndex(projects)
    set({ projects })
  },

  renameProject: (id, name) => {
    const projects = loadIndex().map(p => p.id === id ? { ...p, name, updatedAt: Date.now() } : p)
    saveIndex(projects)
    const s = get()
    if (s.projectId === id) { saveDoc(id, { ...docFrom(s), projectName: name }); set({ projects, projectName: name }) }
    else set({ projects })
  },

  // ── Historique ──
  pushHistory: (label) => set(s => {
    const now = Date.now()
    if (label && label === lastHistoryLabel && now - lastHistoryTime < 600) { lastHistoryTime = now; return s }
    lastHistoryLabel = label || ''; lastHistoryTime = now
    return { past: [...s.past, { screens: s.screens, currentScreenId: s.currentScreenId }].slice(-60), future: [] }
  }),

  undo: () => set(s => {
    if (!s.past.length) return s
    const prev = s.past[s.past.length - 1]
    lastHistoryLabel = ''
    return {
      screens: prev.screens,
      currentScreenId: prev.screens.some(x => x.id === prev.currentScreenId) ? prev.currentScreenId : prev.screens[0]?.id,
      past: s.past.slice(0, -1),
      future: [{ screens: s.screens, currentScreenId: s.currentScreenId }, ...s.future].slice(0, 60),
      selectedIds: [], editingId: null,
    }
  }),

  redo: () => set(s => {
    if (!s.future.length) return s
    const next = s.future[0]
    lastHistoryLabel = ''
    return {
      screens: next.screens, currentScreenId: next.currentScreenId,
      past: [...s.past, { screens: s.screens, currentScreenId: s.currentScreenId }].slice(-60),
      future: s.future.slice(1),
      selectedIds: [], editingId: null,
    }
  }),

  // ── Projet (document actif) ──
  setProjectName: (n) => set({ projectName: n }),

  newProject: () => {
    const scr = makeScreen('Écran 1')
    set({
      screens: [scr], currentScreenId: scr.id, past: [], future: [],
      selectedIds: [], editingId: null, zoom: 0.6, panX: 60, panY: 40,
      status: 'idle', error: null, messages: [], leftTab: 'library',
    })
  },

  loadProject: (projectName, screens) => {
    const n = normalizeDoc({ projectName, screens, currentScreenId: '', tokens: get().tokens, components: get().components })
    set({
      projectName: n.projectName, screens: n.screens, currentScreenId: n.currentScreenId,
      past: [], future: [], selectedIds: [], editingId: null, status: 'idle', error: null, leftTab: 'layers',
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
    const currentScreenId = s.currentScreenId === id ? screens[Math.max(0, idx - 1)].id : s.currentScreenId
    set({ screens, currentScreenId, selectedIds: [], editingId: null })
  },

  renameScreen: (id, name) => { get().pushHistory('rename'); set(s => ({ screens: s.screens.map(x => x.id === id ? { ...x, name } : x) })) },

  duplicateScreen: (id) => {
    get().pushHistory()
    const s = get()
    const src = s.screens.find(x => x.id === id)
    if (!src) return
    const copy = makeScreen(`${src.name} copie`, src.blocks.map(cloneBlock), { width: src.width, height: src.height, background: src.background })
    const idx = s.screens.findIndex(x => x.id === id)
    set({ screens: [...s.screens.slice(0, idx + 1), copy, ...s.screens.slice(idx + 1)], currentScreenId: copy.id, selectedIds: [], editingId: null })
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

  updateScreen: (id, changes) => { get().pushHistory('screen-prop'); set(s => ({ screens: s.screens.map(x => x.id === id ? { ...x, ...changes } : x) })) },

  // ── Blocs ──
  addBlock: (b) => { get().pushHistory(); set(s => ({ ...patchScreens(s, bs => [...bs, b]), selectedIds: [b.id], leftTab: 'layers' })) },

  addBlocks: (bs) => { get().pushHistory(); set(s => ({ ...patchScreens(s, prev => [...prev, ...bs]), selectedIds: bs.map(b => b.id), leftTab: 'layers' })) },

  updateBlock: (id, changes, parentId) => set(s => patchScreens(s, bs => updateInTree(bs, id, changes, parentId))),

  updateBlockStyle: (id, style, parentId) => set(s => {
    const found = findBlock(currentBlocks(s), id)
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
        .map(b => b.children ? { ...b, children: b.children.filter(c => !st.selectedIds.includes(c.id)) } : b)),
      selectedIds: [],
    }))
  },

  duplicateSelected: () => {
    const s = get()
    if (!s.selectedIds.length) return
    get().pushHistory()
    set(st => {
      const blocks = currentBlocks(st)
      const clones = st.selectedIds.flatMap(id => {
        const b = blocks.find(x => x.id === id)
        if (!b) return []
        const c = cloneBlock(b); c.x += 20; c.y += 20; return [c]
      })
      return { ...patchScreens(st, bs => [...bs, ...clones]), selectedIds: clones.map(c => c.id) }
    })
  },

  moveBlock: (id, dx, dy, parentId) => set(s => {
    const blocks = currentBlocks(s)
    const found = parentId
      ? blocks.find(b => b.id === parentId)?.children?.find(c => c.id === id)
      : blocks.find(b => b.id === id)
    if (!found) return s
    return patchScreens(s, bs => updateInTree(bs, id, { x: found.x + dx, y: found.y + dy }, parentId))
  }),

  // ── Sélection ──
  select: (id, multi = false) => set(s => ({
    selectedIds: multi
      ? s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]
      : [id],
    editingId: null,
  })),

  selectAll: () => set(s => ({ selectedIds: currentBlocks(s).map(b => b.id) })),
  clearSelection: () => set({ selectedIds: [], editingId: null }),
  setEditing: (id) => set(s => ({ editingId: id, selectedIds: id ? [id] : s.selectedIds })),

  bringForward: (id) => {
    get().pushHistory()
    set(s => {
      const blocks = currentBlocks(s)
      const i = blocks.findIndex(b => b.id === id)
      if (i < 0 || i >= blocks.length - 1) return s
      return patchScreens(s, bs => { const a = [...bs]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })
    })
  },

  sendBackward: (id) => {
    get().pushHistory()
    set(s => {
      const blocks = currentBlocks(s)
      const i = blocks.findIndex(b => b.id === id)
      if (i <= 0) return s
      return patchScreens(s, bs => { const a = [...bs]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })
    })
  },

  alignBlocks: (axis) => {
    const s = get()
    if (s.selectedIds.length < 2) return
    get().pushHistory()
    set(st => {
      const blocks = currentBlocks(st)
      const sel = blocks.filter(b => st.selectedIds.includes(b.id))
      const minX = Math.min(...sel.map(b => b.x)), maxX = Math.max(...sel.map(b => b.x + b.width))
      const minY = Math.min(...sel.map(b => b.y)), maxY = Math.max(...sel.map(b => b.y + b.height))
      const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2
      return patchScreens(st, bs => bs.map(b => {
        if (!st.selectedIds.includes(b.id)) return b
        switch (axis) {
          case 'left': return { ...b, x: minX }
          case 'center': return { ...b, x: cX - b.width / 2 }
          case 'right': return { ...b, x: maxX - b.width }
          case 'top': return { ...b, y: minY }
          case 'middle': return { ...b, y: cY - b.height / 2 }
          case 'bottom': return { ...b, y: maxY - b.height }
          default: return b
        }
      }))
    })
  },

  // ── Hiérarchie ──
  reorderSiblings: (draggedId, targetId) => {
    if (draggedId === targetId) return
    const blocks = currentBlocks(get())
    const di = blocks.findIndex(b => b.id === draggedId)
    const ti = blocks.findIndex(b => b.id === targetId)
    if (di >= 0 && ti >= 0) {
      // Réordonnancement au niveau racine (ordre Z)
      get().pushHistory()
      set(st => patchScreens(st, bs => {
        const arr = [...bs]
        const [m] = arr.splice(arr.findIndex(b => b.id === draggedId), 1)
        arr.splice(arr.findIndex(b => b.id === targetId), 0, m)
        return arr
      }))
      return
    }
    // Réordonnancement à l'intérieur d'un même parent
    const parent = blocks.find(b => b.children?.some(c => c.id === draggedId) && b.children?.some(c => c.id === targetId))
    if (!parent) return
    get().pushHistory()
    set(st => patchScreens(st, bs => bs.map(b => {
      if (b.id !== parent.id) return b
      const arr = [...(b.children || [])]
      const [m] = arr.splice(arr.findIndex(c => c.id === draggedId), 1)
      arr.splice(arr.findIndex(c => c.id === targetId), 0, m)
      return { ...b, children: arr }
    })))
  },

  groupSelected: () => {
    const s = get()
    const blocks = currentBlocks(s)
    const sel = blocks.filter(b => s.selectedIds.includes(b.id))
    if (sel.length < 2) return
    get().pushHistory()
    const minX = Math.min(...sel.map(b => b.x)), minY = Math.min(...sel.map(b => b.y))
    const maxX = Math.max(...sel.map(b => b.x + b.width)), maxY = Math.max(...sel.map(b => b.y + b.height))
    const group: Block = {
      id: rid('b'), kind: 'section', x: minX, y: minY, width: maxX - minX, height: maxY - minY,
      style: {}, visible: true, locked: false,
      children: sel.map(b => ({ ...b, x: b.x - minX, y: b.y - minY })),
    }
    set(st => ({ ...patchScreens(st, bs => [...bs.filter(b => !st.selectedIds.includes(b.id)), group]), selectedIds: [group.id] }))
  },

  ungroupSelected: () => {
    const s = get()
    const hasGroup = currentBlocks(s).some(b => s.selectedIds.includes(b.id) && b.children?.length)
    if (!hasGroup) return
    get().pushHistory()
    set(st => {
      const newSel: string[] = []
      const out: Block[] = []
      for (const b of currentBlocks(st)) {
        if (st.selectedIds.includes(b.id) && b.children?.length) {
          for (const c of b.children) {
            const promoted = { ...c, x: b.x + c.x, y: b.y + c.y }
            out.push(promoted); newSel.push(promoted.id)
          }
        } else out.push(b)
      }
      return { ...patchScreens(st, () => out), selectedIds: newSel }
    })
  },

  // ── Design tokens ──
  addColorToken: (name, value) => set(s => ({ tokens: { ...s.tokens, colors: [...s.tokens.colors, { id: rid('col'), name: name || 'Couleur', value }] } })),
  updateColorToken: (id, changes) => set(s => ({ tokens: { ...s.tokens, colors: s.tokens.colors.map(c => c.id === id ? { ...c, ...changes } : c) } })),
  deleteColorToken: (id) => set(s => ({ tokens: { ...s.tokens, colors: s.tokens.colors.filter(c => c.id !== id) } })),

  addTextStyle: (style) => set(s => ({ tokens: { ...s.tokens, textStyles: [...s.tokens.textStyles, { id: rid('txt'), ...style }] } })),
  updateTextStyle: (id, changes) => set(s => ({ tokens: { ...s.tokens, textStyles: s.tokens.textStyles.map(t => t.id === id ? { ...t, ...changes } : t) } })),
  deleteTextStyle: (id) => set(s => ({ tokens: { ...s.tokens, textStyles: s.tokens.textStyles.filter(t => t.id !== id) } })),

  addSpacingToken: (name, value) => set(s => ({ tokens: { ...s.tokens, spacing: [...s.tokens.spacing, { id: rid('sp'), name: name || 'Espace', value }] } })),
  updateSpacingToken: (id, changes) => set(s => ({ tokens: { ...s.tokens, spacing: s.tokens.spacing.map(t => t.id === id ? { ...t, ...changes } : t) } })),
  deleteSpacingToken: (id) => set(s => ({ tokens: { ...s.tokens, spacing: s.tokens.spacing.filter(t => t.id !== id) } })),

  addShadowToken: (name, value) => set(s => ({ tokens: { ...s.tokens, shadows: [...s.tokens.shadows, { id: rid('sh'), name: name || 'Ombre', value }] } })),
  updateShadowToken: (id, changes) => set(s => ({ tokens: { ...s.tokens, shadows: s.tokens.shadows.map(t => t.id === id ? { ...t, ...changes } : t) } })),
  deleteShadowToken: (id) => set(s => ({ tokens: { ...s.tokens, shadows: s.tokens.shadows.filter(t => t.id !== id) } })),

  applyTextStyle: (blockId, styleId, parentId) => {
    const s = get()
    const ts = s.tokens.textStyles.find(t => t.id === styleId)
    if (!ts) return
    get().pushHistory('prop')
    const found = findBlock(currentBlocks(s), blockId)
    const merged = { ...(found?.block.style || {}), fontSize: ts.fontSize, fontWeight: ts.fontWeight, lineHeight: ts.lineHeight, color: ts.color, fontFamily: ts.fontFamily }
    set(st => patchScreens(st, bs => updateInTree(bs, blockId, { style: merged }, parentId)))
  },

  // ── Composants réutilisables ──
  saveSelectionAsComponent: (name) => {
    const s = get()
    const blocks = currentBlocks(s)
    const sel = s.selectedIds.map(id => blocks.find(b => b.id === id)).filter(Boolean) as Block[]
    if (!sel.length) return
    let root: Block
    if (sel.length === 1) { root = cloneBlock(sel[0]); root.x = 0; root.y = 0 }
    else {
      const minX = Math.min(...sel.map(b => b.x)), minY = Math.min(...sel.map(b => b.y))
      const maxX = Math.max(...sel.map(b => b.x + b.width)), maxY = Math.max(...sel.map(b => b.y + b.height))
      root = {
        id: rid('b'), kind: 'section', x: 0, y: 0, width: maxX - minX, height: maxY - minY,
        style: {}, visible: true, locked: false,
        children: sel.map(b => { const c = cloneBlock(b); c.x = b.x - minX; c.y = b.y - minY; return c }),
      }
    }
    set({ components: [...s.components, { id: rid('cmp'), name: name?.trim() || 'Composant', root }] })
  },

  insertComponent: (id) => {
    get().pushHistory()
    const s = get()
    const comp = s.components.find(c => c.id === id)
    if (!comp) return
    // Instance liée : taggée avec componentId pour la synchronisation
    const root = cloneBlock(comp.root); root.x = 80; root.y = 80; root.componentId = comp.id
    set(st => ({ ...patchScreens(st, bs => [...bs, root]), selectedIds: [root.id], leftTab: 'layers' }))
  },

  deleteComponent: (id) => set(s => ({ components: s.components.filter(c => c.id !== id) })),
  renameComponent: (id, name) => set(s => ({ components: s.components.map(c => c.id === id ? { ...c, name } : c) })),

  // Met à jour le composant maître depuis une instance, puis propage à toutes les autres instances (tous écrans)
  updateComponentFromInstance: (blockId) => {
    const s = get()
    const inst = currentBlocks(s).find(b => b.id === blockId)
    if (!inst?.componentId) return
    const comp = s.components.find(c => c.id === inst.componentId)
    if (!comp) return
    get().pushHistory()
    const newRoot = cloneBlock(inst); newRoot.x = 0; newRoot.y = 0; delete newRoot.componentId
    const components = s.components.map(c => c.id === comp.id ? { ...c, root: newRoot } : c)
    const screens = s.screens.map(scr => ({
      ...scr,
      blocks: scr.blocks.map(b =>
        b.componentId === comp.id && b.id !== blockId
          ? { ...cloneBlock(newRoot), id: b.id, x: b.x, y: b.y, componentId: comp.id }
          : b),
    }))
    set({ components, screens })
  },

  // Réinitialise une instance depuis le composant maître (annule les modifs locales)
  resetInstance: (blockId) => {
    const s = get()
    const inst = currentBlocks(s).find(b => b.id === blockId)
    if (!inst?.componentId) return
    const comp = s.components.find(c => c.id === inst.componentId)
    if (!comp) return
    get().pushHistory()
    set(st => patchScreens(st, bs => bs.map(b =>
      b.id === blockId ? { ...cloneBlock(comp.root), id: b.id, x: b.x, y: b.y, componentId: comp.id } : b)))
  },

  // Détache une instance (devient un bloc indépendant)
  detachInstance: (blockId) => {
    get().pushHistory()
    set(st => patchScreens(st, bs => bs.map(b => b.id === blockId ? { ...b, componentId: undefined } : b)))
  },

  // ── Vue ──
  setZoom: (zoom) => set({ zoom }),
  setPan: (panX, panY) => set({ panX, panY }),
  zoomToFit: () => set(s => {
    const screen = s.screens.find(scr => scr.id === s.currentScreenId)
    const blocks = screen?.blocks ?? []
    const rects = [
      ...(screen ? [{ x: 0, y: 0, width: screen.width, height: screen.height }] : []),
      ...blocks.flatMap(b => b.children ? [b, ...b.children.map(c => ({ ...c, x: b.x + c.x, y: b.y + c.y }))] : [b]),
    ]
    if (!rects.length) return { zoom: 0.6, panX: 60, panY: 40 }
    const minX = Math.min(...rects.map(b => b.x)), maxX = Math.max(...rects.map(b => b.x + b.width))
    const minY = Math.min(...rects.map(b => b.y)), maxY = Math.max(...rects.map(b => b.y + b.height))
    const contentW = maxX - minX + 80, contentH = maxY - minY + 80
    const viewW = 900, viewH = 700
    const zoom = Math.min(0.95, Math.min(viewW / contentW, viewH / contentH))
    return { zoom, panX: (viewW - contentW * zoom) / 2 - minX * zoom + 40, panY: 40 - minY * zoom + 40 }
  }),

  // ── Présentation ──
  setPresenting: (presenting) => set({ presenting }),

  // ── UI ──
  setLeftTab: (leftTab) => set({ leftTab }),
  setImportMode: (importMode) => set({ importMode }),
  setStatus: (status, err) => set({ status, error: err || null }),

  // ── Claude ──
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  setClaudeLoading: (claudeLoading) => set({ claudeLoading }),
}))
