import { NextRequest, NextResponse } from 'next/server'
import { resolveDeliveryFee, haversineKm, feeForDistance, applyFreeDelivery, unknownFee } from '@/lib/delivery-zones'
import { distanciaDeRotaKm, googleDisponivel } from '@/lib/google-maps'
import { readDeliveryConfig } from '../../orders/delivery-config'

export const dynamic = 'force-dynamic'

/**
 * Calcula a taxa de entrega — no servidor, e uma vez só para todo o sistema.
 *
 * Existe por dois motivos. O primeiro é a distância REAL: medir a rota exige a
 * chave do Google, que não pode ir para o navegador. O segundo é confiança: o
 * checkout mandava a taxa pronta e o servidor aceitava, então bastava editar o
 * valor antes de enviar.
 */
export async function POST(req: NextRequest) {
  try {
    const { lat, lng, bairro, subtotal, confirmadoNoMapa } = await req.json()
    const cfg = await readDeliveryConfig()
    if (!cfg) {
      return NextResponse.json({ ok: false, error: 'Entrega não configurada.' }, { status: 503 })
    }

    const temPonto = typeof lat === 'number' && typeof lng === 'number'
    const valor = typeof subtotal === 'number' ? subtotal : 0

    // Sem ponto confirmado nada muda: a decisão continua sendo a de sempre.
    if (!temPonto || !confirmadoNoMapa) {
      const d = resolveDeliveryFee({ bairro, lat, lng, subtotal: valor, cfg, confirmadoNoMapa: false })
      return NextResponse.json({ ok: true, decisao: d, rotaReal: false })
    }

    // Com ponto confirmado, tentamos a rota de verdade antes de cair no fator.
    const loja = { lat: cfg.storeLat, lng: cfg.storeLng }
    const rotaKm = cfg.distanceEnabled === false ? null : await distanciaDeRotaKm(loja, { lat, lng })

    if (rotaKm === null) {
      const d = resolveDeliveryFee({ bairro, lat, lng, subtotal: valor, cfg, confirmadoNoMapa: true })
      return NextResponse.json({
        ok: true, decisao: d, rotaReal: false,
        // Sem o Google, o fator de rota continua sendo uma estimativa — quem
        // olha o pedido no painel merece saber disso.
        aviso: googleDisponivel ? 'Não foi possível medir a rota; usamos a estimativa por distância.' : undefined,
      })
    }

    const retaKm = haversineKm(loja.lat, loja.lng, lat, lng)
    const zona = feeForDistance(rotaKm, cfg.zones)
    const maisCara = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm).at(-1)?.fee
    const bruta = zona?.fee ?? maisCara ?? unknownFee(cfg)
    const fee = applyFreeDelivery(bruta, valor, cfg)

    return NextResponse.json({
      ok: true,
      rotaReal: true,
      decisao: {
        fee,
        feeBruta: bruta,
        fonte: fee === 0 && bruta > 0 ? 'gratis' : zona ? 'pino' : 'fora_area',
        explicacao: zona
          ? `${rotaKm.toFixed(1)}km de rota real até o ponto que você confirmou — faixa "${zona.label}"`
          : `${rotaKm.toFixed(1)}km de rota real — fora da área de entrega`,
        distanceKm: Math.round(rotaKm * 10) / 10,
        straightKm: Math.round(retaKm * 10) / 10,
        zone: zona,
        outsideArea: !zona,
        estimada: false,
      },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
