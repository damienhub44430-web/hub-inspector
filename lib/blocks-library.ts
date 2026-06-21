import type { Block, BlockKind } from './types'

let _id = 0
const uid = () => `b-${Date.now()}-${++_id}`

// ─── Factories primitifs ───────────────────────────────────────────────────

export function makeHeading(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'heading', x: 120, y: 120,
    width: 500, height: 64, text: 'Titre de votre section', level: 1,
    style: { fontSize: 42, fontWeight: '700', color: '#e2e2f0', textAlign: 'left', lineHeight: 1.15 },
    visible: true, locked: false, ...overrides,
  }
}

export function makeText(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'text', x: 120, y: 200,
    width: 500, height: 80, text: 'Votre texte ici. Décrivez votre offre, vos avantages ou votre histoire.',
    style: { fontSize: 16, fontWeight: '400', color: '#9494b0', lineHeight: 1.65, textAlign: 'left' },
    visible: true, locked: false, ...overrides,
  }
}

export function makeButton(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'button', x: 120, y: 300,
    width: 180, height: 48, text: 'Commencer',
    style: {
      fontSize: 15, fontWeight: '600', color: '#ffffff', textAlign: 'center',
      backgroundColor: '#7c6af7', borderRadius: 8,
      paddingLeft: 24, paddingRight: 24, paddingTop: 12, paddingBottom: 12,
    },
    visible: true, locked: false, ...overrides,
  }
}

export function makeImage(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'image', x: 120, y: 120,
    width: 500, height: 300, src: '', alt: 'Image',
    style: { borderRadius: 8, backgroundColor: '#1a1a26' },
    visible: true, locked: false, ...overrides,
  }
}

export function makeDivider(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'divider', x: 60, y: 200,
    width: 600, height: 1,
    style: { backgroundColor: '#252535' },
    visible: true, locked: false, ...overrides,
  }
}

export function makeSpacer(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'spacer', x: 60, y: 200,
    width: 600, height: 48,
    style: {},
    visible: true, locked: false, ...overrides,
  }
}

export function makeSection(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'section', x: 0, y: 0,
    width: 1200, height: 200,
    style: { backgroundColor: '#12121a', paddingTop: 40, paddingBottom: 40, paddingLeft: 60, paddingRight: 60 },
    visible: true, locked: false, children: [], ...overrides,
  }
}

// ─── Composants pré-construits ────────────────────────────────────────────

export function makeNavbar(y = 0): Block {
  return {
    id: uid(), kind: 'navbar', x: 0, y,
    width: 1200, height: 64,
    style: { backgroundColor: '#0d0d12', paddingLeft: 40, paddingRight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#252535' },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'text', x: 0, y: 0, width: 120, height: 32, text: '🔷 MonApp',
        style: { fontSize: 18, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 900, y: 8, width: 120, height: 40, text: 'Connexion',
        style: { fontSize: 14, fontWeight: '500', color: '#e2e2f0', textAlign: 'center', borderWidth: 1, borderColor: '#252535', borderRadius: 6 }, visible: true, locked: false },
    ],
  }
}

export function makeHero(y = 80): Block {
  return {
    id: uid(), kind: 'hero', x: 0, y,
    width: 1200, height: 560,
    style: { backgroundColor: '#0d0d12', paddingTop: 100, paddingBottom: 100, paddingLeft: 80, paddingRight: 80 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'text', x: 0, y: 0, width: 700, height: 28, text: '✨ Nouveau — Version 2.0 disponible',
        style: { fontSize: 13, fontWeight: '500', color: '#7c6af7', textAlign: 'left' }, visible: true, locked: false },
      { id: uid(), kind: 'heading', x: 0, y: 40, width: 700, height: 130, text: 'Construisez des produits\nqu\'on adore utiliser', level: 1,
        style: { fontSize: 56, fontWeight: '700', color: '#e2e2f0', lineHeight: 1.1, textAlign: 'left' }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 190, width: 560, height: 60, text: 'La plateforme qui vous permet de concevoir, itérer et déployer plus vite. Sans friction, sans compromis.',
        style: { fontSize: 18, color: '#9494b0', lineHeight: 1.6, textAlign: 'left' }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 0, y: 280, width: 180, height: 52, text: '→ Commencer gratuitement',
        style: { fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center', backgroundColor: '#7c6af7', borderRadius: 10, paddingLeft: 24, paddingRight: 24 }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 196, y: 280, width: 140, height: 52, text: 'Voir la démo',
        style: { fontSize: 15, fontWeight: '500', color: '#e2e2f0', textAlign: 'center', borderWidth: 1, borderColor: '#252535', borderRadius: 10 }, visible: true, locked: false },
    ],
  }
}

