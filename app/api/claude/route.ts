import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, section, pageUrl, mode } = await req.json()

  // Construire le system prompt selon le mode
  const systemPrompts: Record<string, string> = {
    improve: `Tu es un expert UX/UI qui aide à améliorer des sections de pages web.
Tu as accès à un screenshot de la section concernée.
Tu analyses et proposes des améliorations concrètes : copywriting, hiérarchie visuelle, CTA, conversion.
Réponds en français, de manière concise et actionnable. Max 200 mots.`,

    copy: `Tu es un expert en copywriting et conversion web.
Tu réécris et améliores les textes de sections de pages web.
Pour chaque suggestion, donne le texte exact à utiliser.
Réponds en français. Max 200 mots.`,

    layout: `Tu es un expert en design et layout web.
Tu analyses la structure visuelle d'une section et proposes des réorganisations.
Sois précis : "déplacer X avant Y", "agrandir le CTA", etc.
Réponds en français. Max 200 mots.`,

    chat: `Tu es un assistant UX/UI expert qui aide à retravailler des pages web.
Tu as le contexte d'une section spécifique de la page.
Réponds de manière naturelle et utile en français.`,
  }

  const system = systemPrompts[mode || 'chat']

  // Contexte de la section sélectionnée
  const sectionContext = section ? `
Section analysée : "${section.label}" (type: ${section.type})
Page : ${pageUrl || 'inconnue'}
Contenu détecté : ${JSON.stringify(section.content || {})}
` : `Page : ${pageUrl || 'inconnue'}`

  // Construire les messages avec contexte
  const anthropicMessages = messages.map((m: { role: string; content: string }, i: number) => {
    // Injecter le contexte dans le premier message
    if (i === 0 && section?.imageUrl) {
      return {
        role: m.role,
        content: [
          {
            type: 'image',
            source: { type: 'url', url: section.imageUrl.split('#')[0] }, // URL sans fragment
          },
          {
            type: 'text',
            text: `${sectionContext}\n\nDemande : ${m.content}`,
          }
        ]
      }
    }
    return { role: m.role, content: m.content }
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system,
      messages: anthropicMessages,
    })
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return NextResponse.json({ text })
}
