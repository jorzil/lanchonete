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

    console.log(`[status] PATCH id=${id} status=${status}`)

    if (!status || !id) {
      return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 })
    }

    // 1. Buscar dados do pedido antes de atualizar
    const { data: orderRow, error: selectError } = await supabase
      .from('orders')
      .select('order_number, customer_phone')
      .eq('id', id)
      .single()

    if (selectError) {
      console.error('[status] select error:', selectError.message)
    }

    const phone = orderRow?.customer_phone ?? ''
    const orderNumber = orderRow?.order_number ?? ''
    console.log(`[status] order=${orderNumber} phone=${phone}`)

    // 2. Atualizar status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)

    if (updateError) {
      console.error('[status] update error:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 3. Enviar WhatsApp pelo servidor
    const msg = buildMessage(status, orderNumber)
    console.log(`[status] msg=${msg ? 'ok' : 'empty'}`)

    let whatsappSent = false
    if (phone && msg) {
      const result = await sendEvolutionMessage(phone, msg)
      whatsappSent = result.success
      console.log(`[status] whatsapp result:`, JSON.stringify(result))
    }

    return NextResponse.json({ success: true, whatsappSent })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[status] catch:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
