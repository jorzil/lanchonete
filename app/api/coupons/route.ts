import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SYSTEM_PHONE = '__coupons__'

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
  if (!supabaseConfigured) return NextResponse.json({ coupons: null })
  const row = await readRow()
  return NextResponse.json({ coupons: Array.isArray(row?.coupons) ? row.coupons : null })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  const body = await req.json()
  const coupons = Array.isArray(body.coupons) ? body.coupons : []
  const err = await writeRow({ coupons, updatedAt: new Date().toISOString() })
  if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
