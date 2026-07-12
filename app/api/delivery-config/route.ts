import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// System row stored in customers table — no extra table needed
const SYSTEM_PHONE = '__delivery_config__'

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
    return NextResponse.json({ config: null })
  }
  const stored = await readFromDb()
  return NextResponse.json({ config: stored ?? null })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  const body = await req.json()
  const config = body.config && typeof body.config === 'object' ? body.config : null
  if (!config) {
    return NextResponse.json({ ok: false, error: 'config inválida' }, { status: 400 })
  }
  const writeErr = await writeToDb({ ...config, updatedAt: new Date().toISOString() })
  if (writeErr) {
    return NextResponse.json({ ok: false, error: writeErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, config })
}
