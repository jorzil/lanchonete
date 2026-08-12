import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Promoções por horário, numa system row (mesmo padrão dos order bumps).
const SYSTEM_PHONE = '__promotions__'

const DEFAULT = { promotions: [] as unknown[] }

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

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** Descarta o que não serve: uma promoção malformada não pode virar preço. */
function sanitize(raw: unknown): object | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  const id = typeof p.id === 'string' && p.id ? p.id : null
  const name = typeof p.name === 'string' ? p.name.trim() : ''
  const start = typeof p.start === 'string' && HHMM.test(p.start) ? p.start : null
  const end = typeof p.end === 'string' && HHMM.test(p.end) ? p.end : null
  if (!id || !name || !start || !end) return null

  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : 0)
  return {
    id,
    name,
    enabled: p.enabled !== false,
    productIds: Array.isArray(p.productIds) ? p.productIds.filter((x): x is string => typeof x === 'string') : [],
    price15: num(p.price15),
    price30: num(p.price30),
    start,
    end,
    days: Array.isArray(p.days)
      ? [...new Set(p.days.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6))]
      : [],
  }
}

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json(DEFAULT)
  const row = await readRow()
  return NextResponse.json({ promotions: Array.isArray(row?.promotions) ? row.promotions : [] })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado' }, { status: 503 })
  }
  try {
    const body = await req.json()
    if (!Array.isArray(body.promotions)) {
      return NextResponse.json({ ok: false, error: 'promotions deve ser uma lista' }, { status: 400 })
    }
    const promotions = body.promotions.map(sanitize).filter(Boolean)
    const error = await writeRow({ promotions, updatedAt: new Date().toISOString() })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, promotions })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
