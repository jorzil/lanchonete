import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

const SETTINGS_KEY = 'store_status'

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
  manualOverride: true as boolean | null,
  schedule: DEFAULT_SCHEDULE,
  updatedAt: new Date().toISOString(),
}

export async function GET() {
  if (!supabaseConfigured) {
    return NextResponse.json(DEFAULT_STATUS)
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(DEFAULT_STATUS)
  }

  return NextResponse.json(data.value)
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const body = await req.json()

  // Fetch existing first to merge
  const { data: existing } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  const current = existing?.value ?? DEFAULT_STATUS
  const next = { ...current, ...body, updatedAt: new Date().toISOString() }

  const { error } = await supabase
    .from('settings')
    .upsert({ key: SETTINGS_KEY, value: next })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(next)
}
