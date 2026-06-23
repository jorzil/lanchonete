import { NextRequest, NextResponse } from 'next/server'
import { createOrder, listOrders } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  try {
    const body = await req.json()
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
