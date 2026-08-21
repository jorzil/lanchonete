import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { LOYALTY_DEFAULTS, type LoyaltyConfig, type Redemption } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

const SYSTEM_PHONE = '__loyalty__'

export async function readLoyaltyRow(): Promise<{ config: LoyaltyConfig; redemptions: Redemption[] }> {
  if (!supabaseConfigured) return { config: LOYALTY_DEFAULTS, redemptions: [] }
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', SYSTEM_PHONE).maybeSingle()
  if (data?.address_reference) {
    try {
      const p = JSON.parse(data.address_reference)
      return {
        config: { ...LOYALTY_DEFAULTS, ...(p.config ?? {}) },
        redemptions: Array.isArray(p.redemptions) ? p.redemptions : [],
      }
    } catch {}
  }
  return { config: LOYALTY_DEFAULTS, redemptions: [] }
}

export async function writeLoyaltyRow(value: { config: LoyaltyConfig; redemptions: Redemption[] }) {
  if (!supabaseConfigured) return new Error('Supabase não configurado')
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' },
  )
  return error
}

export async function GET() {
  const { config, redemptions } = await readLoyaltyRow()
  return NextResponse.json({ config, redemptions })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase não configurado' }, { status: 503 })
  }
  try {
    const body = await req.json()
    const atual = await readLoyaltyRow()
    const c = body.config ?? {}
    const config: LoyaltyConfig = {
      ...atual.config,
      ...(typeof c.ativo === 'boolean' ? { ativo: c.ativo } : {}),
      ...(typeof c.nomePrograma === 'string' ? { nomePrograma: c.nomePrograma.slice(0, 40) } : {}),
      ...(typeof c.pontosPorReal === 'number' && c.pontosPorReal >= 0
        ? { pontosPorReal: Math.min(100, c.pontosPorReal) } : {}),
      ...(Array.isArray(c.statusQueContam) ? { statusQueContam: c.statusQueContam.filter((s: unknown) => typeof s === 'string') } : {}),
      ...(Array.isArray(c.recompensas) ? { recompensas: c.recompensas } : {}),
      ...(Array.isArray(c.niveis) ? { niveis: c.niveis } : {}),
    }
    const error = await writeLoyaltyRow({ config, redemptions: atual.redemptions })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, config })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
