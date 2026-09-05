import { NextRequest, NextResponse } from 'next/server'
import { createOrder, listOrders } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'
import { resolveDeliveryFee, feeForDistance, applyFreeDelivery, type DeliveryConfig } from '@/lib/delivery-zones'
import { distanciaDeRotaKm } from '@/lib/google-maps'
import { readDeliveryConfig } from './delivery-config'

// Simple origin check: only allow same-origin or admin requests
function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  // Same-origin (no origin header) or matching host
  if (!origin) return true
  try {
    return new URL(origin).host === host
  } catch { return false }
}

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()

    // Basic input validation
    if (!body.orderNumber || typeof body.orderNumber !== 'string') {
      return NextResponse.json({ error: 'orderNumber required' }, { status: 400 })
    }
    if (!body.customerName || typeof body.customerName !== 'string') {
      return NextResponse.json({ error: 'customerName required' }, { status: 400 })
    }
    if (!body.customerPhone || typeof body.customerPhone !== 'string') {
      return NextResponse.json({ error: 'customerPhone required' }, { status: 400 })
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'items required' }, { status: 400 })
    }

    // A taxa de entrega chega pronta do navegador — e o ponto do mapa é
    // escolhido pelo próprio cliente. Recalculamos aqui: sem isso, bastaria
    // editar o valor antes de enviar para pagar o frete que quisesse.
    const erroTaxa = await conferirTaxa(body)
    if (erroTaxa) return NextResponse.json({ error: erroTaxa }, { status: 400 })

    const order = await createOrder(body)
    return NextResponse.json({ success: true, order }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  // Only allow same-origin requests (admin panel)
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? undefined
    const orders = await listOrders(status ? { status: status as Parameters<typeof listOrders>[0] extends { status?: infer S } ? S : never } : undefined)
    return NextResponse.json({ orders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


/**
 * Caixa que contém Governador Valadares e arredores.
 *
 * Coordenada fora daqui não é engano de dedo: é pino forjado tentando virar
 * frete barato, ou dado corrompido. Em ambos os casos o pedido não passa.
 */
const AREA_VALIDA = { latMin: -19.6, latMax: -18.1, lngMin: -42.7, lngMax: -41.2 }

/**
 * Recalcula a taxa a partir do que foi enviado e recusa divergência relevante.
 *
 * Tolera centavos de arredondamento e aceita taxa MAIOR que a calculada (a
 * loja pode ter cobrado a mais de propósito); recusa só quem tenta pagar menos.
 */
async function conferirTaxa(body: Record<string, unknown>): Promise<string | null> {
  if (body.orderType !== 'entrega') return null

  const endereco = body.address as { lat?: number; lng?: number; neighborhood?: string } | undefined
  const enviada = typeof body.deliveryFee === 'number' ? body.deliveryFee : 0
  const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0

  const lat = endereco?.lat
  const lng = endereco?.lng
  if (typeof lat === 'number' && typeof lng === 'number') {
    if (lat < AREA_VALIDA.latMin || lat > AREA_VALIDA.latMax
        || lng < AREA_VALIDA.lngMin || lng > AREA_VALIDA.lngMax) {
      return 'Localização inválida. Confirme no mapa onde fica sua casa.'
    }
  }

  let cfg: DeliveryConfig | null = null
  try { cfg = await readDeliveryConfig() } catch { cfg = null }
  // Sem configuração para conferir, não dá para acusar ninguém: deixa passar.
  if (!cfg) return null

  // Confere pela MESMA régua que o checkout usou: se ele mediu a rota real,
  // comparar com a estimativa por linha reta acusaria diferença que não existe.
  const temPonto = typeof lat === 'number' && typeof lng === 'number'
  let devida: number | null = null

  if (temPonto && cfg.distanceEnabled !== false) {
    const rotaKm = await distanciaDeRotaKm({ lat: cfg.storeLat, lng: cfg.storeLng }, { lat, lng })
    if (rotaKm !== null) {
      const zona = feeForDistance(rotaKm, cfg.zones)
      const maisCara = [...cfg.zones].sort((a, b) => a.maxKm - b.maxKm).at(-1)?.fee ?? 0
      devida = applyFreeDelivery(zona?.fee ?? maisCara, subtotal, cfg)
    }
  }

  if (devida === null) {
    devida = resolveDeliveryFee({
      bairro: endereco?.neighborhood ?? '',
      lat, lng, subtotal, cfg, confirmadoNoMapa: temPonto,
    }).fee
  }

  if (enviada + 0.011 < devida) {
    return `Taxa de entrega inválida. O valor correto para este endereço é ${devida.toFixed(2)}.`
  }
  return null
}
