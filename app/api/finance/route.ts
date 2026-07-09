import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// System row stored in customers table — no extra table needed
const SYSTEM_PHONE = '__finance__'

const DEFAULT_CONFIG = { bills: [] as unknown[], transactions: [] as unknown[], customCategories: [] as unknown[], cashBase: 0 }

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
  return NextResponse.json({
    bills: Array.isArray(stored?.bills) ? stored.bills : [],
    transactions: Array.isArray(stored?.transactions) ? stored.transactions : [],
    customCategories: Array.isArray(stored?.customCategories) ? stored.customCategories : [],
    cashBase: typeof stored?.cashBase === 'number' ? stored.cashBase : 0,
  })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  const body = await req.json()
  const bills = Array.isArray(body.bills) ? body.bills : []
  const transactions = Array.isArray(body.transactions) ? body.transactions : []
  const customCategories = Array.isArray(body.customCategories) ? body.customCategories : []
  const cashBase = typeof body.cashBase === 'number' && isFinite(body.cashBase) ? body.cashBase : 0
  const next = { bills, transactions, customCategories, cashBase, updatedAt: new Date().toISOString() }
  const writeErr = await writeToDb(next)
  if (writeErr) {
    return NextResponse.json({ ok: false, error: writeErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, bills, transactions, customCategories, cashBase })
}
