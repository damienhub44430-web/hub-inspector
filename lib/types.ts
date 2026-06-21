export type BlockKind =
  // Primitifs
  | 'heading' | 'text' | 'button' | 'image' | 'divider' | 'spacer'
  // Conteneurs
  | 'section' | 'card' | 'columns'
  // Composants pré-construits
  | 'navbar' | 'hero' | 'features' | 'cta' | 'testimonial' | 'pricing' | 'footer' | 'form'

export interface BlockStyle {
  fontSize?: number
  fontWeight?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  fontFamily?: string
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  opacity?: number
  boxShadow?: string
  gap?: number
  display?: string
  flexDirection?: string
  alignItems?: string
  justifyContent?: string
}

export interface Block {
  id: string
  kind: BlockKind
  x: number
  y: number
  width: number
  height: number
  // Contenu
  text?: string
  src?: string
  alt?: string
  href?: string
  level?: 1 | 2 | 3 | 4
  placeholder?: string
  // Style
  style: BlockStyle
  // État
  visible: boolean
  locked: boolean
  // Enfants (sections/groupes)
  children?: Block[]
  // Instance d'un composant : lie ce bloc à un ComponentDef (synchronisation)
  componentId?: string
  // Prototypage : navigue vers un autre écran au clic (mode présentation)
  linkTo?: string
  // Infos source (import)
  sourceTag?: string
  importY?: number  // position Y dans la page source
}

// Un écran = une frame/artboard avec ses propres blocs et dimensions
export interface Screen {
  id: string
  name: string
  width: number
  height: number
  background: string
  blocks: Block[]
}

// ── Design tokens (thème global du projet) ──
export interface ColorToken { id: string; name: string; value: string }
export interface TextStyleToken {
  id: string; name: string
  fontSize: number; fontWeight: string; lineHeight?: number; color?: string; fontFamily?: string
}
export interface DesignTokens { colors: ColorToken[]; textStyles: TextStyleToken[] }

// ── Composant réutilisable (arbre de blocs sauvegardé) ──
export interface ComponentDef { id: string; name: string; root: Block }

// ── Projet ──
export interface ProjectMeta { id: string; name: string; createdAt: number; updatedAt: number }
export interface ProjectDoc {
  projectName: string
  screens: Screen[]
  currentScreenId: string
  tokens: DesignTokens
  components: ComponentDef[]
}

export type AppView = 'editor' | 'dashboard'
export type ImportMode = 'url' | 'html' | 'file' | 'image' | 'cli' | null
export type LeftTab = 'layers' | 'library' | 'design'
export type ExportFormat = 'json' | 'png' | 'html'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
