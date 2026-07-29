import { NextRequest, NextResponse } from 'next/server'
import { ingestOrder } from '@/lib/integrations/ifood/mapper'
import { acknowledgeEvents } from '@/lib/integrations/ifood/client'
import { getConfig, patchRuntime } from '@/lib/integrations/ifood/config'
import { logIFood } from '@/lib/integrations/ifood/logs'
import { isKeepAlive, isPlacedEvent, normalizeEvents, unwrapEvents, type IFoodEvent } from '@/lib/integrations/ifood/types'

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

  // O iFood pode enviar um evento único, um array ou um objeto embrulhado.
  const raw = unwrapEvents(payload)
  const events = normalizeEvents(payload)
  const keepAlives = raw.filter(isKeepAlive).length

  // KEEPALIVE é só o ping de saúde do iFood (a cada ~30s). Registrar cada um
  // tornaria o log inútil — basta marcar que a integração respondeu.
  if (keepAlives > 0 && raw.length === keepAlives) {
    await patchRuntime({ lastSyncAt: new Date().toISOString() })
    return NextResponse.json({ ok: true, keepAlive: true })
  }

  // O corpo cru vai no detalhe do log: sem ele é impossível diagnosticar um
  // evento que o iFood entrega num formato diferente do esperado.
  await logIFood('info', 'webhook', `Webhook recebido (${events.length} evento(s))`, payload)

  if (raw.length > keepAlives && events.length === 0) {
    await logIFood('error', 'webhook', 'Evento recebido sem orderId reconhecível — pedido não importado', payload)
  }

  const handled: IFoodEvent[] = []
  for (const ev of events) {
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