export function makeFeatures(y = 660): Block {
  const cardStyle = { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#252535', paddingTop: 28, paddingBottom: 28, paddingLeft: 28, paddingRight: 28 }
  return {
    id: uid(), kind: 'features', x: 0, y,
    width: 1200, height: 400,
    style: { backgroundColor: '#0d0d12', paddingTop: 80, paddingBottom: 80, paddingLeft: 60, paddingRight: 60 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'heading', x: 0, y: 0, width: 1080, height: 48, text: 'Tout ce dont vous avez besoin', level: 2,
        style: { fontSize: 36, fontWeight: '700', color: '#e2e2f0', textAlign: 'center' }, visible: true, locked: false },
      { id: uid(), kind: 'section', x: 0, y: 70, width: 340, height: 200, style: cardStyle, visible: true, locked: false,
        children: [
          { id: uid(), kind: 'text', x: 0, y: 0, width: 280, height: 28, text: '⚡ Rapide',
            style: { fontSize: 20, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
          { id: uid(), kind: 'text', x: 0, y: 40, width: 280, height: 60, text: 'Performances de pointe pour vos utilisateurs. Temps de chargement < 100ms.',
            style: { fontSize: 14, color: '#9494b0', lineHeight: 1.6 }, visible: true, locked: false },
        ]},
      { id: uid(), kind: 'section', x: 370, y: 70, width: 340, height: 200, style: cardStyle, visible: true, locked: false,
        children: [
          { id: uid(), kind: 'text', x: 0, y: 0, width: 280, height: 28, text: '🔒 Sécurisé',
            style: { fontSize: 20, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
          { id: uid(), kind: 'text', x: 0, y: 40, width: 280, height: 60, text: 'Chiffrement de bout en bout. Conformité RGPD. Vos données restent les vôtres.',
            style: { fontSize: 14, color: '#9494b0', lineHeight: 1.6 }, visible: true, locked: false },
        ]},
      { id: uid(), kind: 'section', x: 740, y: 70, width: 340, height: 200, style: cardStyle, visible: true, locked: false,
        children: [
          { id: uid(), kind: 'text', x: 0, y: 0, width: 280, height: 28, text: '🚀 Évolutif',
            style: { fontSize: 20, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
          { id: uid(), kind: 'text', x: 0, y: 40, width: 280, height: 60, text: 'De 1 à 1 million d\'utilisateurs sans changer une ligne de code.',
            style: { fontSize: 14, color: '#9494b0', lineHeight: 1.6 }, visible: true, locked: false },
        ]},
    ],
  }
}

export function makeCTA(y = 1080): Block {
  return {
    id: uid(), kind: 'cta', x: 0, y,
    width: 1200, height: 280,
    style: { backgroundColor: '#7c6af7', paddingTop: 80, paddingBottom: 80, paddingLeft: 80, paddingRight: 80 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'heading', x: 0, y: 0, width: 1040, height: 56, text: 'Prêt à passer à la vitesse supérieure ?', level: 2,
        style: { fontSize: 40, fontWeight: '700', color: '#ffffff', textAlign: 'center' }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 420, y: 80, width: 200, height: 52, text: 'Essai gratuit 14 jours',
        style: { fontSize: 16, fontWeight: '600', color: '#7c6af7', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 10 }, visible: true, locked: false },
    ],
  }
}

export function makeFooter(y = 1380): Block {
  return {
    id: uid(), kind: 'footer', x: 0, y,
    width: 1200, height: 120,
    style: { backgroundColor: '#0d0d12', paddingTop: 40, paddingBottom: 40, paddingLeft: 60, paddingRight: 60, borderWidth: 1, borderColor: '#252535' },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'text', x: 0, y: 0, width: 400, height: 24, text: '© 2026 MonApp. Tous droits réservés.',
        style: { fontSize: 13, color: '#6b6b85', textAlign: 'left' }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 700, y: 0, width: 380, height: 24, text: 'CGU · Confidentialité · Contact',
        style: { fontSize: 13, color: '#9494b0', textAlign: 'right' }, visible: true, locked: false },
    ],
  }
}

export function makeCard(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'card', x: 120, y: 120,
    width: 360, height: 280,
    style: { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#252535', paddingTop: 32, paddingBottom: 32, paddingLeft: 32, paddingRight: 32 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'heading', x: 0, y: 0, width: 296, height: 36, text: 'Titre de la carte', level: 3,
        style: { fontSize: 22, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 50, width: 296, height: 80, text: 'Description de la carte. Expliquez votre proposition de valeur ici.',
        style: { fontSize: 14, color: '#9494b0', lineHeight: 1.6 }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 0, y: 150, width: 140, height: 40, text: 'En savoir plus →',
        style: { fontSize: 13, fontWeight: '600', color: '#7c6af7', textAlign: 'left' }, visible: true, locked: false },
    ],
    ...overrides,
  }
}

export function makeTestimonial(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'testimonial', x: 120, y: 120,
    width: 480, height: 200,
    style: { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#252535', paddingTop: 32, paddingBottom: 32, paddingLeft: 32, paddingRight: 32 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'text', x: 0, y: 0, width: 416, height: 80, text: '"Ce produit a transformé notre façon de travailler. Résultats visibles dès la première semaine."',
        style: { fontSize: 15, color: '#e2e2f0', lineHeight: 1.6 }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 100, width: 200, height: 24, text: '— Marie D., CEO @ Startup',
        style: { fontSize: 13, color: '#9494b0', fontWeight: '500' }, visible: true, locked: false },
    ],
    ...overrides,
  }
}

