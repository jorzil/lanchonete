import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import type { Order, CartItem, Address, PaymentMethod, OrderStatus } from '@/lib/data'

interface DbOrder {
  id: string; order_number: string; customer_name: string; customer_phone: string
  order_type: 'entrega' | 'retirada'; items: CartItem[]; address: Address | null
  payment_method: string; subtotal: number; delivery_fee: number; discount: number
  total: number; status: string; notes: string | null; created_at: string; updated_at: string
}

function rowToOrder(row: DbOrder): Order {
  const addr = (row.address ?? undefined) as (Address & { deliveryCode?: string }) | undefined
  return {
    id: row.id, orderNumber: row.order_number,
    items: row.items ?? [],
    customer: { name: row.customer_name, phone: row.customer_phone },
    address: addr,
    orderType: row.order_type,
    paymentMethod: row.payment_method as PaymentMethod,
    subtotal: Number(row.subtotal), deliveryFee: Number(row.delivery_fee),
    discount: Number(row.discount), total: Number(row.total),
    status: row.status as OrderStatus,
    notes: row.notes ?? undefined,
    deliveryCode: addr?.deliveryCode,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const { number } = await params
  const orderNumber = decodeURIComponent(number).toUpperCase()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
  return NextResponse.json({ order: rowToOrder(data as DbOrder) })
}
