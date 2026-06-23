// ==================== DB CUSTOMERS ====================
// Supabase CRUD for customers with order aggregates.

import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { Order, CartItem, Address, PaymentMethod, OrderStatus } from '@/lib/data'

// ─── Types ──────────────────────────────────────────────────────────────────
export interface CustomerRow {
  id: string
  name: string
  phone: string
  whatsapp: string | null
  cpf: string | null
  email: string | null
  address_cep: string | null
  address_street: string | null
  address_number: string | null
  address_complement: string | null
  address_neighborhood: string | null
  address_city: string | null
  address_state: string | null
  address_reference: string | null
  created_at: string
  updated_at: string
}

export interface CustomerWithStats extends CustomerRow {
  total_orders: number
  total_spent: number
  avg_ticket: number
  last_order_date: string | null
}

export interface CustomerDetail extends CustomerWithStats {
  orders: Order[]
}

// ─── Helper: map order row ──────────────────────────────────────────────────
interface DbOrderRow {
  id: string
  order_number: string
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
  created_at: string
  updated_at: string
}

function rowToOrder(row: DbOrderRow): Order {
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

// ─── List customers with aggregated order stats ────────────────────────────
export async function listCustomers(): Promise<CustomerWithStats[]> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  // Fetch customers
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (custErr) throw new Error(custErr.message)

  // Fetch order aggregates per customer
  const { data: orderAggs, error: aggErr } = await supabase
    .from('orders')
    .select('customer_id, total, created_at')

  if (aggErr) throw new Error(aggErr.message)

  // Build a map: customer_id → stats
  const statsMap = new Map<string, { count: number; spent: number; lastDate: string }>()
  for (const o of (orderAggs ?? []) as { customer_id: string | null; total: number; created_at: string }[]) {
    if (!o.customer_id) continue
    const existing = statsMap.get(o.customer_id)
    if (!existing) {
      statsMap.set(o.customer_id, { count: 1, spent: Number(o.total), lastDate: o.created_at })
    } else {
      existing.count++
      existing.spent += Number(o.total)
      if (o.created_at > existing.lastDate) existing.lastDate = o.created_at
    }
  }

  return (customers as CustomerRow[]).map((c) => {
    const stats = statsMap.get(c.id)
    const count = stats?.count ?? 0
    const spent = stats?.spent ?? 0
    return {
      ...c,
      total_orders: count,
      total_spent: spent,
      avg_ticket: count > 0 ? spent / count : 0,
      last_order_date: stats?.lastDate ?? null,
    }
  })
}

// ─── Get single customer + their orders ────────────────────────────────────
export async function getCustomer(id: string): Promise<CustomerDetail | null> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (custErr || !customer) return null

  const { data: orderRows, error: ordErr } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  if (ordErr) throw new Error(ordErr.message)

  const orders = (orderRows as DbOrderRow[]).map(rowToOrder)
  const total_spent = orders.reduce((sum, o) => sum + o.total, 0)
  const total_orders = orders.length
  const last_order_date = orders[0]?.createdAt ?? null

  return {
    ...(customer as CustomerRow),
    total_orders,
    total_spent,
    avg_ticket: total_orders > 0 ? total_spent / total_orders : 0,
    last_order_date,
    orders,
  }
}

// ─── Upsert customer by phone ───────────────────────────────────────────────
export interface UpsertCustomerPayload {
  name: string
  phone: string
  whatsapp?: string
  cpf?: string
  email?: string
  address_cep?: string
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_reference?: string
}

export async function upsertCustomer(data: UpsertCustomerPayload): Promise<CustomerRow> {
  if (!supabaseConfigured) throw new Error('Supabase not configured')

  const { data: row, error } = await supabase
    .from('customers')
    .upsert(
      {
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp ?? null,
        cpf: data.cpf ?? null,
        email: data.email ?? null,
        address_cep: data.address_cep ?? null,
        address_street: data.address_street ?? null,
        address_number: data.address_number ?? null,
        address_complement: data.address_complement ?? null,
        address_neighborhood: data.address_neighborhood ?? null,
        address_city: data.address_city ?? null,
        address_state: data.address_state ?? null,
        address_reference: data.address_reference ?? null,
      },
      { onConflict: 'phone', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) throw new Error(error.message)
  return row as CustomerRow
}
