import { NextRequest, NextResponse } from 'next/server'
import { getConfig, saveConfig, toPublic } from '@/lib/integrations/ifood/config'
import { logIFood } from '@/lib/integrations/ifood/logs'

export const dynamic = 'force-dynamic'

// Nunca devolve secret nem token ao front.
export async function GET() {
  const cfg = await getConfig()
  return NextResponse.json(toPublic(cfg))
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const cfg = await saveConfig({
    clientId: body.clientId,
    clientSecret: body.clientSecret, // se vazio, mantém o atual (ver saveConfig)
    merchantId: body.merchantId,
    environment: body.environment === 'production' ? 'production' : 'sandbox',
    webhookUrl: body.webhookUrl,
  })
  await logIFood('info', 'config', 'Configuração atualizada')
  return NextResponse.json(toPublic(cfg))
}
