// ==================== DB ORDERS ====================
// Supabase CRUD for orders. All calls gated by supabaseConfigured.

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { Order, OrderStatus, CartItem, Address, PaymentMethod } from '@/lib/data'

// ─── DB Row type (snake_case from Supabase) ────────────────────────────────
interface DbOrder {
  id: string
  order_number: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  order_type: 'entrega' | 'retirada'
  items: CartItem[]
  address: Address | null
  payment_method: string
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  status: string
  notes: string | null
  whatsapp_sent_at: Record<string, string>
  created_at: string
  updated_at: string
}

// ─── Map DB row → Order ────────────────────────────────────────────────────
function rowToOrder(row: DbOrder): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    items: row.items ?? [],
    customer: { name: row.customer_name, phone: row.customer_phone },
    address: row.address ?? undefined,
    orderType: row.order_type,
    paymentMethod: row.payment_method as PaymentMethod,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    discount: Number(row.discount),
    total: Number(row.total),
    status: row.status as OrderStatus,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Payload for creating an order ────────────────────────────────────────
export interface CreateOrderPayload {
  orderNumber: string
  customerName: string
  customerPhone: string
  customerCpf?: string
  customerWhatsapp?: string
  orderType: 'entrega' | 'retirada'
  items: CartItem[]
  address?: Address & { reference?: string }
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  notes?: string
}

// ─── Upsert customer, then insert order ───────────────────────────────────
export async function createOrder(data: CreateOrderPayload): Promise<Order> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  // 1. Upsert customer by phone
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert(
      {
        name: data.customerName,
        phone: data.customerPhone,
        whatsapp: data.customerWhatsapp ?? data.customerPhone,
        cpf: data.customerCpf ?? null,
        address_cep: data.address?.cep ?? null,
        address_street: data.address?.street ?? null,
        address_number: data.address?.number ?? null,
        address_complement: data.address?.complement ?? null,
        address_neighborhood: data.address?.neighborhood ?? null,
        address_city: data.address?.city ?? null,
        address_state: data.address?.state ?? null,
        address_reference: data.address?.reference ?? null,
      },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select('id')
    .single()

  if (custErr) console.error('Customer upsert error (non-fatal):', custErr.message)

  // 2. Insert order
  const { data: row, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: data.orderNumber,
      customer_id: customer?.id ?? null,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      order_type: data.orderType,
      items: data.items,
      address: data.address ?? null,
      payment_method: data.paymentMethod,
      subtotal: data.subtotal,
      delivery_fee: data.deliveryFee,
      discount: data.discount,
      total: data.total,
      notes: data.notes ?? null,
      status: 'novo',
    })
    .select()
    .single()

  if (orderErr) throw new Error(orderErr.message)
  return rowToOrder(row as DbOrder)
}

// ─── List orders ────────────────────────────────────────────────────────────
export async function listOrders(filters?: { status?: OrderStatus }): Promise<Order[]> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as DbOrder[]).map(rowToOrder)
}

// ─── Update order status ────────────────────────────────────────────────────
export async function updateOrderStatus(id: string, status: string): Promise<void> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ─── Delete order ───────────────────────────────────────────────────────────
export async function deleteDbOrder(id: string): Promise<void> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Get single order ───────────────────────────────────────────────────────
export async function getOrder(id: string): Promise<Order | null> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) return null
  return rowToOrder(data as DbOrder)
}
