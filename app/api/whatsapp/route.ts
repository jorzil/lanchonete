import { NextRequest, NextResponse } from 'next/server'
import { sendEvolutionMessage, isEvolutionConfigured } from '@/lib/evolution'

export const dynamic = 'force-dynamic'

// GET: informa ao front se o envio automático está configurado
export async function GET() {
  return NextResponse.json({ configured: isEvolutionConfigured() })
}

export async function POST(req: NextRequest) {
  try {
    const { phone, text } = await req.json()

    console.log('[whatsapp] phone:', phone, '| text length:', text?.length)
    console.log('[whatsapp] env configured:', !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE_NAME))

    if (!phone || !text) {
      return NextResponse.json({ error: 'phone e text são obrigatórios' }, { status: 400 })
    }

    const result = await sendEvolutionMessage(phone, text)

    console.log('[whatsapp] result:', JSON.stringify(result))

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[whatsapp] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
