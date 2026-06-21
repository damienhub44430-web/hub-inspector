import { NextRequest, NextResponse } from 'next/server'
import type { Block, BlockStyle, DesignTokens } from '@/lib/types'

function styleToCSS(s: BlockStyle): string {
  const props: string[] = []
  if (s.fontSize) props.push(`font-size:${s.fontSize}px`)
  if (s.fontWeight) props.push(`font-weight:${s.fontWeight}`)
  if (s.color) props.push(`color:${s.color}`)
  if (s.textAlign) props.push(`text-align:${s.textAlign}`)
  if (s.lineHeight) props.push(`line-height:${s.lineHeight}`)
  if (s.fontFamily) props.push(`font-family:${s.fontFamily}`)
  if (s.backgroundColor) props.push(`background-color:${s.backgroundColor}`)
  if (s.borderRadius) props.push(`border-radius:${s.borderRadius}px`)
  if (s.borderWidth) props.push(`border:${s.borderWidth}px solid ${s.borderColor || '#000'}`)
  if (s.paddingTop) props.push(`padding-top:${s.paddingTop}px`)
  if (s.paddingRight) props.push(`padding-right:${s.paddingRight}px`)
  if (s.paddingBottom) props.push(`padding-bottom:${s.paddingBottom}px`)
  if (s.paddingLeft) props.push(`padding-left:${s.paddingLeft}px`)
  if (s.opacity !== undefined) props.push(`opacity:${s.opacity}`)
  if (s.boxShadow) props.push(`box-shadow:${s.boxShadow}`)
  return props.join(';')
}

function blockToHTML(b: Block, offsetX = 0, offsetY = 0): string {
  if (!b.visible) return ''
  const css = styleToCSS(b.style)
  const pos = `position:absolute;left:${b.x - offsetX}px;top:${b.y - offsetY}px;width:${b.width}px;height:${b.height}px;`

  if (b.kind === 'image') return `<img src="${b.src || ''}" alt="${b.alt || ''}" style="${pos}${css};object-fit:cover;" />`
  if (b.kind === 'divider') return `<hr style="${pos}${css};border:none;background-color:${b.style.backgroundColor || '#ccc'};" />`
  if (b.kind === 'spacer') return `<div style="${pos}"></div>`

  if (b.children?.length) {
    const children = b.children.map(c => blockToHTML(c)).join('\n')
    return `<div style="${pos}${css};position:relative;">${children}</div>`
  }

  const text = (b.text || '').replace(/\n/g, '<br>')
  const tag = b.kind === 'button' ? 'a' : ['heading'].includes(b.kind) ? `h${b.level || 1}` : 'p'
  const href = b.kind === 'button' && b.href ? ` href="${b.href}"` : ''
  return `<${tag}${href} style="${pos}${css}">${text}</${tag}>`
}

export async function POST(req: NextRequest) {
  const { blocks, projectName, tokens, background } = await req.json() as
    { blocks: Block[]; projectName?: string; tokens?: DesignTokens; background?: string }

  if (!blocks?.length) return NextResponse.json({ html: '<html><body></body></html>' })

  const tokenVars = (tokens?.colors || []).map(c => `    --tok-${c.id}: ${c.value};`).join('\n')

  // Calculer les bounds
  const allX = blocks.map((b: Block) => b.x)
  const allY = blocks.map((b: Block) => b.y)
  const allW = blocks.map((b: Block) => b.x + b.width)
  const allH = blocks.map((b: Block) => b.y + b.height)
  const minX = Math.min(...allX), minY = Math.min(...allY)
  const maxW = Math.max(...allW), maxH = Math.max(...allH)

  const body = blocks.filter((b: Block) => b.visible !== false).map((b: Block) => blockToHTML(b, minX, minY)).join('\n  ')

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || 'Hub Inspector Export'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
${tokenVars}
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; background: ${background || '#ffffff'}; }
    .canvas { position: relative; width: ${maxW - minX}px; min-height: ${maxH - minY}px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="canvas">
  ${body}
  </div>
</body>
</html>`

  return NextResponse.json({ html })
}
