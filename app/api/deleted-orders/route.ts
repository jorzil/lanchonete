import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Lixeira de pedidos: IDs marcados como excluídos (soft delete) numa system row.
const SYSTEM_PHONE = '__deleted_orders__'
const MAX_IDS = 1000

async function readIds(): Promise<string[]> {
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()
  if (data?.address_reference) {
    try {
      const parsed = JSON.parse(data.address_reference)
      if (Array.isArray(parsed.ids)) return parsed.ids
    } catch {}
  }
  return []
}

async function writeIds(ids: string[]) {
  const { error } = await supabase.from('customers').upsert(
    {
      phone: SYSTEM_PHONE,
      name: '__system__',
      address_reference: JSON.stringify({ ids: ids.slice(-MAX_IDS), updatedAt: new Date().toISOString() }),
    },
    { onConflict: 'phone' }
  )
  return error
}

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json({ ids: [] })
  return NextResponse.json({ ids: await readIds() })
}

// { add: "id" } move para a lixeira · { remove: "id" } restaura/apaga da lixeira
export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  }
  const body = await req.json()
  const ids = new Set(await readIds())
  if (typeof body.add === 'string' && body.add) ids.add(body.add)
  if (typeof body.remove === 'string' && body.remove) ids.delete(body.remove)
  const err = await writeIds([...ids])
  if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  return NextResponse.json({ ok: true, ids: [...ids] })
}
