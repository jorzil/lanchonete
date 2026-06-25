import { NextRequest, NextResponse } from 'next/server'
import { sendEvolutionMessage } from '@/lib/evolution'

export async function POST(req: NextRequest) {
  try {
    const { phone, text } = await req.json()

    if (!phone || !text) {
      return NextResponse.json({ error: 'phone e text são obrigatórios' }, { status: 400 })
    }

    const result = await sendEvolutionMessage(phone, text)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
