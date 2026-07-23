import { NextResponse } from 'next/server'
import { pollEvents, acknowledgeEvents } from '@/lib/integrations/ifood/client'
import { ingestOrder } from '@/lib/integrations/ifood/mapper'
import { logIFood } from '@/lib/integrations/ifood/logs'
import { isPlacedEvent } from '@/lib/integrations/ifood/types'

export const dynamic = 'force-dynamic'

// Polling de eventos (alternativa/redundância ao webhook). Pode ser chamado por
// um cron (ex: a cada 30s) ou manualmente. Recomendado: webhook + poll de apoio.
export async function POST() {
  try {
    const events = await pollEvents()
    let imported = 0
    for (const ev of events) {
      if (isPlacedEvent(ev) && ev.orderId) {
        if (await ingestOrder(ev.orderId)) imported++
      }
    }
    await acknowledgeEvents(events)
    return NextResponse.json({ ok: true, events: events.length, imported })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    await logIFood('error', 'polling', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
