import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, section, block, pageUrl, mode } = await req.json()

  const systems: Record<string, string> = {
    improve: 'Tu es un expert UX/UI. Analyse la section/bloc et propose des améliorations concrètes pour maximiser la conversion. Réponds en français, max 200 mots.',
    copy: 'Tu es expert copywriting web. Réécris les textes pour être plus percutants et convaincants. Donne le texte exact à utiliser. Réponds en français, max 200 mots.',
    layout: 'Tu es expert design web. Propose des réorganisations visuelles précises : "déplacer X avant Y", "agrandir le CTA", etc. Réponds en français, max 200 mots.',
    chat: 'Tu es un assistant UX/UI expert. Tu aides à retravailler des éléments de pages web. Réponds en français de manière concise et actionnable.',
  }

  const context = block
    ? `Élément sélectionné : <${block.tag}> (type: ${block.type})\nTexte actuel : "${block.editedText || block.text}"\nDimensions : ${block.width}×${block.height}px\nSection parente : ${section?.label || 'inconnue'}\nPage : ${pageUrl || 'inconnue'}`
    : section
    ? `Section : "${section.label}" (type: ${section.type})\nNombre de blocs : ${section.blocks?.length || 0}\nPage : ${pageUrl || 'inconnue'}`
    : `Page : ${pageUrl || 'inconnue'}`

  const anthropicMessages = messages.map((m: { role: string; content: string }, i: number) => ({
    role: m.role,
    content: i === 0 ? `${context}\n\n${m.content}` : m.content,
  }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systems[mode || 'chat'],
      messages: anthropicMessages,
    }),
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ text: data.content?.[0]?.text || '' })
}
