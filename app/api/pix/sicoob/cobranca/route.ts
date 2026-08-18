import { NextRequest, NextResponse } from 'next/server'
import { getSicoobConfig, registrarCobranca } from '@/lib/pix-sicoob-store'
import { criarCobranca } from '@/lib/pix-sicoob'

export const dynamic = 'force-dynamic'

/** POST { orderNumber, valor } → cobrança no Sicoob, com o código PIX. */
export async function POST(req: NextRequest) {
  const cfg = await getSicoobConfig()
  if (!cfg.enabled) {
    return NextResponse.json({ ok: false, error: 'Cobrança Sicoob desligada' }, { status: 409 })
  }
  try {
    const { orderNumber, valor, nomeCliente } = await req.json()
    if (!orderNumber || typeof valor !== 'number' || valor <= 0) {
      return NextResponse.json({ ok: false, error: 'orderNumber e valor são obrigatórios' }, { status: 400 })
    }
    const r = await criarCobranca(cfg, { orderNumber: String(orderNumber), valor, nomeCliente })
    if (!r.ok || !r.data) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 502 })
    }
    // Guarda o vínculo txid → pedido para o webhook saber quem pagou
    await registrarCobranca(r.data.txid, String(orderNumber), valor)
    return NextResponse.json({ ok: true, cobranca: r.data })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
