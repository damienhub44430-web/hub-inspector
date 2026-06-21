import type { ProjectMeta, ProjectDoc, DesignTokens, Screen } from './types'

const INDEX_KEY = 'hub:index'
const ACTIVE_KEY = 'hub:active'
const docKey = (id: string) => `hub:proj:${id}`

const hasLS = () => typeof window !== 'undefined' && !!window.localStorage

function read<T>(key: string, fallback: T): T {
  if (!hasLS()) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function write(key: string, value: unknown) {
  if (!hasLS()) return
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch (e) { console.warn('Persistance ignorée (quota localStorage ?)', e) }
}

// ── Index des projets ──
export const loadIndex = (): ProjectMeta[] =>
  read<ProjectMeta[]>(INDEX_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt)
export const saveIndex = (list: ProjectMeta[]) => write(INDEX_KEY, list)

// ── Projet actif ──
export const loadActiveId = (): string | null => (hasLS() ? localStorage.getItem(ACTIVE_KEY) : null)
export const saveActiveId = (id: string) => { if (hasLS()) try { localStorage.setItem(ACTIVE_KEY, id) } catch {} }

// ── Documents ──
export const loadDoc = (id: string): ProjectDoc | null => read<ProjectDoc | null>(docKey(id), null)
export const saveDoc = (id: string, doc: ProjectDoc) => write(docKey(id), doc)
export const removeDoc = (id: string) => { if (hasLS()) try { localStorage.removeItem(docKey(id)) } catch {} }

// ── Tokens par défaut ──
export function defaultTokens(): DesignTokens {
  return {
    colors: [
      { id: 'primary', name: 'Primaire', value: '#7c6af7' },
      { id: 'bg', name: 'Fond', value: '#0d0d12' },
      { id: 'surface', name: 'Surface', value: '#12121a' },
      { id: 'text', name: 'Texte', value: '#e2e2f0' },
      { id: 'muted', name: 'Texte atténué', value: '#9494b0' },
      { id: 'border', name: 'Bordure', value: '#252535' },
    ],
    textStyles: [
      { id: 'h1', name: 'Titre 1', fontSize: 48, fontWeight: '700', lineHeight: 1.1, color: '#e2e2f0' },
      { id: 'h2', name: 'Titre 2', fontSize: 32, fontWeight: '700', lineHeight: 1.2, color: '#e2e2f0' },
      { id: 'body', name: 'Corps', fontSize: 16, fontWeight: '400', lineHeight: 1.6, color: '#9494b0' },
    ],
  }
}

// Normalise un document chargé (rétro-compat / robustesse)
export function normalizeDoc(doc: Partial<ProjectDoc> | null): ProjectDoc {
  const screens: Screen[] = Array.isArray(doc?.screens) && doc!.screens.length
    ? doc!.screens.map((s, i) => ({
        id: s.id || `scr-${Date.now()}-${i}`,
        name: s.name || `Écran ${i + 1}`,
        width: s.width || 1440,
        height: s.height || 1024,
        background: s.background || '#0d0d12',
        blocks: Array.isArray(s.blocks) ? s.blocks : [],
      }))
    : [{ id: `scr-${Date.now()}`, name: 'Écran 1', width: 1440, height: 1024, background: '#0d0d12', blocks: [] }]
  const cur = doc?.currentScreenId
  return {
    projectName: doc?.projectName || 'Projet',
    screens,
    currentScreenId: cur && screens.some(s => s.id === cur) ? cur : screens[0].id,
    tokens: doc?.tokens && Array.isArray(doc.tokens.colors) ? doc.tokens : defaultTokens(),
    components: Array.isArray(doc?.components) ? doc!.components : [],
  }
}
