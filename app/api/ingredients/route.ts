import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

// System row stored in customers table — no extra table needed
const SYSTEM_PHONE = '__ingredients_config__'

const DEFAULT_CONFIG = { disabled: [] as string[] }

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
  await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
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
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }
  const body = await req.json()
  const disabled = Array.isArray(body.disabled) ? body.disabled : []
  const next = { disabled, updatedAt: new Date().toISOString() }
  await writeToDb(next)
  return NextResponse.json(next)
}
