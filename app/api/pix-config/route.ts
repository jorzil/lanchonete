import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Chave PIX da loja, numa system row (mesmo padrão das demais configurações).
const SYSTEM_PHONE = '__pix_config__'

const DEFAULT = { key: '', receiverName: 'MAIS SUB', city: 'GOV VALADARES', enabled: false }

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

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json({ pix: DEFAULT })
  const row = await readRow()
  return NextResponse.json({ pix: { ...DEFAULT, ...(row?.pix ?? {}) } })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const p = body.pix ?? {}
    const current = (await readRow())?.pix ?? DEFAULT
    const str = (v: unknown, fallback: string, max: number) =>
      typeof v === 'string' ? v.trim().slice(0, max) : fallback

    const pix = {
      key: str(p.key, current.key, 77),
      receiverName: str(p.receiverName, current.receiverName, 25),
      city: str(p.city, current.city, 15),
      enabled: typeof p.enabled === 'boolean' ? p.enabled : current.enabled,
    }

    const { error } = await supabase.from('customers').upsert(
      {
        phone: SYSTEM_PHONE,
        name: '__system__',
        address_reference: JSON.stringify({ pix, updatedAt: new Date().toISOString() }),
      },
      { onConflict: 'phone' }
    )
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, pix })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
