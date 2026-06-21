import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const SECTION_COLORS: Record<string, string> = {
  navbar: '#22d3a0', hero: '#7c6af7', features: '#60a5fa', cta: '#f59e0b',
  testimonials: '#f472b6', pricing: '#34d399', faq: '#a78bfa', footer: '#6b7280',
  content: '#94a3b8', gallery: '#fb923c', form: '#e879f9', unknown: '#4b5563',
}

// ─── Script injecté dans le navigateur pour extraire les éléments ────────────
const DOM_EXTRACT_SCRIPT = `
(function() {
  const SELECTORS = [
    'nav', 'header', 'footer',
    'h1','h2','h3','h4',
    'p','li','blockquote',
    'button','a[href]',
    '[class*="cta"]','[class*="btn"]','[class*="hero"]',
    '[class*="card"]','[class*="feature"]','[class*="pricing"]',
    'img[alt]','svg',
    'section','article','main > div',
    'form','input','label',
  ]

  const TYPE_MAP = {
    H1:'heading', H2:'heading', H3:'heading', H4:'heading',
    P:'text', LI:'text', BLOCKQUOTE:'text',
    BUTTON:'cta', A:'cta',
    NAV:'navbar', HEADER:'navbar', FOOTER:'footer',
    SECTION:'section', ARTICLE:'section',
    IMG:'image', SVG:'image',
    FORM:'form', INPUT:'form', LABEL:'form',
  }

  const seen = new Set()
  const results = []
  const pageH = Math.max(document.body.scrollHeight, window.innerHeight)
  const pageW = document.documentElement.scrollWidth

  SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (seen.has(el)) return
      seen.add(el)

      const r = el.getBoundingClientRect()
      const scrollY = window.scrollY || 0
      const absTop = r.top + scrollY
      const absLeft = r.left

      // Filtrer les éléments invisibles ou trop petits
      if (r.width < 10 || r.height < 4) return
      if (absTop < 0 || absLeft < -10) return

      const tag = el.tagName
      const type = TYPE_MAP[tag] || 'unknown'

      // Texte lisible
      let text = ''
      if (['H1','H2','H3','H4','P','LI','BUTTON','A','LABEL','BLOCKQUOTE'].includes(tag)) {
        text = (el.innerText || el.textContent || '').trim().slice(0, 200)
      }
      if (tag === 'IMG') text = el.getAttribute('alt') || ''

      // Classes CSS utiles (pour détecter le type sémantique)
      const classes = el.className && typeof el.className === 'string'
        ? el.className.toLowerCase().slice(0, 100)
        : ''

      // Styles computed
      const style = window.getComputedStyle(el)
      const bgColor = style.backgroundColor
      const color = style.color
      const fontSize = parseFloat(style.fontSize) || 16
      const fontWeight = style.fontWeight

      if (!text && !['section','article','nav','header','footer','div'].includes(tag.toLowerCase())) return

      results.push({
        tag,
        type,
        text,
        classes,
        x: Math.round(absLeft),
        y: Math.round(absTop),
        w: Math.round(r.width),
        h: Math.round(r.height),
        styles: { bgColor, color, fontSize, fontWeight },
      })
    })
  })

  return { elements: results, pageWidth: pageW, pageHeight: pageH }
})()
`

