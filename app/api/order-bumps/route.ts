import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SYSTEM_PHONE = '__order_bumps__'

// Ofertas padrão (caso ainda não tenha configuração salva)
const DEFAULT = {
  offers: [
    { id: 'b1', category: 'cookies', bumpPrice: 14.9, enabled: true },
    { id: 'b2', category: 'bebidas', bumpPrice: 6.9, enabled: true },
  ],
  metrics: {} as Record<string, number>,
}

async function readRow() {
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try { return JSON.parse(data.address_reference) } catch {}
  }
  return null
}

async function writeRow(value: object) {
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
  return error
}

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json(DEFAULT)
  const row = await readRow()
  return NextResponse.json(row ?? DEFAULT)
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  const body = await req.json()
  const current = (await readRow()) ?? DEFAULT
  const next = {
    offers: Array.isArray(body.offers) ? body.offers : current.offers,
    metrics: current.metrics ?? {},
    updatedAt: new Date().toISOString(),
  }
  const err = await writeRow(next)
  if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...next })
}
