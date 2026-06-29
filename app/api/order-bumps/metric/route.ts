import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SYSTEM_PHONE = '__order_bumps__'

// Incrementa o contador de adições de um produto via order bump (métricas)
export async function POST(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ ok: false }, { status: 503 })
  const { productId } = await req.json()
  if (!productId) return NextResponse.json({ ok: false }, { status: 400 })

  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', SYSTEM_PHONE).maybeSingle()
  let cfg: { offers?: unknown; metrics?: Record<string, number> } = {}
  if (data?.address_reference) { try { cfg = JSON.parse(data.address_reference) } catch {} }
  const metrics = cfg.metrics ?? {}
  metrics[productId] = (metrics[productId] ?? 0) + 1

  await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify({ ...cfg, metrics }) },
    { onConflict: 'phone' }
  )
  return NextResponse.json({ ok: true })
}
