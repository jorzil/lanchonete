import { NextResponse } from 'next/server'
import { pollEvents, acknowledgeEvents, isPollingBlocked } from '@/lib/integrations/ifood/client'
import { ingestOrder, syncOrderStatus } from '@/lib/integrations/ifood/mapper'
import { logIFood } from '@/lib/integrations/ifood/logs'
import { isPlacedEvent } from '@/lib/integrations/ifood/types'

export const dynamic = 'force-dynamic'

// Polling de eventos (alternativa/redundância ao webhook). Pode ser chamado por
// um cron (ex: a cada 30s) ou manualmente. Recomendado: webhook + poll de apoio.
export async function POST() {
  try {
    const events = await pollEvents()
    let imported = 0
    const handled = []
    for (const ev of events) {
      if (isPlacedEvent(ev) && ev.orderId) {
        const r = await ingestOrder(ev.orderId)
        if (r === 'failed') continue // não confirma: deixa o iFood reenviar
        if (r === 'imported') imported++
      } else if (ev.orderId) {
        await syncOrderStatus(ev)
      }
      handled.push(ev)
    }
    await acknowledgeEvents(handled)
    // 'blocked' avisa o painel para parar o loop: o app usa webhook, não polling.
    return NextResponse.json({ ok: true, events: events.length, imported, blocked: await isPollingBlocked() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    await logIFood('error', 'polling', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