export function makePricing(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'pricing', x: 120, y: 120,
    width: 320, height: 440,
    style: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 2, borderColor: '#7c6af7', paddingTop: 40, paddingBottom: 40, paddingLeft: 36, paddingRight: 36 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'text', x: 0, y: 0, width: 248, height: 24, text: 'Pro',
        style: { fontSize: 14, fontWeight: '600', color: '#7c6af7' }, visible: true, locked: false },
      { id: uid(), kind: 'heading', x: 0, y: 34, width: 248, height: 60, text: '49€ /mois', level: 2,
        style: { fontSize: 42, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 110, width: 248, height: 120, text: '✓ Utilisateurs illimités\n✓ API complète\n✓ Support prioritaire\n✓ Analytics avancés',
        style: { fontSize: 14, color: '#9494b0', lineHeight: 1.8 }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 0, y: 250, width: 248, height: 52, text: 'Choisir Pro',
        style: { fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center', backgroundColor: '#7c6af7', borderRadius: 10 }, visible: true, locked: false },
    ],
    ...overrides,
  }
}

export function makeForm(overrides?: Partial<Block>): Block {
  return {
    id: uid(), kind: 'form', x: 120, y: 120,
    width: 480, height: 360,
    style: { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#252535', paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40 },
    visible: true, locked: false,
    children: [
      { id: uid(), kind: 'heading', x: 0, y: 0, width: 400, height: 40, text: 'Nous contacter', level: 3,
        style: { fontSize: 24, fontWeight: '700', color: '#e2e2f0' }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 50, width: 400, height: 36, text: 'Nom complet',
        style: { fontSize: 13, color: '#6b6b85', backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#252535', borderRadius: 6, paddingLeft: 12, paddingTop: 10, paddingBottom: 10 }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 100, width: 400, height: 36, text: 'Email',
        style: { fontSize: 13, color: '#6b6b85', backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#252535', borderRadius: 6, paddingLeft: 12, paddingTop: 10, paddingBottom: 10 }, visible: true, locked: false },
      { id: uid(), kind: 'text', x: 0, y: 150, width: 400, height: 80, text: 'Votre message...',
        style: { fontSize: 13, color: '#6b6b85', backgroundColor: '#0d0d12', borderWidth: 1, borderColor: '#252535', borderRadius: 6, paddingLeft: 12, paddingTop: 10 }, visible: true, locked: false },
      { id: uid(), kind: 'button', x: 0, y: 250, width: 400, height: 48, text: 'Envoyer le message',
        style: { fontSize: 15, fontWeight: '600', color: '#fff', textAlign: 'center', backgroundColor: '#7c6af7', borderRadius: 8 }, visible: true, locked: false },
    ],
    ...overrides,
  }
}

// ─── Catalogue bibliothèque ───────────────────────────────────────────────

export interface LibraryItem {
  kind: BlockKind
  label: string
  icon: string
  color: string
  category: 'primitif' | 'composant'
  factory: (x?: number, y?: number) => Block
}

export const LIBRARY: LibraryItem[] = [
  // Primitifs
  { kind: 'heading',     label: 'Titre',     icon: 'H',  color: '#7c6af7', category: 'primitif', factory: (x=120,y=120) => makeHeading({x,y}) },
  { kind: 'text',        label: 'Texte',     icon: '¶',  color: '#60a5fa', category: 'primitif', factory: (x=120,y=120) => makeText({x,y}) },
  { kind: 'button',      label: 'Bouton',    icon: '▶',  color: '#f59e0b', category: 'primitif', factory: (x=120,y=120) => makeButton({x,y}) },
  { kind: 'image',       label: 'Image',     icon: '⊡',  color: '#f472b6', category: 'primitif', factory: (x=120,y=120) => makeImage({x,y}) },
  { kind: 'divider',     label: 'Divider',   icon: '—',  color: '#6b7280', category: 'primitif', factory: (x=60,y=200)  => makeDivider({x,y}) },
  { kind: 'spacer',      label: 'Espaceur',  icon: '⊠',  color: '#4b5563', category: 'primitif', factory: (x=60,y=200)  => makeSpacer({x,y}) },
  { kind: 'card',        label: 'Card',      icon: '▣',  color: '#34d399', category: 'primitif', factory: (x=120,y=120) => makeCard({x,y}) },
  // Composants
  { kind: 'navbar',      label: 'Navbar',    icon: '≡',  color: '#22d3a0', category: 'composant', factory: (_x,y=0)   => makeNavbar(y) },
  { kind: 'hero',        label: 'Hero',      icon: '◈',  color: '#7c6af7', category: 'composant', factory: (_x,y=80)  => makeHero(y) },
  { kind: 'features',    label: 'Features',  icon: '⊞',  color: '#60a5fa', category: 'composant', factory: (_x,y=660) => makeFeatures(y) },
  { kind: 'cta',         label: 'CTA',       icon: '▶',  color: '#f59e0b', category: 'composant', factory: (_x,y=1080)=> makeCTA(y) },
  { kind: 'testimonial', label: 'Témoignage',icon: '❝',  color: '#f472b6', category: 'composant', factory: (x=120,y=120) => makeTestimonial({x,y}) },
  { kind: 'pricing',     label: 'Pricing',   icon: '◎',  color: '#34d399', category: 'composant', factory: (x=120,y=120) => makePricing({x,y}) },
  { kind: 'form',        label: 'Formulaire',icon: '▥',  color: '#e879f9', category: 'composant', factory: (x=120,y=120) => makeForm({x,y}) },
  { kind: 'footer',      label: 'Footer',    icon: '▬',  color: '#6b7280', category: 'composant', factory: (_x,y=1380)=> makeFooter(y) },
]

// Template page de démo complète
export function makeFullPageDemo(): Block[] {
  return [makeNavbar(), makeHero(), makeFeatures(), makeCTA(), makeFooter()]
}

// ─── Parse HTML → blocs ──────────────────────────────────────────────────

export function parseHTMLToBlocks(html: string): Block[] {
  if (typeof window === 'undefined') return []
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const blocks: Block[] = []
  let y = 40

  const process = (el: Element, depth = 0) => {
    if (depth > 3) return
    const tag = el.tagName?.toLowerCase()
    if (!tag || ['script','style','meta','link','head'].includes(tag)) return

    const text = (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || ''
    const src = (el as HTMLImageElement).src || el.getAttribute('src') || ''

    if (tag === 'img' || (tag === 'source' && src)) {
      const b = makeImage({ x: 60, y, width: 600, height: 280, src, alt: el.getAttribute('alt') || '' })
      blocks.push(b); y += 296; return
    }
    if (tag === 'hr') {
      blocks.push(makeDivider({ x: 60, y })); y += 24; return
    }
    if (['h1','h2','h3','h4'].includes(tag) && text) {
      const lvl = parseInt(tag[1]) as 1|2|3|4
      const fontSize = [0,48,36,26,20][lvl]
      const h = Math.ceil(text.length / 40) * fontSize * 1.3
      const b = makeHeading({ x: 60, y, width: 900, height: Math.max(h, fontSize * 1.5), text, level: lvl,
        style: { fontSize, fontWeight: '700', color: '#e2e2f0', lineHeight: 1.2 } })
      blocks.push(b); y += b.height + 16; return
    }
    if (['p','span','li'].includes(tag) && text && text.length > 3) {
      const lines = Math.ceil(text.length / 80)
      const h = lines * 24
      const b = makeText({ x: 60, y, width: 800, height: Math.max(h, 48), text,
        style: { fontSize: 16, color: '#9494b0', lineHeight: 1.6 } })
      blocks.push(b); y += b.height + 12; return
    }
    if (['button','a'].includes(tag) && text) {
      const b = makeButton({ x: 60, y, text })
      blocks.push(b); y += 64; return
    }
    if (['nav','header','footer','section','article','main','div'].includes(tag)) {
      Array.from(el.children).forEach(child => process(child, depth + 1))
    }
  }

  Array.from(doc.body.children).forEach(el => process(el))
  return blocks.slice(0, 60) // max 60 blocs
}
