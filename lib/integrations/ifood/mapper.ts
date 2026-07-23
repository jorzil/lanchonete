// ============================================================================
// Integração iFood — Mapeamento e ingestão de pedidos (SERVER-ONLY)
// Converte um pedido do iFood no formato interno e o persiste pelo MESMO
// caminho dos demais pedidos (createOrder), criando/atualizando o cliente.
// ============================================================================

import { createOrder, type CreateOrderPayload } from '@/lib/db-orders'
import { supabase } from '@/lib/supabase'
import type { CartItem, PaymentMethod } from '@/lib/data'
import type { IFoodOrder } from './types'
import { getOrder } from './client'
import { logIFood } from './logs'

function mapPayment(o: IFoodOrder): PaymentMethod {
  const m = o.payments?.methods?.[0]?.method?.toUpperCase() ?? ''
  if (m.includes('PIX')) return 'pix'
  if (m.includes('DEBIT')) return 'cartao-debito'
  if (m.includes('CASH') || m.includes('DINHEIRO')) return 'dinheiro'
  return 'cartao-credito'
}

function mapItems(o: IFoodOrder): CartItem[] {
  return (o.items ?? []).map((it, i) => {
    const extras = (it.options ?? []).map((op) => op.name).filter(Boolean)
    const noteParts = [it.observations, extras.length ? `Adicionais: ${extras.join(', ')}` : '']
      .filter(Boolean)
    return {
      id: `ifood-${o.id}-${i}`,
      productId: `ifood-${it.name}`,
      name: it.name,
      price: it.totalPrice ?? it.unitPrice ?? 0,
      quantity: it.quantity ?? 1,
      image: '🍔',
      notes: noteParts.join(' • ') || undefined,
    }
  })
}

export function mapOrder(o: IFoodOrder): CreateOrderPayload {
  const addr = o.delivery?.deliveryAddress
  const isDelivery = (o.orderType ?? 'DELIVERY').toUpperCase() === 'DELIVERY'
  const subtotal = o.total?.subTotal ?? 0
  const deliveryFee = o.total?.deliveryFee ?? 0
  const discount = o.total?.benefits ?? 0
  const total = o.total?.orderAmount ?? subtotal + deliveryFee - discount

  return {
    orderNumber: `MS-IF-${o.displayId ?? o.id.slice(0, 8)}`.toUpperCase(),
    customerName: o.customer?.name ?? 'Cliente iFood',
    customerPhone: o.customer?.phone?.number ?? `ifood-${o.id.slice(0, 8)}`,
    orderType: isDelivery ? 'entrega' : 'retirada',
    items: mapItems(o),
    address: isDelivery && addr ? {
      cep: addr.postalCode ?? '',
      street: addr.streetName ?? addr.formattedAddress ?? '',
      number: addr.streetNumber ?? 's/n',
      complement: addr.complement,
      neighborhood: addr.neighborhood ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      reference: addr.reference,
    } : undefined,
    paymentMethod: mapPayment(o),
    subtotal, deliveryFee, discount, total,
    notes: 'Pedido recebido via iFood',
    source: 'ifood',
    externalId: o.id,
  }
}

async function alreadyImported(externalId: string): Promise<boolean> {
  try {
    const { data } = await supabase.from('orders').select('id').eq('external_id', externalId).maybeSingle()
    return !!data
  } catch {
    return false // se a coluna não existe ainda, deixa seguir (não bloqueia)
  }
}

/** Busca o pedido no iFood e o persiste (idempotente por externalId). */
export async function ingestOrder(orderId: string): Promise<boolean> {
  if (await alreadyImported(orderId)) {
    await logIFood('info', 'order', `Pedido ${orderId} já importado — ignorado`)
    return false
  }
  const detail = await getOrder(orderId)
  if (!detail) {
    await logIFood('error', 'order', `Não foi possível obter os detalhes do pedido ${orderId} no iFood`)
    return false
  }
  try {
    const order = await createOrder(mapOrder(detail))
    await logIFood('success', 'order', `Pedido iFood importado: ${order.orderNumber}`, { externalId: orderId })
    return true
  } catch (e) {
    await logIFood('error', 'order', `Falha ao salvar pedido ${orderId}`, e instanceof Error ? e.message : String(e))
    return false
  }
}
