import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const SECTION_COLORS: Record<string, string> = {
  navbar: '#22d3a0',
  hero: '#7c6af7',
  features: '#60a5fa',
  cta: '#f59e0b',
  testimonials: '#f472b6',
  pricing: '#34d399',
  faq: '#a78bfa',
  footer: '#6b7280',
  content: '#94a3b8',
  gallery: '#fb923c',
  form: '#e879f9',
  unknown: '#4b5563',
}

// Screenshot via Microlink (renvoie une URL publique)
async function captureScreenshot(url: string): Promise<{ imageUrl: string; width: number; height: number }> {
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&waitForTimeout=2000&fullPage=true`
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error('Microlink screenshot failed')
  const data = await res.json()
  const imgUrl = data?.data?.screenshot?.url
  if (!imgUrl) throw new Error('Pas de screenshot disponible')

  // Récupérer dimensions depuis les metadata
  const w = data?.data?.screenshot?.width || 1280
  const h = data?.data?.screenshot?.height || 3000

  return { imageUrl: imgUrl, width: w, height: h }
}

// Analyser le screenshot avec Claude Vision pour détecter les sections
async function analyzeSections(screenshotUrl: string, pageUrl: string): Promise<Array<{
  type: string; label: string; yPercent: number; heightPercent: number; content: Record<string, unknown>
}>> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: screenshotUrl },
          },
          {
            type: 'text',
            text: `Analyse ce screenshot de la page web ${pageUrl}.

Identifie chaque section distincte de la page (navbar, hero, features, CTA, témoignages, pricing, FAQ, footer, etc.).

Pour chaque section, retourne UNIQUEMENT un JSON valide (rien d'autre) dans ce format exact :
{
  "sections": [
    {
      "type": "navbar|hero|features|cta|testimonials|pricing|faq|footer|content|gallery|form|unknown",
      "label": "Nom humain de la section",
      "yPercent": 0.0,
      "heightPercent": 0.12,
      "content": {
        "headline": "texte du titre principal si visible",
        "subtext": "texte secondaire si visible",
        "cta": "texte du bouton CTA si visible",
        "elements": ["liste", "d'éléments", "notables"]
      }
    }
  ]
}

yPercent = position Y de début de la section (0 = haut, 1 = bas de page)
heightPercent = hauteur de la section en fraction de la page totale
La somme de tous les heightPercent doit faire ~1.0

Retourne UNIQUEMENT le JSON, sans markdown, sans explication.`,
          }
        ]
      }]
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${err}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  // Parser le JSON retourné par Claude
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)
  return parsed.sections || []
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

  let cleanUrl = url.trim()
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`

  try {
    // 1. Screenshot
    const { imageUrl, width, height } = await captureScreenshot(cleanUrl)

    // 2. Analyse Claude Vision
    let rawSections: Array<{ type: string; label: string; yPercent: number; heightPercent: number; content: Record<string, unknown> }> = []
    try {
      rawSections = await analyzeSections(imageUrl, cleanUrl)
    } catch {
      // Fallback si Claude échoue : sections génériques
      rawSections = [
        { type: 'navbar', label: 'Navigation', yPercent: 0, heightPercent: 0.07, content: {} },
        { type: 'hero', label: 'Hero', yPercent: 0.07, heightPercent: 0.3, content: {} },
        { type: 'content', label: 'Contenu principal', yPercent: 0.37, heightPercent: 0.4, content: {} },
        { type: 'footer', label: 'Footer', yPercent: 0.77, heightPercent: 0.23, content: {} },
      ]
    }

    // 3. Construire les sections avec positions canvas
    const CANVAS_W = 900 // largeur d'affichage dans le canvas
    const scale = CANVAS_W / width
    const canvasHeight = height * scale

    const sections = rawSections.map((s, i) => {
      const srcY = Math.round(s.yPercent * height)
      const srcH = Math.round(s.heightPercent * height)

      return {
        id: `section-${i}`,
        type: s.type,
        label: s.label,
        srcY,
        srcHeight: srcH,
        srcWidth: width,
        // Position initiale : empilées verticalement
        x: 0,
        y: Math.round(srcY * scale),
        width: CANVAS_W,
        height: Math.round(srcH * scale),
        imageUrl: `${imageUrl}#section-${i}`, // même image, on clippe via CSS
        content: s.content || {},
        color: SECTION_COLORS[s.type] || SECTION_COLORS.unknown,
        locked: false,
        visible: true,
        // On stocke aussi les ratios pour le clipping
        clipY: s.yPercent,
        clipH: s.heightPercent,
      }
    })

    return NextResponse.json({
      url: cleanUrl,
      fullScreenshot: imageUrl,
      pageWidth: width,
      pageHeight: height,
      sections,
      analyzedAt: new Date().toISOString(),
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
