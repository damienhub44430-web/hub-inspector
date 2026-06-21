import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const SECTION_COLORS: Record<string, string> = {
  navbar: '#22d3a0', hero: '#7c6af7', features: '#60a5fa', cta: '#f59e0b',
  testimonials: '#f472b6', pricing: '#34d399', faq: '#a78bfa', footer: '#6b7280',
  content: '#94a3b8', gallery: '#fb923c', form: '#e879f9', unknown: '#4b5563',
}

// Screenshot via Microlink → renvoie l'URL publique de l'image
async function captureScreenshot(url: string): Promise<{ imageUrl: string; width: number; height: number }> {
  // Sans embed= : Microlink renvoie du JSON avec metadata + URL du screenshot
  const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&waitForTimeout=2000&fullPage=true`
  const res = await fetch(apiUrl, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(25000),
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const raw = await res.text()
    throw new Error(`Microlink a renvoyé du non-JSON: ${contentType} — ${raw.slice(0, 100)}`)
  }

  if (!res.ok) throw new Error(`Microlink erreur ${res.status}`)

  const data = await res.json()
  if (data.status === 'fail') throw new Error(data.message || 'Microlink: échec du screenshot')

  const imgUrl: string = data?.data?.screenshot?.url
  if (!imgUrl) throw new Error('Microlink: pas d\'URL screenshot dans la réponse')

  const w: number = data?.data?.screenshot?.width || 1280
  const h: number = data?.data?.screenshot?.height || 2400

  return { imageUrl: imgUrl, width: w, height: h }
}

// Télécharge le screenshot et le convertit en base64 pour Claude Vision
async function imageUrlToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`Impossible de télécharger l'image: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType = res.headers.get('content-type') || 'image/jpeg'
  return { base64, mediaType }
}

// Analyser le screenshot avec Claude Vision
async function analyzeSections(
  imageBase64: string,
  mediaType: string,
  pageUrl: string
): Promise<Array<{ type: string; label: string; yPercent: number; heightPercent: number; content: Record<string, unknown> }>> {

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: imageBase64 },
          },
          {
            type: 'text',
            text: `Analyse ce screenshot de la page web ${pageUrl}.

Identifie chaque section distincte (navbar, hero, features, CTA, testimonials, pricing, faq, footer, etc.).

Retourne UNIQUEMENT ce JSON valide, sans markdown ni explication :
{
  "sections": [
    {
      "type": "navbar|hero|features|cta|testimonials|pricing|faq|footer|content|gallery|form|unknown",
      "label": "Nom court de la section",
      "yPercent": 0.0,
      "heightPercent": 0.12,
      "content": {
        "headline": "titre principal visible",
        "subtext": "texte secondaire visible",
        "cta": "texte du bouton CTA",
        "elements": ["éléments", "notables"]
      }
    }
  ]
}

Règles :
- yPercent = position Y de début (0=haut, 1=bas)
- heightPercent = hauteur en fraction de la page totale
- La somme des heightPercent doit être ~1.0
- Retourne UNIQUEMENT le JSON brut`,
          }
        ]
      }]
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API ${response.status}: ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  const text: string = data.content?.[0]?.text || ''

  // Extraire le JSON même s'il y a du texte autour
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude n\'a pas retourné de JSON valide')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed.sections || []
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { url } = body
  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

  let cleanUrl = url.trim()
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`

  try {
    // 1. Screenshot via Microlink
    const { imageUrl, width, height } = await captureScreenshot(cleanUrl)

    // 2. Télécharger l'image et la convertir en base64
    const { base64, mediaType } = await imageUrlToBase64(imageUrl)

    // 3. Analyse Claude Vision
    let rawSections: Array<{ type: string; label: string; yPercent: number; heightPercent: number; content: Record<string, unknown> }> = []
    try {
      rawSections = await analyzeSections(base64, mediaType, cleanUrl)
    } catch (e) {
      console.error('Claude Vision fallback:', e)
      // Fallback générique
      rawSections = [
        { type: 'navbar',  label: 'Navigation',       yPercent: 0,    heightPercent: 0.07, content: {} },
        { type: 'hero',    label: 'Hero',              yPercent: 0.07, heightPercent: 0.28, content: {} },
        { type: 'features',label: 'Fonctionnalités',   yPercent: 0.35, heightPercent: 0.25, content: {} },
        { type: 'cta',     label: 'Call to Action',    yPercent: 0.60, heightPercent: 0.15, content: {} },
        { type: 'footer',  label: 'Footer',            yPercent: 0.75, heightPercent: 0.25, content: {} },
      ]
    }

    // 4. Construire les sections avec positions canvas
    const CANVAS_W = 900
    const scale = CANVAS_W / width

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
        x: 0,
        y: Math.round(srcY * scale),
        width: CANVAS_W,
        height: Math.max(40, Math.round(srcH * scale)),
        imageUrl,          // URL publique Microlink
        content: s.content || {},
        color: SECTION_COLORS[s.type] || SECTION_COLORS.unknown,
        locked: false,
        visible: true,
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
    console.error('inspect error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
