import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { ENTREGAS_TOKEN } from '@/lib/entregas-auth'

export const dynamic = 'force-dynamic'

// Chegadas do entregador ao endereço, por pedido — numa system row, mesmo
// padrão da localização (sem migração de banco).
const SYSTEM_PHONE = '__courier_arrivals__'
// Chegadas antigas são descartadas: a entrega já terminou faz tempo.
const MAX_AGE_MS = 6 * 60 * 60 * 1000

type ArrivalMap = Record<string, number>

async function readAll(): Promise<ArrivalMap> {
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try {
      const parsed = JSON.parse(data.address_reference)
      if (parsed && typeof parsed === 'object') return parsed as ArrivalMap
    } catch {}
  }
  return {}
}

async function writeAll(value: ArrivalMap) {
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
  return error
}

/** GET ?orderId=... — o entregador já chegou? (público, para o cliente) */
export async function GET(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ arrivedAt: null })
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ arrivedAt: null })
  const at = (await readAll())[orderId]
  if (!at || Date.now() - at > MAX_AGE_MS) return NextResponse.json({ arrivedAt: null })
  return NextResponse.json({ arrivedAt: at })
}

/** POST { orderId } — entregador avisa que chegou ao endereço (autenticado). */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-entregas-token') !== ENTREGAS_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  try {
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId obrigatório' }, { status: 400 })
    }
    const all = await readAll()
    // Só registra a primeira chegada: um toque repetido não deve reiniciar o
    // relógio que o cliente vê.
    if (!all[orderId]) all[orderId] = Date.now()

    // Aproveita a gravação para limpar chegadas vencidas.
    const now = Date.now()
    for (const [id, at] of Object.entries(all)) {
      if (now - at > MAX_AGE_MS) delete all[id]
    }

    const error = await writeAll(all)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, arrivedAt: all[orderId] })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
