import { NextRequest, NextResponse } from 'next/server'
import { ingestOrder } from '@/lib/integrations/ifood/mapper'
import { acknowledgeEvents } from '@/lib/integrations/ifood/client'
import { getConfig } from '@/lib/integrations/ifood/config'
import { logIFood } from '@/lib/integrations/ifood/logs'
import { isPlacedEvent, type IFoodEvent } from '@/lib/integrations/ifood/types'

export const dynamic = 'force-dynamic'

// Validação simples por assinatura/segredo no header (configurável).
function isAuthentic(req: NextRequest, merchantSecret: string): boolean {
  // O iFood envia x-ifood-signature; sem o segredo público de verificação,
  // validamos um token compartilhado opcional (IFOOD_WEBHOOK_TOKEN).
  const token = process.env.IFOOD_WEBHOOK_TOKEN
  if (!token) return true // sem token configurado, aceita (recomendado configurar)
  const provided = req.headers.get('x-webhook-token') || req.nextUrl.searchParams.get('token')
  return provided === token
}

export async function POST(req: NextRequest) {
  const cfg = await getConfig()
  if (!isAuthentic(req, cfg.clientSecret)) {
    await logIFood('warn', 'webhook', 'Webhook rejeitado (token inválido)')
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let payload: unknown
  try { payload = await req.json() } catch { payload = null }

  // O iFood pode enviar um evento único ou um array.
  const events: IFoodEvent[] = Array.isArray(payload) ? payload : payload ? [payload as IFoodEvent] : []
  await logIFood('info', 'webhook', `Webhook recebido (${events.length} evento(s))`)

  const handled: IFoodEvent[] = []
  for (const ev of events) {
    if (!ev?.orderId) continue
    if (isPlacedEvent(ev)) {
      await ingestOrder(ev.orderId)
    } else {
      await logIFood('info', 'webhook', `Evento ${ev.fullCode ?? ev.code} ignorado (pedido ${ev.orderId})`)
    }
    handled.push(ev)
  }

  // Confirma o recebimento dos eventos para o iFood não reenviar.
  try { await acknowledgeEvents(handled) } catch {}

  return NextResponse.json({ ok: true, processed: handled.length })
}
