import { NextRequest, NextResponse } from 'next/server'

const sessions = new Map<string, { data: unknown; createdAt: number }>()
function cleanup() { const now = Date.now(); for (const [k, v] of sessions) if (now - v.createdAt > 7200000) sessions.delete(k) }

export async function POST(req: NextRequest) {
  cleanup()
  const body = await req.json()
  if (!body.blocks && !body.sections) return NextResponse.json({ error: 'blocks requis' }, { status: 400 })
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  sessions.set(id, { data: body, createdAt: Date.now() })
  return NextResponse.json({ sessionId: id, sessionUrl: `/?session=${id}` })
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ sessions: sessions.size })
  const s = sessions.get(id)
  if (!s) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
  return NextResponse.json(s.data)
}
