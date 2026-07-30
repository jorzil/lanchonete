// ============================================================================
// Integração iFood — Mapeamento e ingestão de pedidos (SERVER-ONLY)
// Converte um pedido do iFood no formato interno e o persiste pelo MESMO
// caminho dos demais pedidos (createOrder), criando/atualizando o cliente.
// ============================================================================

import { createOrder, type CreateOrderPayload } from '@/lib/db-orders'
import { supabase } from '@/lib/supabase'
import type { CartItem, PaymentMethod } from '@/lib/data'
import type { IFoodEvent, IFoodOrder } from './types'
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

// ─── Eventos de status vindos do iFood ───────────────────────────────────────
// O iFood muda o status por conta própria (o entregador despacha, o pedido de
// envio imediato vira CONCLUDED sozinho). Sem refletir isso aqui, o painel
// mostra um estado defasado — e a homologação cobra exatamente essa sincronia.
const EVENT_STATUS: Record<string, string> = {
  CONFIRMED: 'aceito',
  CFM: 'aceito',
  SEPARATION_STARTED: 'em_preparo',
  SPS: 'em_preparo',
  READY_TO_PICKUP: 'pronto',
  RTP: 'pronto',
  DISPATCHED: 'saiu_entrega',
  DSP: 'saiu_entrega',
  CONCLUDED: 'entregue',
  CON: 'entregue',
  CANCELLED: 'cancelado',
  CAN: 'cancelado',
}

export type StatusSyncResult = 'updated' | 'unmapped' | 'not_found'

/** Reflete no pedido local a mudança de status anunciada pelo iFood. */
export async function syncOrderStatus(ev: IFoodEvent): Promise<StatusSyncResult> {
  const key = (ev.fullCode ?? ev.code ?? '').toUpperCase()
  const status = EVENT_STATUS[key]
  if (!status) return 'unmapped'

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('external_id', ev.orderId)
    .select('order_number')

  if (error) {
    await logIFood('error', 'status', `Falha ao aplicar ${key} no pedido ${ev.orderId}`, error.message)
    return 'not_found'
  }
  if (!data || data.length === 0) {
    await logIFood('warn', 'status', `Evento ${key} recebido para um pedido que não está no sistema (${ev.orderId})`)
    return 'not_found'
  }

  await logIFood('success', 'status', `${data[0].order_number}: iFood mudou para '${status}' (${key})`)
  return 'updated'
}

/** 'imported' = novo pedido salvo · 'duplicate' = já existia · 'failed' = não foi possível */
export type IngestResult = 'imported' | 'duplicate' | 'failed'

/** Busca o pedido no iFood e o persiste (idempotente por externalId). */
export async function ingestOrder(orderId: string): Promise<IngestResult> {
  if (await alreadyImported(orderId)) {
    await logIFood('info', 'order', `Pedido ${orderId} já importado — ignorado`)
    return 'duplicate'
  }
  const detail = await getOrder(orderId)
  if (!detail) {
    await logIFood('error', 'order', `Não foi possível obter os detalhes do pedido ${orderId} no iFood`)
    return 'failed'
  }
  try {
    const order = await createOrder(mapOrder(detail))
    await logIFood('success', 'order', `Pedido iFood importado: ${order.orderNumber}`, { externalId: orderId })
    return 'imported'
  } catch (e) {
    await logIFood('error', 'order', `Falha ao salvar pedido ${orderId}`, e instanceof Error ? e.message : String(e))
    return 'failed'
  }
}
