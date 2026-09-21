import { NextRequest, NextResponse } from 'next/server'
import { createOrder, listOrders } from '@/lib/db-orders'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { cupomDeOutroCliente } from '@/lib/coupon-storage'

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

    // Cupom pessoal só passa se for do dono. A validação da tela é para
    // avisar o cliente; esta é a que vale, porque o navegador pode ser
    // contornado e o pedido chega aqui do mesmo jeito.
    const erroCupom = await conferirDonoDoCupom(body)
    if (erroCupom) return NextResponse.json({ error: erroCupom }, { status: 400 })

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
 * Recusa pedido que usa cupom pessoal de outra pessoa.
 *
 * Cupom de resgate do clube e prêmio de roleta nascem para UM cliente. Sem
 * esta conferência, bastava repassar o código: a tela avisaria, mas o pedido
 * enviado direto para a API entraria assim mesmo.
 */
async function conferirDonoDoCupom(body: Record<string, unknown>): Promise<string | null> {
  const codigo = typeof body.couponCode === 'string'
    ? body.couponCode
    : (body.coupon as { code?: string } | undefined)?.code
  if (!codigo || !supabaseConfigured) return null

  try {
    const { data } = await supabase
      .from('customers').select('address_reference').eq('phone', '__coupons__').maybeSingle()
    if (!data?.address_reference) return null

    const lista = JSON.parse(data.address_reference)?.coupons
    if (!Array.isArray(lista)) return null

    // A regra mora em coupon-storage, usada também pela tela: duplicar aqui
    // seria pedir para as duas divergirem.
    return cupomDeOutroCliente(lista, codigo, String(body.customerPhone ?? ''))
      ? 'Este cupom é pessoal e pertence a outro cliente.'
      : null
  } catch {
    // Não dá para conferir: deixa passar em vez de barrar pedido legítimo por
    // um problema nosso de leitura.
    return null
  }
}
