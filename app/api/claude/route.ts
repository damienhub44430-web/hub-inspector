import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, block, mode } = await req.json()

  const systems: Record<string, string> = {
    improve: 'Expert UX/UI. Analyse le bloc et propose des améliorations concrètes pour maximiser impact et conversion. Français, max 180 mots.',
    copy: 'Expert copywriting web. Réécris les textes pour être plus percutants. Donne le texte exact à utiliser. Français, max 180 mots.',
    layout: 'Expert design. Propose des réorganisations visuelles précises et actionnables. Français, max 180 mots.',
    chat: 'Assistant UX/UI expert. Aide à améliorer des éléments de pages web. Concis, actionnable, en français.',
  }

  const ctx = block
    ? `Bloc : <${block.tag || block.kind}> | Type: ${block.kind} | Texte: "${block.text?.slice(0, 100) || ''}" | Dimensions: ${block.width}×${block.height}px`
    : ''

  const msgs = messages.map((m: { role: string; content: string }, i: number) => ({
    role: m.role,
    content: i === 0 && ctx ? `${ctx}\n\n${m.content}` : m.content,
  }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY || '', 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 800, system: systems[mode || 'chat'], messages: msgs }),
    signal: AbortSignal.timeout(25000),
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ text: data.content?.[0]?.text || '' })
}
