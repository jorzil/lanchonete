import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { listOrders } from '@/lib/db-orders'
import { computeBalance, canSpin, drawSlice, redemptionCode, type Redemption } from '@/lib/loyalty'
import { normalizePhone, isInternalPhone } from '@/lib/phone'
import { readLoyaltyRow, writeLoyaltyRow } from '../route'

export const dynamic = 'force-dynamic'

const COUPONS_PHONE = '__coupons__'

async function criarCupom(cupom: Record<string, unknown>): Promise<Error | null> {
  const { data } = await supabase
    .from('customers').select('address_reference').eq('phone', COUPONS_PHONE).maybeSingle()
  let lista: unknown[] = []
  if (data?.address_reference) {
    try { const p = JSON.parse(data.address_reference); if (Array.isArray(p.coupons)) lista = p.coupons } catch {}
  }
  lista.push(cupom)
  const { error } = await supabase.from('customers').upsert(
    { phone: COUPONS_PHONE, name: '__system__', address_reference: JSON.stringify({ coupons: lista }) },
    { onConflict: 'phone' },
  )
  return error ?? null
}

/**
 * Gira a roleta. O SORTEIO ACONTECE AQUI, no servidor: a tela só anima até o
 * resultado já decidido. Sortear no navegador permitiria escolher o prêmio.
 */
export async function POST(req: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Banco não configurado' }, { status: 503 })
  }
  try {
    const { phone } = await req.json()
    const chave = normalizePhone(phone)
    if (!chave || isInternalPhone(phone) || chave.length < 10) {
      return NextResponse.json({ ok: false, error: 'Telefone inválido.' }, { status: 400 })
    }

    const { config, redemptions } = await readLoyaltyRow()
    if (!config.ativo) return NextResponse.json({ ok: false, error: 'Clube desativado.' }, { status: 409 })
    const roleta = config.roleta
    if (!roleta?.ativo) return NextResponse.json({ ok: false, error: 'A roleta está desativada.' }, { status: 409 })

    // Saldo recalculado do zero: o navegador não decide se pode girar.
    const orders = await listOrders()
    const saldo = computeBalance(config, chave, orders, redemptions)
    if (!canSpin(saldo, roleta)) {
      return NextResponse.json(
        {
          ok: false,
          error: saldo.girosDisponiveis > 0
            ? 'A roleta está indisponível no momento.'
            : `Você ainda não tem giros. Faltam ${saldo.pedidosParaProximoGiro} pedido(s) para o próximo.`,
        },
        { status: 409 },
      )
    }

    const indice = drawSlice(roleta.fatias, Math.random())
    if (indice < 0) {
      return NextResponse.json({ ok: false, error: 'Roleta sem prêmios configurados.' }, { status: 409 })
    }
    const fatia = roleta.fatias[indice]
    const hoje = new Date()

    // O giro é cobrado mesmo sem prêmio — senão girar seria de graça.
    const registro: Redemption = {
      id: `giro-${Date.now().toString(36)}`,
      phone: chave,
      rewardId: `roleta:${fatia.id}`,
      rewardNome: fatia.tipo === 'nada' ? 'Roleta (sem prêmio)' : `Roleta: ${fatia.nome}`,
      couponCode: '',
      // Giro vem de pedidos, não de saldo; guardamos 1 giro como "custo".
      moeda: 'selos',
      custo: 0,
      at: hoje.toISOString(),
    }

    if (fatia.tipo !== 'nada') {
      const code = redemptionCode(chave, fatia.id)
      const validade = new Date(hoje.getTime() + 30 * 86_400_000)
      const tipoCupom =
        fatia.tipo === 'frete_gratis' ? 'free_shipping'
        : fatia.tipo === 'desconto_percentual' ? 'percentage'
        : 'fixed'
      const desconto =
        fatia.tipo === 'desconto_percentual' || fatia.tipo === 'desconto_fixo' ? fatia.valor : 0

      const erroCupom = await criarCupom({
        id: `coupon-${code}`,
        code,
        name: `${fatia.nome} — Roleta`,
        description: `Prêmio da roleta do ${config.nomePrograma}`,
        type: tipoCupom,
        discount: desconto,
        minOrder: 0,
        maxUses: 1,
        usedCount: 0,
        validFrom: hoje.toISOString(),
        validUntil: validade.toISOString(),
        active: true,
        createdAt: hoje.toISOString(),
      })
      if (erroCupom) {
        return NextResponse.json({ ok: false, error: `Falha ao gerar o cupom: ${erroCupom.message}` }, { status: 500 })
      }
      registro.couponCode = code
    }

    const erro = await writeLoyaltyRow({ config, redemptions: [...redemptions, registro] })
    if (erro) return NextResponse.json({ ok: false, error: erro.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      indice,          // onde a roleta deve parar
      fatia,
      premio: fatia.tipo !== 'nada',
      couponCode: registro.couponCode || null,
      girosRestantes: Math.max(0, saldo.girosDisponiveis - 1),
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'Requisição inválida' }, { status: 400 })
  }
}
