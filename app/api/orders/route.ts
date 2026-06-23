import { NextRequest, NextResponse } from 'next/server'
import { createOrder, listOrders } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'

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
