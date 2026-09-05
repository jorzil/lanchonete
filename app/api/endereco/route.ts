import { NextRequest, NextResponse } from 'next/server'
import { sugerirEnderecos, detalharEndereco, googleDisponivel } from '@/lib/google-maps'
import { readDeliveryConfig } from '../orders/delivery-config'

export const dynamic = 'force-dynamic'

/**
 * Busca de endereço para o checkout — o "digite e escolha" do iFood.
 *
 * A chave do Google fica só aqui no servidor. O navegador nunca a vê, então
 * ninguém pode pegá-la do código da página e gastar a cota da loja.
 *
 *   GET ?q=rua+sete            → lista de sugestões
 *   GET ?id=<placeId>          → o endereço completo daquela sugestão
 *
 * O `token` agrupa as teclas de uma mesma busca: é assim que o Google cobra
 * por endereço escolhido, e não por letra digitada.
 */
export async function GET(req: NextRequest) {
  if (!googleDisponivel) {
    return NextResponse.json({ ok: false, indisponivel: true, sugestoes: [] })
  }

  const sp = req.nextUrl.searchParams
  const token = (sp.get('token') ?? '').slice(0, 64)
  const placeId = sp.get('id')

  if (placeId) {
    const detalhe = await detalharEndereco(placeId, token)
    if (!detalhe) return NextResponse.json({ ok: false, error: 'Endereço não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, endereco: detalhe })
  }

  const q = sp.get('q') ?? ''
  // A busca é enviesada para perto da loja: sem isso "Rua 7 de Setembro"
  // devolve uma de cada capital do país antes da nossa.
  const cfg = await readDeliveryConfig().catch(() => null)
  const origem = cfg
    ? { lat: cfg.storeLat, lng: cfg.storeLng }
    : { lat: -18.8543, lng: -41.9497 }

  const sugestoes = await sugerirEnderecos(q, origem, token)
  return NextResponse.json({ ok: true, sugestoes })
}
