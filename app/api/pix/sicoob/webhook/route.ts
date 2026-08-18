import { NextRequest, NextResponse } from 'next/server'
import { getSicoobConfig, acharPedidoPorTxid, marcarPago } from '@/lib/pix-sicoob-store'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * O Sicoob chama aqui quando o PIX cai. O corpo traz uma lista em "pix", cada
 * item com o txid da cobrança. Responder 200 é o que evita reenvio.
 */
export async function POST(req: NextRequest) {
  const cfg = await getSicoobConfig()
  let payload: unknown = null
  try { payload = await req.json() } catch {}

  const lista = Array.isArray((payload as { pix?: unknown[] })?.pix)
    ? ((payload as { pix: Array<{ txid?: string; valor?: string; endToEndId?: string }> }).pix)
    : []

  let confirmados = 0
  for (const p of lista) {
    if (!p?.txid) continue
    const vinculo = await acharPedidoPorTxid(p.txid)
    if (!vinculo) continue
    await marcarPago(p.txid)

    // Aceita o pedido sozinho: o dinheiro já entrou, não faz sentido esperar.
    if (cfg.autoConfirmar && supabaseConfigured) {
      try {
        await supabase
          .from('orders')
          .update({ status: 'aceito' })
          .eq('order_number', vinculo.orderNumber)
          .eq('status', 'novo')
        confirmados++
      } catch {}
    }
  }

  // Sempre 200: um erro nosso não pode fazer o Sicoob reenviar sem parar.
  return NextResponse.json({ ok: true, recebidos: lista.length, confirmados })
}

/** O Sicoob valida o endereço antes de cadastrar o webhook. */
export async function GET() {
  return NextResponse.json({ ok: true })
}
