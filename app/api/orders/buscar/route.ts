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
  return {
    id: row.id, orderNumber: row.order_number,
    items: row.items ?? [],
    customer: { name: row.customer_name, phone: row.customer_phone },
    address: row.address ?? undefined,
    orderType: row.order_type,
    paymentMethod: row.payment_method as PaymentMethod,
    subtotal: Number(row.subtotal), deliveryFee: Number(row.delivery_fee),
    discount: Number(row.discount), total: Number(row.total),
    status: row.status as OrderStatus,
    notes: row.notes ?? undefined,
    createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

export async function GET(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const phone = searchParams.get('phone')?.replace(/\D/g, '')
  const name  = searchParams.get('name')?.trim().toLowerCase()

  if (!phone && !name) {
    return NextResponse.json({ error: 'Informe telefone ou nome' }, { status: 400 })
  }

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (phone) query = query.ilike('customer_phone', `%${phone}%`)
  else if (name) query = query.ilike('customer_name', `%${name}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data || data.length === 0) return NextResponse.json({ error: 'Nenhum pedido encontrado' }, { status: 404 })

  return NextResponse.json({ orders: (data as DbOrder[]).map(rowToOrder) })
}
