import { NextRequest, NextResponse } from 'next/server'
import { ingestOrder, syncOrderStatus } from '@/lib/integrations/ifood/mapper'
import { acknowledgeEvents } from '@/lib/integrations/ifood/client'
import { getConfig, patchRuntime } from '@/lib/integrations/ifood/config'
import { logIFood } from '@/lib/integrations/ifood/logs'
import { isKeepAlive, isPlacedEvent, keepAliveEvents, normalizeEvents, unwrapEvents, type IFoodEvent } from '@/lib/integrations/ifood/types'

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

  // KEEPALIVE é o ping de saúde do iFood (a cada ~30s). Não gera log — seria
  // ruído —, mas PRECISA ser confirmado: é o ACK do keepalive que registra a
  // presença da integração com origem WEBHOOK no Firefly. Sem ele a
  // homologação reprova com "No heartbeat found with source 'WEBHOOK'".
  if (keepAlives > 0 && raw.length === keepAlives) {
    try { await acknowledgeEvents(keepAliveEvents(raw)) } catch {}
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
  let failed = 0
  for (const ev of events) {
    if (isPlacedEvent(ev)) {
      // Só confirmamos o que realmente entrou. Confirmar um pedido que falhou
      // faz o iFood parar de reenviá-lo — foi assim que o pedido de 14:58 se
      // perdeu e acabou cancelado por "não foi enviado para a Loja".
      if ((await ingestOrder(ev.orderId)) === 'failed') { failed++; continue }
    } else if (isKeepAlive(ev)) {
      handled.push(ev)
      continue
    } else if ((await syncOrderStatus(ev)) === 'unmapped') {
      await logIFood('info', 'webhook', `Evento ${ev.fullCode ?? ev.code} sem efeito no painel (pedido ${ev.orderId})`)
    }
    handled.push(ev)
  }

  // Confirma o recebimento dos eventos para o iFood não reenviar.
  try { await acknowledgeEvents(handled) } catch {}

  // Sempre 200: para o iFood o que importa é a ENTREGA do webhook. Responder
  // 500 marca a entrega como falha na auditoria (Firefly Audit) e reprova a
  // homologação. O reenvio do que falhou vem do ACK — só confirmamos o que
  // entrou, então o evento não confirmado é reenviado de qualquer forma.
  return NextResponse.json({ ok: true, processed: handled.length, failed })
}
