import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { ENTREGAS_TOKEN } from '@/lib/entregas-auth'

export const dynamic = 'force-dynamic'

// Posições dos entregadores por pedido, numa system row (sem migração).
const SYSTEM_PHONE = '__courier_locations__'
// Posições mais antigas que isso são descartadas (entrega já terminou)
const MAX_AGE_MS = 2 * 60 * 60 * 1000

type Loc = { lat: number; lng: number; at: number }
type LocMap = Record<string, Loc>

async function readAll(): Promise<LocMap> {
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try {
      const parsed = JSON.parse(data.address_reference)
      if (parsed && typeof parsed === 'object') return parsed as LocMap
    } catch {}
  }
  return {}
}

async function writeAll(value: LocMap) {
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
  return error
}

/** GET ?orderId=... — posição atual do entregador (público, para o cliente). */
export async function GET(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ location: null })
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ location: null })
  const all = await readAll()
  const loc = all[orderId]
  if (!loc || Date.now() - loc.at > MAX_AGE_MS) return NextResponse.json({ location: null })
  return NextResponse.json({ location: loc })
}

/** POST { orderId, lat, lng } — entregador envia a posição (autenticado). */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-entregas-token') !== ENTREGAS_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  try {
    const { orderId, lat, lng } = await req.json()
    if (!orderId || typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ ok: false, error: 'orderId, lat e lng obrigatórios' }, { status: 400 })
    }
    const all = await readAll()
    // Limpa posições antigas para a linha não crescer sem limite
    const now = Date.now()
    for (const [k, v] of Object.entries(all)) {
      if (now - v.at > MAX_AGE_MS) delete all[k]
    }
    all[String(orderId)] = { lat, lng, at: now }
    const err = await writeAll(all)
    if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

/** DELETE ?orderId=... — para de compartilhar (entrega concluída). */
export async function DELETE(req: NextRequest) {
  if (req.headers.get('x-entregas-token') !== ENTREGAS_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!supabaseConfigured) return NextResponse.json({ ok: true })
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ ok: false }, { status: 400 })
  const all = await readAll()
  delete all[orderId]
  await writeAll(all)
  return NextResponse.json({ ok: true })
}
