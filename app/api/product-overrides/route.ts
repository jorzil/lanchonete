import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// System row stored in customers table — no extra table needed
const SYSTEM_PHONE = '__product_overrides__'

const DEFAULT_CONFIG = { overrides: {} as Record<string, unknown> }

async function readFromDb() {
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

async function writeToDb(value: object) {
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
  return error
}

export async function GET() {
  if (!supabaseConfigured) {
    return NextResponse.json(DEFAULT_CONFIG)
  }
  const stored = await readFromDb()
  return NextResponse.json(stored ?? DEFAULT_CONFIG)
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  const body = await req.json()
  const overrides = body.overrides && typeof body.overrides === 'object' ? body.overrides : {}
  const next = { overrides, updatedAt: new Date().toISOString() }
  const writeErr = await writeToDb(next)
  if (writeErr) {
    return NextResponse.json({ ok: false, error: writeErr.message }, { status: 500 })
  }
  const saved = await readFromDb()
  return NextResponse.json({ ok: true, overrides: saved?.overrides ?? overrides })
}