// ─── Extraction via Browserless (cloud) ─────────────────────────────────────
async function extractViaBrowserless(url: string): Promise<{
  elements: DomElement[]
  pageWidth: number
  pageHeight: number
  screenshot: string
}> {
  const token = process.env.BROWSERLESS_TOKEN
  const wsUrl = token
    ? `wss://chrome.browserless.io?token=${token}`
    : 'wss://chrome.browserless.io?token=free'

  // API REST /content de Browserless pour exécuter du JS
  const apiBase = token
    ? `https://chrome.browserless.io`
    : `https://chrome.browserless.io`

  // Screenshot
  const screenshotRes = await fetch(`${apiBase}/screenshot?token=${token || 'free'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      options: { fullPage: true, type: 'jpeg', quality: 85 },
      waitFor: 1500,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!screenshotRes.ok) throw new Error(`Browserless screenshot ${screenshotRes.status}`)
  const screenshotBuffer = await screenshotRes.arrayBuffer()
  const screenshotB64 = Buffer.from(screenshotBuffer).toString('base64')

  // DOM extraction via /function
  const fnRes = await fetch(`${apiBase}/function?token=${token || 'free'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `module.exports = async ({ page }) => {
        await page.goto(${JSON.stringify(url)}, { waitUntil: 'networkidle0', timeout: 20000 });
        await page.waitForTimeout(1000);
        const result = await page.evaluate(${JSON.stringify(DOM_EXTRACT_SCRIPT)});
        return { data: result };
      }`,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!fnRes.ok) {
    const err = await fnRes.text()
    throw new Error(`Browserless function ${fnRes.status}: ${err.slice(0, 200)}`)
  }

  const fnData = await fnRes.json()
  const { elements, pageWidth, pageHeight } = fnData?.data || { elements: [], pageWidth: 1280, pageHeight: 3000 }

  return { elements, pageWidth, pageHeight, screenshot: `data:image/jpeg;base64,${screenshotB64}` }
}

// ─── Fallback : Microlink screenshot + Claude Vision pour les éléments ──────
async function extractViaFallback(url: string): Promise<{
  elements: DomElement[]
  pageWidth: number
  pageHeight: number
  screenshot: string
}> {
  // Screenshot Microlink
  const mlRes = await fetch(
    `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&waitForTimeout=2000&fullPage=true`,
    { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25000) }
  )
  if (!mlRes.ok) throw new Error(`Microlink ${mlRes.status}`)
  const mlData = await mlRes.json()
  if (mlData.status === 'fail') throw new Error(mlData.message || 'Microlink failed')

  const imgUrl: string = mlData?.data?.screenshot?.url
  if (!imgUrl) throw new Error('Pas de screenshot Microlink')

  const pageWidth: number = mlData?.data?.screenshot?.width || 1280
  const pageHeight: number = mlData?.data?.screenshot?.height || 2400

  // Télécharger l'image en base64
  const imgRes = await fetch(imgUrl, { signal: AbortSignal.timeout(15000) })
  const imgBuf = await imgRes.arrayBuffer()
  const imgB64 = Buffer.from(imgBuf).toString('base64')
  const mediaType = imgRes.headers.get('content-type') || 'image/jpeg'
  const screenshotDataUrl = `data:${mediaType};base64,${imgB64}`

  // Claude Vision pour détecter les blocs
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: imgB64 } },
          {
            type: 'text',
            text: `Analyse ce screenshot (${pageWidth}x${pageHeight}px) et identifie TOUS les éléments individuels : titres, paragraphes, boutons CTA, liens, images, cartes, icônes, formulaires, etc.

Pour chaque élément retourne ce JSON (UNIQUEMENT le JSON, sans markdown) :
{
  "elements": [
    {
      "tag": "H1|H2|H3|P|BUTTON|A|IMG|NAV|SECTION|FOOTER|DIV",
      "type": "heading|text|cta|navbar|section|footer|image|form|unknown",
      "text": "contenu textuel visible",
      "x": 80,
      "y": 120,
      "w": 600,
      "h": 48,
      "styles": { "fontSize": 32, "fontWeight": "700", "color": "rgb(255,255,255)", "bgColor": "transparent" }
    }
  ],
  "pageWidth": ${pageWidth},
  "pageHeight": ${pageHeight}
}

Règles :
- x,y = position en pixels depuis coin haut-gauche de la PAGE ENTIÈRE
- w,h = dimensions en pixels
- Sois précis sur les coordonnées — c'est critique pour le positionnement
- Inclus TOUS les éléments visibles, même petits
- Retourne UNIQUEMENT le JSON brut`
          }
        ]
      }]
    }),
    signal: AbortSignal.timeout(40000),
  })

  if (!claudeRes.ok) throw new Error(`Claude Vision ${claudeRes.status}`)
  const claudeData = await claudeRes.json()
  const text: string = claudeData.content?.[0]?.text || ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude Vision: pas de JSON')
  const parsed = JSON.parse(jsonMatch[0])

  return {
    elements: parsed.elements || [],
    pageWidth: parsed.pageWidth || pageWidth,
    pageHeight: parsed.pageHeight || pageHeight,
    screenshot: screenshotDataUrl,
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface DomElement {
  tag: string
  type: string
  text: string
  classes?: string
  x: number; y: number; w: number; h: number
  styles?: { bgColor?: string; color?: string; fontSize?: number; fontWeight?: string }
}

// ─── Regrouper les éléments en sections ──────────────────────────────────────
function groupIntoSections(elements: DomElement[], pageHeight: number) {
  // Trier par Y
  const sorted = [...elements].sort((a, b) => a.y - b.y)

  // Identifier les grandes sections (nav, header, footer, section)
  const sectionEls = sorted.filter(e =>
    ['navbar','section','footer'].includes(e.type) ||
    ['NAV','HEADER','FOOTER','SECTION','ARTICLE','MAIN'].includes(e.tag)
  )

  // Si pas de sections détectées, créer des bandes horizontales automatiques
  const bands = sectionEls.length > 1 ? sectionEls : [
    { type: 'navbar', tag: 'NAV', y: 0, h: Math.round(pageHeight * 0.07), text: '', x: 0, w: 1280 },
    { type: 'hero',   tag: 'SECTION', y: Math.round(pageHeight * 0.07), h: Math.round(pageHeight * 0.3), text: '', x: 0, w: 1280 },
    { type: 'content',tag: 'SECTION', y: Math.round(pageHeight * 0.37), h: Math.round(pageHeight * 0.38), text: '', x: 0, w: 1280 },
    { type: 'footer', tag: 'FOOTER', y: Math.round(pageHeight * 0.75), h: Math.round(pageHeight * 0.25), text: '', x: 0, w: 1280 },
  ]

  return bands.map((band, i) => ({
    id: `section-${i}`,
    type: band.type || 'content',
    label: { navbar:'Navigation', hero:'Hero', features:'Fonctionnalités', cta:'Call to Action',
             content:'Contenu', footer:'Footer', section:'Section', unknown:'Section' }[band.type] || `Section ${i+1}`,
    y: band.y,
    height: band.h,
    color: SECTION_COLORS[band.type] || SECTION_COLORS.unknown,
    // Éléments fils appartenant à cette section
    children: sorted.filter(el =>
      el.y >= band.y && el.y < band.y + band.h &&
      !['navbar','section','footer'].includes(el.type) &&
      !['NAV','HEADER','FOOTER','SECTION','ARTICLE','MAIN'].includes(el.tag)
    )
  }))
}

// ─── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url, source } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL requise' }, { status: 400 })

  let cleanUrl = url.trim()
  if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`

  try {
    let extracted: { elements: DomElement[]; pageWidth: number; pageHeight: number; screenshot: string }
    let extractionSource = source || 'fallback'

    // Essayer Browserless si token dispo
    if (process.env.BROWSERLESS_TOKEN) {
      try {
        extracted = await extractViaBrowserless(cleanUrl)
        extractionSource = 'browserless'
      } catch (e) {
        console.warn('Browserless failed, fallback:', e)
        extracted = await extractViaFallback(cleanUrl)
        extractionSource = 'fallback'
      }
    } else {
      extracted = await extractViaFallback(cleanUrl)
      extractionSource = 'fallback'
    }

    const { elements, pageWidth, pageHeight, screenshot } = extracted

    // Regrouper en sections
    const sections = groupIntoSections(elements, pageHeight)

    // Construire les blocs canvas
    const CANVAS_W = 960
    const scale = CANVAS_W / pageWidth

    const canvasSections = sections.map((sec, si) => ({
      id: sec.id,
      type: sec.type,
      label: sec.label,
      color: sec.color,
      // Position canvas
      x: 0,
      y: Math.round(sec.y * scale),
      width: CANVAS_W,
      height: Math.max(40, Math.round(sec.height * scale)),
      // Coordonnées source
      srcY: sec.y,
      srcHeight: sec.height,
      srcWidth: pageWidth,
      clipY: sec.y / pageHeight,
      clipH: sec.height / pageHeight,
      imageUrl: screenshot,
      locked: false,
      visible: true,
      content: {},
      // Blocs enfants (vrais éléments DOM)
      blocks: sec.children.map((el, bi) => ({
        id: `block-${si}-${bi}`,
        tag: el.tag,
        type: el.type,
        text: el.text,
        // Position relative à la section, scalée
        x: Math.round(el.x * scale),
        y: Math.round((el.y - sec.y) * scale),
        width: Math.round(el.w * scale),
        height: Math.round(el.h * scale),
        // Position absolue source
        srcX: el.x,
        srcY: el.y,
        srcWidth: el.w,
        srcHeight: el.h,
        styles: el.styles || {},
        visible: true,
      }))
    }))

    return NextResponse.json({
      url: cleanUrl,
      fullScreenshot: screenshot,
      pageWidth,
      pageHeight,
      sections: canvasSections,
      extractionSource,
      analyzedAt: new Date().toISOString(),
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('inspect error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
