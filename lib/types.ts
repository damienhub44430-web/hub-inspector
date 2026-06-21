export type SectionType = 'navbar' | 'hero' | 'features' | 'cta' | 'testimonials' | 'pricing' | 'faq' | 'footer' | 'content' | 'gallery' | 'form' | 'unknown'

export interface Section {
  id: string
  type: SectionType
  label: string
  // Coordonnées dans l'image originale (px)
  srcY: number
  srcHeight: number
  srcWidth: number
  // Position sur le canvas (px)
  x: number
  y: number
  width: number
  height: number
  // Image découpée (data URL)
  imageUrl: string
  // Contenu détecté par Claude
  content?: {
    headline?: string
    subtext?: string
    cta?: string
    elements?: string[]
  }
  // Couleur de label
  color: string
  // Notes Claude
  claudeNote?: string
  locked?: boolean
  visible?: boolean
}

export interface PageInspection {
  id: string
  url: string
  projectName: string
  fullScreenshot: string   // data URL screenshot complet
  pageWidth: number
  pageHeight: number
  sections: Section[]
  createdAt: string
  status: 'idle' | 'capturing' | 'analyzing' | 'done' | 'error'
  error?: string
}
