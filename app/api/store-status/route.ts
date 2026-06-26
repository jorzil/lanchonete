import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

// System row stored in customers table — no extra table needed
const SYSTEM_PHONE = '__store_config__'

const DEFAULT_SCHEDULE = {
  0: { open: '18:00', close: '23:00', enabled: false },
  1: { open: '18:00', close: '23:00', enabled: true },
  2: { open: '18:00', close: '23:00', enabled: true },
  3: { open: '18:00', close: '23:00', enabled: true },
  4: { open: '18:00', close: '23:00', enabled: true },
  5: { open: '18:00', close: '23:00', enabled: true },
  6: { open: '18:00', close: '23:00', enabled: true },
}

const DEFAULT_STATUS = {
  manualOverride: true as boolean | null, // open by default until admin changes it
  schedule: DEFAULT_SCHEDULE,
}

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
    return NextResponse.json(DEFAULT_STATUS)
  }

  const stored = await readFromDb()
  return NextResponse.json(stored ?? DEFAULT_STATUS)
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const body = await req.json()
  const current = (await readFromDb()) ?? DEFAULT_STATUS
  const next = { ...current, ...body, updatedAt: new Date().toISOString() }

  await writeToDb(next)
  return NextResponse.json(next)
}
