import { NextRequest, NextResponse } from 'next/server'
import { confirmDeliveryByCode } from '@/lib/db-orders'
import { supabaseConfigured } from '@/lib/supabase'
import { ENTREGAS_TOKEN } from '@/lib/entregas-auth'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-entregas-token') !== ENTREGAS_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  try {
    const { orderId, code } = await req.json()
    if (!orderId || !code) {
      return NextResponse.json({ ok: false, error: 'orderId e code obrigatórios' }, { status: 400 })
    }
    const result = await confirmDeliveryByCode(String(orderId), String(code))
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 })
    }
    return NextResponse.json({ ok: true, order: result.order })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
