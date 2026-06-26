import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { sendEvolutionMessage } from '@/lib/evolution'

const STORE_ORIGIN = 'https://www.maissub.com.br'

function buildMessage(status: string, orderNumber: string): string {
  const track = `\n\n🔍 *Acompanhe seu pedido:*\n${STORE_ORIGIN}/acompanhar/${orderNumber}`
  const msgs: Record<string, string> = {
    aceito:       `✅ *Seu pedido #${orderNumber} foi aceito!* Entrou na fila de preparo. Em breve começamos a preparar. 🥪${track}`,
    em_preparo:   `👨‍🍳 *Seu pedido #${orderNumber} está sendo preparado!* Caprichamos em cada detalhe. Em breve fica pronto!${track}`,
    pronto:       `✨ *Seu pedido #${orderNumber} ficou pronto!* Será enviado em instantes. 🚀${track}`,
    saiu_entrega: `🛵 *Seu pedido #${orderNumber} saiu para entrega!* Estamos a caminho. Fique de olho!${track}`,
    entregue:     `🎉 *Pedido #${orderNumber} entregue!* Obrigado por escolher a Mais Sub. Bom apetite! 🥖`,
    cancelado:    `❌ *Seu pedido #${orderNumber} foi cancelado.* Entre em contato: (33) 98461-9205`,
  }
  return msgs[status] ?? ''
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const { status } = await req.json()
    const { id } = await context.params

    console.log(`[status] id=${id} status=${status}`)

    if (!status || !id) {
      return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 })
    }

    // Update status in DB and get phone/orderNumber back
    const { data: row, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('order_number, customer_phone')
      .single()

    if (error) {
      console.error('[status] supabase error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const phone = row?.customer_phone ?? ''
    const orderNumber = row?.order_number ?? ''
    const msg = buildMessage(status, orderNumber)

    console.log(`[status] order=${orderNumber} phone=${phone} msg=${msg ? 'yes' : 'empty'}`)

    let whatsappSent = false
    if (phone && msg) {
      const result = await sendEvolutionMessage(phone, msg)
      whatsappSent = result.success
      console.log(`[status] whatsapp:`, JSON.stringify(result))
    }

    return NextResponse.json({ success: true, whatsappSent })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[status] catch error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
