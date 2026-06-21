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
  // Infos source (import)
  sourceTag?: string
  importY?: number  // position Y dans la page source
}

export type ImportMode = 'url' | 'html' | 'file' | 'image' | 'cli' | null
export type LeftTab = 'layers' | 'library'
export type ExportFormat = 'json' | 'png' | 'html'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
