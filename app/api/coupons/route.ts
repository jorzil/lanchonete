import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SYSTEM_PHONE = '__coupons__'

/**
 * Lê a linha de cupons distinguindo três situações que antes se confundiam:
 * a linha não existe, a linha existe e é legível, ou existe e está ilegível.
 *
 * A distinção importa: o navegador semeia a lista de fábrica quando não há
 * linha, e NÃO pode semear quando a linha existe mas não pôde ser lida — foi
 * assim que os três cupons padrão substituíram uma base inteira.
 */
async function readRow(): Promise<{ existe: boolean; dados: Record<string, unknown> | null }> {
  const { data } = await supabase
    .from('customers')
    .select('address_reference')
    .eq('phone', SYSTEM_PHONE)
    .maybeSingle()

  if (!data) return { existe: false, dados: null }
  if (!data.address_reference) return { existe: true, dados: null }
  try {
    return { existe: true, dados: JSON.parse(data.address_reference) }
  } catch {
    return { existe: true, dados: null }
  }
}

async function writeRow(value: object) {
  const { error } = await supabase.from('customers').upsert(
    { phone: SYSTEM_PHONE, name: '__system__', address_reference: JSON.stringify(value) },
    { onConflict: 'phone' }
  )
  return error
}

export async function GET() {
  if (!supabaseConfigured) return NextResponse.json({ coupons: null, existe: false })
  const { existe, dados } = await readRow()
  const coupons = Array.isArray(dados?.coupons) ? dados.coupons : null
  const anterior = Array.isArray((dados?.anterior as { coupons?: unknown })?.coupons)
    ? (dados?.anterior as { coupons: unknown[]; em?: string })
    : null
  return NextResponse.json({ coupons, existe, anterior })
}

export async function PATCH(req: NextRequest) {
  if (!supabaseConfigured) return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 })
  const body = await req.json()
  const coupons = Array.isArray(body.coupons) ? body.coupons : []

  const { dados } = await readRow()
  const atuais = Array.isArray(dados?.coupons) ? (dados.coupons as unknown[]) : []

  /**
   * Barreira contra apagamento em massa.
   *
   * Sincronização nunca deveria reduzir uma lista de vários cupons a nada ou a
   * quase nada. Quando isso acontece é bug ou aparelho desatualizado mandando
   * uma lista velha — e o custo de recusar é um clique a mais, enquanto o
   * custo de aceitar é a base inteira.
   *
   * A tela de cupons manda force=1 quando é o admin apagando de propósito.
   */
  const forcado = req.nextUrl.searchParams.get('force') === '1'
  if (!forcado && atuais.length >= 3 && coupons.length < atuais.length / 2) {
    return NextResponse.json(
      {
        ok: false,
        recusado: true,
        error: `Recusado: isso apagaria ${atuais.length - coupons.length} de ${atuais.length} cupons.`,
        atuais: atuais.length,
        enviados: coupons.length,
      },
      { status: 409 },
    )
  }

  // Guarda a versão anterior junto: uma volta atrás sempre disponível.
  const err = await writeRow({
    coupons,
    updatedAt: new Date().toISOString(),
    ...(atuais.length > 0 ? { anterior: { coupons: atuais, em: new Date().toISOString() } } : {}),
  })
  if (err) return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
