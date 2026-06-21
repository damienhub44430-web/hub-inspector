export type SectionType = 'navbar'|'hero'|'features'|'cta'|'testimonials'|'pricing'|'faq'|'footer'|'content'|'gallery'|'form'|'section'|'unknown'
export type BlockType = 'heading'|'text'|'cta'|'image'|'form'|'navbar'|'section'|'footer'|'unknown'

export interface BlockStyles {
  bgColor?: string
  color?: string
  fontSize?: number
  fontWeight?: string
}

export interface Block {
  id: string
  tag: string
  type: BlockType
  text: string
  // Position relative à la section (canvas px)
  x: number; y: number; width: number; height: number
  // Position source originale (page px)
  srcX: number; srcY: number; srcWidth: number; srcHeight: number
  styles: BlockStyles
  visible: boolean
  // Édition
  editedText?: string
  editedStyles?: Partial<BlockStyles>
}

export interface Section {
  id: string
  type: SectionType
  label: string
  color: string
  // Position canvas
  x: number; y: number; width: number; height: number
  // Source
  srcY: number; srcHeight: number; srcWidth: number
  clipY: number; clipH: number
  imageUrl: string
  content: Record<string, unknown>
  blocks: Block[]
  locked: boolean
  visible: boolean
  claudeNote?: string
}

export interface PageInspection {
  id: string
  url: string
  projectName: string
  fullScreenshot: string
  pageWidth: number
  pageHeight: number
  sections: Section[]
  createdAt: string
  status: 'idle'|'capturing'|'analyzing'|'done'|'error'
  error?: string
  extractionSource?: string
}
